const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-southeast-1' });
const SignupDao = require("./signupDao");
const { handleExceptions } = require("./handleException");
const { challengeObj, } = require("./responseCodes")
let moment = require('/opt/node_modules/moment');
const SNS = new AWS.SNS();

const { getParametersMap } = require('/opt/ssm/paramLoader')
var { errorsCustomObj } = require("./errors");
var log4js = require('/opt/node_modules/log4js');
var logger = log4js.getLogger();
AWS.config.update({
    region: 'ap-southeast-1'
});
const { changePhoneActionDetails, verifyPhoneActionDetails, sendPhoneCodeActionDetails } = require("./PhoneActionsSchema");

const { validator } = require("./Validator");
const cisp = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
});
let loadEnvValues;

let isExceptionExempted;



exports.handler = async (event) => {
    let requestDetails = {};
    requestDetails = JSON.parse(JSON.stringify(event.body));
    requestDetails.payload = requestDetails.payload ? requestDetails.payload : {};
    requestDetails.payload.username = event.user_info.email;
    if (!loadEnvValues) {
        try {
            await loadSSMFunction()
            logger.level = loadEnvValues.get("ph_loggerLevel");
        } catch (err) {
            logger.fatal('Loading SSM Failed ', err);
            let errorRes = errorsCustomObj["LoadSSMFailedException"];
            throw new Error(createResponse(errorRes.statusCode, errorRes.errorCode, 'string'))
        }
    };

    try {
        let result;
        switch (requestDetails.action) {
            case 'sendPhoneCode':
                await validator(sendPhoneCodeActionDetails(), event.body);
                result = await sendPhoneCodeFunction(requestDetails);
                break;
            case 'verifyPhone':
                await validator(verifyPhoneActionDetails(), event.body);
                result = await verifyPhoneFunction(requestDetails);
                break;
            case 'changePhone':
                await validator(changePhoneActionDetails(), event.body);
                result = await changePhoneFunction(requestDetails);
                break;
            default:
                let errObj = errorsCustomObj["ActionNotSupported"]
                throw new Error(createResponse(errObj.statusCode, errObj.errorCode, 'string'));


        }
        return result;
    } catch (error) {
        logger.fatal('Error Occured in Processing Action ', error);
        if (error.origin == "joi") {
            throw new Error(createResponse(error.statusCode, error.errorCode, 'string'));
        }
        throw error;
    }

}

/*
Loads userpool and client id from parameter store.
*/
let loadSSMFunction = async () => {
    if (loadEnvValues === undefined) {
        const keyArray = '{"Keys":["ph_customer_clientId","ph_customer_userpoolId","ph_dateTimeFormat","ph_phoneCodeSendAllowed","ph_phoneCodeVerifyAllowed","ph_phoneCodeValidTimeLimit","ph_phoneCodeValidTimeFormat","ph_phoneCodeVerifyBlockTimeLimit","ph_phoneCodeSendBlockTimeLimit","ph_phoneChangeAllowed","ph_loggerLevel","ph_customer_sessionValidationTime"]}';
        try {
            loadEnvValues = await getParametersMap(keyArray)
            return true;
        } catch (error) {
            return false
        }
    }
    return true;
}

/*
creates response object
*/
const createResponse = (statusCode, errorCode, type) => {
    const resp = {
        statusCode,
        errorCode: errorCode
    }
    if (type && type === 'string') {
        return JSON.stringify(resp);
    } else {
        return resp;
    }
}


const sendPhoneCodeFunction = async (requestDetails) => {
    try {
        let userDetails = await SignupDao.getDataFromDb(SignupDao.prepareParamToGetUser(requestDetails.payload.username));
        userDetails = userDetails.Item || userDetails || {}
        if (!Object.keys(userDetails).length) {
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserNotFoundExceptionInDb");
        }
        else if (!userDetails.emailVerified) {
            const responseObj = challengeObj["verifyEmail"]
            return responseObj;
        }
        else if (userDetails.phoneVerified) {
            const responseObj = challengeObj["login"]
            return responseObj;
        }

        let isUserAllowed = await phoneCodeSendAllowedFunction(userDetails);
        if (!isUserAllowed) {
            await pushToUsersBlockTable(userDetails.id, errorsCustomObj['UserBlockedForSendPhoneCode'], loadEnvValues.get("ph_phoneCodeSendBlockTimeLimit"))
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserBlockedForSendPhoneCode");
        }
        let otp = generateRandomCode();
        let phoneCodeSendDateTime = await sendSMS(userDetails.phoneNumber, otp);
        await SignupDao.putDataIntoDb(SignupDao.prepareParamToPutUserOTPDetail(userDetails.id, phoneCodeSendDateTime, otp, "signup_phone_verify", userDetails.phoneNumber));
        await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateUserOTP(userDetails, phoneCodeSendDateTime, loadEnvValues.get("ph_phoneCodeSendAllowed")));
        const responseObj = challengeObj["verifyPhone"]
        return responseObj;
    } catch (err) {
        console.log(err);
        if (isExceptionExempted)
            throw err;
        else
            await handleExceptions(err, requestDetails);
    }
}


let calculateTimeDiff = (date) => {
    var now = moment(new Date(), loadEnvValues.get("ph_dateTimeFormat")); //todays date
    var end = moment(date, loadEnvValues.get("ph_dateTimeFormat")); // another date
    var duration = moment.duration(now.diff(end));
    var days = duration.asDays();
    return duration.asMinutes();
}

const phoneCodeSendAllowedFunction = async (userDetails) => {
    const { phoneVerifyCodeSentCount, lastPhoneVerifyCodeSentDateTime, totalPhoneVerifyCodeSentCount } = userDetails;
    if (phoneVerifyCodeSentCount && lastPhoneVerifyCodeSentDateTime && totalPhoneVerifyCodeSentCount) {
        if (phoneVerifyCodeSentCount >= loadEnvValues.get("ph_phoneCodeSendAllowed")) {
            let timeDiff = calculateTimeDiff(lastPhoneVerifyCodeSentDateTime);
            // calculating time gap between last phone code requested time and current time
            if (timeDiff > loadEnvValues.get("ph_phoneCodeSendBlockTimeLimit")) { // check if the time gap is more than blocking time   
                return true;
            } else {
                return false; // user not allowed and still blocked
            }
        } else {
            return true;
        }
    } else {
        return true;
    }

}





const sendSMS = async (phoneNumber, otp) => {
    let params = generateParamsForMessage(phoneNumber, otp);
    return new Promise((resolve, reject) => {
        SNS.publish(params, (err, data) => {
            if (err) {
                logger.fatal('Error Occured While Sending SMS', err);
                err.origin = "sns"
                reject(err);
            } else {
                var dateTime = moment(new Date()).format(loadEnvValues.get("ph_dateTimeFormat"));
                resolve(dateTime);
            }
        })

    })
}


const generateParamsForMessage = (phone, otp) => {
    return {
        Message: `Dear Customer, Please confirm your phone number to complete your registration. Your verification code is ${otp} and expires in ${loadEnvValues.get('ph_phoneCodeValidTimeLimit')} minutes.\nThanks,\nThe Credit Culture Dev Team. `,
        MessageStructure: "string",
        PhoneNumber: phone
    }
}

const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000)
}


const verifyPhoneFunction = async (requestDetails) => {

    try {
        let userDetails = await SignupDao.getDataFromDb(SignupDao.prepareParamToGetUser(requestDetails.payload.username));
        userDetails = userDetails.Item || userDetails || {}
        if (!Object.keys(userDetails).length) {
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserNotFoundExceptionInDb");
        }
        else if (userDetails.phoneVerified) {
            const responseObj = challengeObj["login"]
            return responseObj;
        }
        let isUserAllowed = await phoneCodeVerifyAllowedFunction(userDetails);
        let phoneCodeVerifyDateTime = moment(new Date()).format(loadEnvValues.get("ph_dateTimeFormat"));

        if (!isUserAllowed) {
            await pushToUsersBlockTable(userDetails.id, errorsCustomObj['UserBlockedForVerifyPhone'], loadEnvValues.get("ph_phoneCodeVerifyBlockTimeLimit"))
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserBlockedForVerifyPhone");
        }
        let userOTP = await SignupDao.query(SignupDao.prepareParamsToGetOTP(requestDetails.payload.username, loadEnvValues.get("ph_dateTimeFormat")));
        userOTP = userOTP.Items
        userOTP = userOTP[userOTP.length - 1] || ""
        if (userOTP.code === requestDetails.payload.code) {
            isUserAllowed = await isPhoneCodeExpired(userOTP.dateTime);
            if (!isUserAllowed) {
                await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateUserOTPVerify(userDetails, phoneCodeVerifyDateTime, loadEnvValues.get("ph_phoneCodeVerifyAllowed")));
                isExceptionExempted = true;
                await handleExceptions("", requestDetails, "UserOTPExpired");
            } else {
                await updatePhoneInCognito("verifyPhone", requestDetails);
                await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateVerifyPhone(requestDetails.payload.username, phoneCodeVerifyDateTime));
                let sessionStartTime = getDateTime(loadEnvValues.get("ph_dateTimeFormat"));
                let sessionEndTime = addMinutesToDate(loadEnvValues.get("ph_customer_sessionValidationTime"), sessionStartTime);
                let sessionDetails = SignupDao.prepareParamToPutUserSession(requestDetails.payload.username, requestDetails.payload.isRemembered, sessionStartTime, sessionEndTime)
                await SignupDao.putDataIntoDb(sessionDetails);
                sessionDetails = sessionDetails.payload
                let sessionData = {
                    sessionId: sessionDetails.sessionId,
                    sessionEndTime: sessionEndTime
                }
                if (requestDetails.payload.isRemembered) {
                    sessionData.deviceId = sessionDetails.deviceId
                    sessionData.deviceSecret = sessionDetails.deviceSecret
                }
                const responseObj = createLoginResponse(200, sessionData);
                return responseObj;
            }
        } else {
            await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateUserOTPVerify(userDetails, phoneCodeVerifyDateTime, loadEnvValues.get("ph_phoneCodeVerifyAllowed")));
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserOTPIncorrect");
        }
    } catch (err) {
        console.log(err);
        if (isExceptionExempted)
            throw err;
        else
            await handleExceptions(err, requestDetails);
    }
}


const isPhoneCodeExpired = async (lastOTPSentDateTime) => {
    let timeDiff = calculateTimeDiff(lastOTPSentDateTime);
    if (timeDiff > loadEnvValues.get("ph_phoneCodeValidTimeLimit")) {
        return false;
    } else {
        return true;
    }

}

const phoneCodeVerifyAllowedFunction = async (userDetails) => {
    const { phoneCodeVerifyInvalidAttemptCount, lastPhoneCodeVerifyInvalidAttemptDateTime, totalPhoneCodeVerifyInvalidAttemptCount } = userDetails;
    if (phoneCodeVerifyInvalidAttemptCount && lastPhoneCodeVerifyInvalidAttemptDateTime && totalPhoneCodeVerifyInvalidAttemptCount) {
        if (phoneCodeVerifyInvalidAttemptCount >= loadEnvValues.get("ph_phoneCodeVerifyAllowed")) {
            let timeDiff = calculateTimeDiff(lastPhoneCodeVerifyInvalidAttemptDateTime);// calculating time gap between last phone code requested time and current time
            if (timeDiff > loadEnvValues.get("ph_phoneCodeVerifyBlockTimeLimit")) { // check if the time gap is more than blocking time   
                let phoneCodeVerifyDateTime = moment(new Date()).format(loadEnvValues.get("ph_dateTimeFormat"));
                await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUnblockUserPhoneVerify(userDetails.id, phoneCodeVerifyDateTime));
                return true;
            } else {
                return false; // user not allowed and still blocked
            }
        } else {
            return true;
        }

    } else {
        return true;
    }
}

const updatePhoneInCognito = async (phoneAction, requestDetails) => {
    let params = createPhoneUpdateParams(phoneAction, requestDetails);
    return new Promise((resolve, reject) => {
        cisp.adminUpdateUserAttributes(params, function (err, data) {
            if (err) {
                logger.fatal('Error Occured While Updating Phone in Cognito ', err);
                err.origin = "cognito";
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
}

const createPhoneUpdateParams = (phoneAction, requestDetails) => {
    let params;
    if (phoneAction === "verifyPhone") {
        params = {
            UserAttributes: [
                {
                    Name: 'phone_number_verified',
                    Value: 'true'
                },

            ],
            UserPoolId: loadEnvValues.get("ph_customer_userpoolId"),
            Username: requestDetails.payload.username
        };
    } else if (phoneAction === "changePhone") {
        params = {
            UserAttributes: [
                {
                    Name: "phone_number",
                    Value: requestDetails.payload.phoneNumber
                }
            ],
            UserPoolId: loadEnvValues.get("ph_customer_userpoolId"),
            Username: requestDetails.payload.username
        }
    }
    return params;
}


const changePhoneFunction = async (requestDetails) => {
    try {
        let userDetails = await SignupDao.getDataFromDb(SignupDao.prepareParamToGetUser(requestDetails.payload.username));
        userDetails = userDetails.Item || userDetails || {}
        if (!Object.keys(userDetails).length) {
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserNotFoundExceptionInDb");
        }
        else if (!userDetails.emailVerified) {
            const responseObj = challengeObj["resendEmail"]
            return responseObj;
        }
        else if (userDetails.phoneVerified) {
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserNotAllowedToChangePhone");
        }

        let isUserAllowed = await phoneChangeAllowedFunction(userDetails);
        if (!isUserAllowed) {
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "UserBlockedForChangePhone");
        }
        isUserAllowed = await phoneAlreadyExistCheckFunction(requestDetails.payload.phoneNumber);
        if (!isUserAllowed) {
            isExceptionExempted = true;
            await handleExceptions("", requestDetails, "PhoneAlreadyExist");
        }
        var phoneChangeDateTime = moment(new Date()).format(loadEnvValues.get("ph_dateTimeFormat"));
        await updatePhoneInCognito("changePhone", requestDetails);
        await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateChangePhone(requestDetails.payload.username, requestDetails.payload.phoneNumber, userDetails, phoneChangeDateTime));
        const responseObj = challengeObj["sendPhoneCode"]
        return responseObj;
    } catch (err) {
        if (isExceptionExempted)
            throw err;
        else
            await handleExceptions(err, requestDetails);
    }
}

const phoneChangeAllowedFunction = (userDetails) => {
    const { phoneChangeCount } = userDetails;
    if (phoneChangeCount) {
        if (phoneChangeCount >= loadEnvValues.get("ph_phoneChangeAllowed")) {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
}


const phoneAlreadyExistCheckFunction = async (phoneNumber) => {
    const { Items } = await SignupDao.query(SignupDao.prepareParamsToQueryUserPhoneNumber(phoneNumber));
    return Items.length > 0 ? false : true

}

const addMinutesToDate = (minutes, date) => {
    let currentTime = moment(date, loadEnvValues.get("ph_dateTimeFormat"))
        .add(minutes, 'minutes')
    logger.info('15 mintues date:', currentTime)
    return currentTime.format(loadEnvValues.get("ph_dateTimeFormat"))
}

const getDateTime = (dateTimeFormat) => {
    return moment(new Date()).format(dateTimeFormat);
}


const createLoginResponse = (statusCode, sessionData) => {
    const resp = {
        statusCode: statusCode,
        sessionData: sessionData
    }
    return resp;
}

const pushToUsersBlockTable = async (username, errorObj, minutes) => {
    const format = loadEnvValues.get("ph_dateTimeFormat")
    const currentTime = getDateTime(format)
    const blockTill = addMinutesToDate(currentTime, minutes, format)
    const pePut = SignupDao.prepareParamsForPutUserBlockData(username, currentTime, blockTill, "custom", errorObj.statusCode, errorObj.errorCode)
    await SignupDao.putDataIntoDb(pePut)
}





































