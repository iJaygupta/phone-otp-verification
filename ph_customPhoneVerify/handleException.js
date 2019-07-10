const SignupDao = require("./signupDao");
let moment = require('/opt/node_modules/moment');
const { errorsCognitoObj, errorsDbObj, errorsSnsObj, errorsCustomObj } = require("./errors")


const handleExceptions = async (exception, event, customException) => {
    let errorObj;

    if (customException) {
        errorObj = errorsCustomObj[customException];
        await putErrorToDb(event.payload.username, getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), event, errorsCustomObj[customException])
    }
    else if (exception.origin === 'cognito') {
        errorObj = errorsCognitoObj[exception.code];
        if (errorObj.statusCode === 400) {
            await putErrorToDb(event.payload.username, getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), event, errorsCognitoObj[exception.code], exception)
        }
    }
    else if (exception.origin === 'db') {
        errorObj = errorsDbObj[exception.code];
        if (errorObj.statusCode === 400) {
            await putErrorToDb(event.payload.username, getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), event, errorsDbObj[exception.code], exception)
        }
    }
    else if (exception.origin === 'sns') {
        errorObj = errorsSnsObj[exception.code];
        if (errorObj.statusCode === 400) {
            await putErrorToDb(event.payload.username, getDateTime("YYYY-MM-DDTHH:mm:ss.SSS"), event, errorsSnsObj[exception.code], exception)
        }
    }
    else {
        errorObj = {
            statusCode: 500
        }
    }
    throw new Error(createResponse(errorObj.statusCode, errorObj.errorCode, "string"));
}


const createResponse = (statusCode, errorCode, type) => {
    var resp;
    resp = statusCode == 500 ? {
        statusCode,

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

const putErrorToDb = async (username, dateTime, event, customError, error) => {
    try {
        await SignupDao.putDataIntoDb(SignupDao.prepareErrorParams(username, dateTime, event, customError, error));
    } catch (err) {
        console.log(err);
    }
}



module.exports = { handleExceptions }


