const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-southeast-1' });
const SignupDao = require("./signUpDao");
const { handleExceptions } = require("./handleException")
let moment = require('moment');
const SNS = new AWS.SNS();
let { getParametersMap } = require('./paramLoader');
AWS.config.update({
    region: 'ap-southeast-1'
});
const cisp = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
});
let loadEnvValues;

let isExceptionExempted;

exports.handler = async (event) => {
    let requestDetails = event.body;
    requestDetails.payload = requestDetails.payload ? requestDetails.payload : {}
    requestDetails.payload.username = event.user_info.email;
    if (!loadEnvValues) {
        try {
            await loadSSMFunction()
        } catch (err) {
            const body = 'Error loading configuration.'
            throw new Error(createResponse(400, body, 'string'));
        }
    };

    try {
        let result;
        switch (requestDetails.action) {
            case 'sendPhoneCode':
                result = await sendPhoneCodeFunction(requestDetails);
                break;
            case 'verifyPhone':
                result = await verifyPhoneFunction(requestDetails);
                break;
            case 'changePhone':
                result = await changePhoneFunction(requestDetails);
                break;
            default:
                throw new Error(createResponse(400, 'Action not supported', 'string'));

        }
        return result;
    } catch (error) {
        throw error;
    }

}

/*
Loads userpool and client id from parameter store.
*/
let loadSSMFunction = async () => {
    if (loadEnvValues === undefined) {
        const keyArray = '{"Keys":["ph_customer_clientId","ph_customer_userpoolId","ph_dateTimeFormat","ph_phoneCodeSendAllowed","ph_phoneCodeVerifyAllowed","ph_phoneCodeValidTimeLimit","ph_phoneCodeValidTimeFormat","ph_phoneCodeVerifyBlockTimeLimit","ph_phoneCodeSendBlockTimeLimit","ph_phoneChangeAllowed"]}';

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
const createResponse = (statusCode, body, type) => {
    const resp = {
        statusCode,
        body: body
    }
    if (type && type === 'string') {
        return JSON.stringify(resp);
    } else {
        return resp;
    }
}


const sendPhoneCodeFunction = async (requestDetails) => {
    console.log(loadEnvValues)
    try {
        let userDetails = await SignupDao.getDataFromDb(SignupDao.prepareParamToGetUser(requestDetails.payload.username));
        userDetails = userDetails.Item || userDetails || {}
        if (!Object.keys(userDetails).length) {
            const body = "Invalid User. Please Contact Customer Support";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"))
        }
        if (userDetails.phoneVerified) {
            const body = "Phone Already Verified"
            return createResponse(200, body);
        }
        if (!userDetails.emailVerified) {
            const body = "User Not Allowed to Send Phone Code. Verify Email First"
            throw new Error(createResponse(400, body, "string"));
        }

        let isUserAllowed = await phoneCodeSendAllowedFunction(userDetails);
        if (!isUserAllowed) {
            const body = "Too Many UnSuccessful Attempts Please Try Again Later";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"));

        }
        let otp = generateRandomCode();
        let phoneCodeSendDateTime = await sendSMS(userDetails.phoneNumber, otp);
        await SignupDao.putDataIntoDb(SignupDao.prepareParamToPutUserOTPDetail(userDetails.id, phoneCodeSendDateTime, otp, "signup_phone_verify"));
        await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateUserOTP(userDetails, phoneCodeSendDateTime, loadEnvValues.get("ph_phoneCodeSendAllowed")));
        const body = {
            message: "One Time PassCode has been Sent to your Mobile !! Please Verify To Continue....",
            action: "verifyPhone"
        }
        return createResponse(200, body);
    } catch (err) {
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
                // console.error("SNS Error :", err);
                err.origin = "cognito"
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
        Message: `Welcome to Credit Culture!! Your Verification code  is ${otp}`,
        MessageStructure: "string",
        PhoneNumber: phone
    }
}

const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000)
}


const verifyPhoneFunction = async (requestDetails) => {

    try {
        console.log(loadEnvValues)
        let userDetails = await SignupDao.getDataFromDb(SignupDao.prepareParamToGetUser(requestDetails.payload.username));
        userDetails = userDetails.Item || userDetails || {}
        //todo- fetch phone and user info from idToken.
        if (!Object.keys(userDetails).length) {
            const body = "User Not Allowed to Verify Phone Code"
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"))
        }
        if (userDetails.phoneVerified) {
            const body = "Phone Already Verified"
            return createResponse(200, body);
        }

        let isUserAllowed = await phoneCodeVerifyAllowedFunction(userDetails);
        let phoneCodeVerifyDateTime = moment(new Date()).format(loadEnvValues.get("ph_dateTimeFormat"));

        if (!isUserAllowed) {
            const body = "Too Many UnSuccessful Code Verify Attempts Please Try Again Later"
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"));
        }
        let userOTP = await SignupDao.query(SignupDao.prepareParamsToGetOTP(requestDetails.payload.username, loadEnvValues.get("ph_phoneCodeValidTimeLimit"), loadEnvValues.get("ph_phoneCodeValidTimeFormat"), loadEnvValues.get("ph_dateTimeFormat")));
        userOTP = userOTP.Items
        if (userOTP.length <= 0) {

            await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateUserOTPVerify(userDetails, phoneCodeVerifyDateTime, loadEnvValues.get("ph_phoneCodeVerifyAllowed")));
            const body = "Your OTP Code has Expired";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"));
        }
        userOTP = userOTP[userOTP.length - 1] || ""
        if (userOTP.code === requestDetails.payload.code) {
            await updatePhoneInCognito("verifyPhone", requestDetails);
            await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateVerifyPhone(requestDetails.payload.username));
            const body = {
                verify: "login"
            }
            return createResponse(200, body);

        } else {

            await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateUserOTPVerify(userDetails, phoneCodeVerifyDateTime, loadEnvValues.get("ph_phoneCodeVerifyAllowed")));
            const body = "You Provided Wrong Code Please Try Again...";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"));
        }
    } catch (err) {
        if (isExceptionExempted)
            throw err;
        else
            await handleExceptions(err, requestDetails);
    }
}

const phoneCodeVerifyAllowedFunction = async (userDetails) => {
    const { phoneCodeVerifyInvalidAttemptCount, lastPhoneCodeVerifyInvalidAttemptDateTime, totalPhoneCodeVerifyInvalidAttemptCount } = userDetails;
    if (phoneCodeVerifyInvalidAttemptCount && lastPhoneCodeVerifyInvalidAttemptDateTime && totalPhoneCodeVerifyInvalidAttemptCount) {
        if (phoneCodeVerifyInvalidAttemptCount >= loadEnvValues.get("ph_phoneCodeVerifyAllowed")) {
            let timeDiff = calculateTimeDiff(lastPhoneCodeVerifyInvalidAttemptDateTime);// calculating time gap between last phone code requested time and current time
            if (timeDiff > loadEnvValues.get("ph_phoneCodeVerifyBlockTimeLimit")) { // check if the time gap is more than blocking time   
                await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUnblockUserPhoneVerify(userDetails.id));
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
                // console.error("Error While Updating Phone in Cognito :", err);
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
        console.log(userDetails);
        if (!Object.keys(userDetails).length || userDetails.phoneVerified) {
            const body = "User Not Allowed to Change Phone";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"))
        }
        if (!userDetails.emailVerified) {
            const body = "User Not Allowed to Change Phone. Please Verify Email First";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"))
        }
        let isUserAllowed = await phoneChangeAllowedFunction(userDetails);
        if (!isUserAllowed) {
            const body = "Change Phone Limit Reached.User Not Allowed To Change Phone ";
            isExceptionExempted = true;
            throw new Error(createResponse(400, body, "string"));

        }
        var phoneChangeDateTime = moment(new Date()).format(loadEnvValues.get("ph_dateTimeFormat"));
        await updatePhoneInCognito("changePhone", requestDetails);
        await SignupDao.updateDataIntoDb(SignupDao.prepareParamToUpdateChangePhone(requestDetails.payload.username, requestDetails.payload.phoneNumber, userDetails, phoneChangeDateTime));
        const body = {
            challenge: "login",
            message: "User Phone Updated Successfully!!"
        }
        return createResponse(200, body);

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

let json = {
    body: {
        action: "changePhone",
        payload: {
            phoneNumber: "+918888888888"
        }
    },
    user_info: {
        email: "jay.gupta@creditculture.sg"
    }
}

exports.handler(json).then((data) => {
    console.log(data);
})