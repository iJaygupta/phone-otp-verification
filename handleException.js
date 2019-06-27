const SignupDao = require("./signUpDao");
let moment = require('moment');
var { errorsCognitoObj, errorsSnsObj } = require("./errors")


const handleExceptions = async (exception, event) => {
    let errorObj;
    if (exception.origin === 'cognito') {
        errorObj = await handleCognitoExceptions(exception);
        if (errorObj.statusCode === 400) {
            await putErrorToDb(event.payload.username, JSON.stringify(exception), getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), 'SignUpPhoneVerify')
        }
    }
    else if (exception.origin === 'db') {
        errorObj = await handleDBExceptions(exception);
        if (errorObj.statusCode === 400) {
            await putErrorToDb(event.payload.username, JSON.stringify(exception), getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), 'SignUpPhoneVerify')
        }
    }
    else if (exception.origin === 'sns') {
        errorObj = await handleSNSExceptions(exception);
        if (errorObj.statusCode === 400) {
            await putErrorToDb(event.payload.username, JSON.stringify(exception), getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), 'SignUpPhoneVerify')
        }
    }
    else {
        console.log(JSON.stringify(exception));
        errorObj = {
            statusCode: 500,
            msg: "Error Occurred while processing request. Please try again after some time."
        }
    }
    throw new Error(createResponse(errorObj.statusCode, errorObj.errorCode, "string", errorObj.msg));
}


const handleCognitoExceptions = (error) => {
    let returnObj;
    let errorCode = errorsCognitoObj[error.code];
    switch (error.code) {
        case 'InvalidEmailRoleAccessPolicyException':
        case 'InvalidSmsRoleAccessPolicyException':
        case 'InvalidSmsRoleTrustRelationshipException':
        case 'InvalidLambdaResponseException':
        case 'AuthorizationError':
        case 'InvalidParameterException':
        case 'ResourceNotFoundException':
        case 'UnexpectedLambdaException':
        case 'UserLambdaValidationException':
        case 'AliasExistsException':
            returnObj = {
                statusCode: 500,
                msg: "Error Occurred while processing request. Please try again after some time."
            }
            break;
        case 'TooManyRequestsException':
        case 'CodeDeliveryFailureException':
        case 'ParameterValueInvalid':
        case 'InternalErrorException':
        case 'NotAuthorizedException':
        case 'UserNotFoundException':
            returnObj = {
                statusCode: 400,
                errorCode: errorCode
            }
            break
        default:
            returnObj = {
                statusCode: 500,
                msg: "Error Occurred while processing request. Please try again after some time."
            }
            break;

    }
    return returnObj;

}


const handleDBExceptions = (error) => {
    let returnObj;
    switch (error.code) {
        case 'ConditionalCheckFailedException':
        case 'InternalServerError':
        case 'ItemCollectionSizeLimitExceededException':
        case 'ProvisionedThroughputExceededException':
        case 'TransactionConflictException':
        case 'ResourceNotFoundException':
        case 'RequestLimitExceeded':
        case 'ValidationException':
            returnObj = {
                statusCode: 500,
                msg: "Error Occurred while processing request. Please try again after some time."
            }
        default:
            returnObj = {
                statusCode: 500,
                msg: "Error Occurred while processing request. Please try again after some time."
            }
    }
    return returnObj;
}

const handleSNSExceptions = (error) => {
    let returnObj;
    let errorCode = errorsSnsObj[error.code];
    switch (error.code) {
        case 'AuthorizationError':
        case 'InvalidSecurity':
        case 'KMSOptInRequired':
        case 'EndpointDisabled':
        case 'KMSAccessDenied':
        case 'KMSDisabled':
        case 'KMSInvalidState':
        case 'KMSNotFound':
        case 'KMSThrottling':
        case 'PlatformApplicationDisabled':
            returnObj = {
                statusCode: 500,
                msg: "Error Occurred while processing request. Please try again after some time."
            }
            break;
        case 'InvalidParameter':
        case 'ParameterValueInvalid':
            returnObj = {
                statusCode: 400,
                errorCode: errorCode

            }
            break;
        default:
            returnObj = {
                statusCode: 500,
                msg: "Error Occurred while processing request. Please try again after some time."
            }
            break;
    }
    return returnObj;
}
const createResponse = (statusCode, errorCode, type, body) => {
    var resp;
    resp = body ? {
        statusCode,
        body
    } : {
            statusCode,
            errorCode
        }

    if (type && type === 'string') {
        return JSON.stringify(resp);
    } else {
        return resp;
    }
}

const getDateTime = (dateTimeFormat) => {
    return moment(new Date()).format(dateTimeFormat);
}

const putErrorToDb = async (username, error, dateTime, type) => {
    try {

        await SignupDao.putDataIntoDb(SignupDao.prepareErrorParams(username, error, dateTime, type));
    } catch (err) {
        console.log(err);
    }
}



module.exports = { handleExceptions }

// let event = {
//     action: "changePhone",
//     payload: {
//         "username": "jay.gupta@creditculture.sg"
//     }
// }

// let exception = {
//     origin: "cognito",
//     code: "UserNotFoundException"
// }


// handleExceptions(exception, event).then((data) => {
//     console.log(data);
// })
