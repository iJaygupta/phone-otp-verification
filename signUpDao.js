const Dao = require('./db/db-dao/Dao');
const { ParamExpressionPut } = require('./dbModules'); //CHange in Lambda    
const { ParamExpressionUpdate } = require('./dbModules');
const { ParamExpressionGet } = require('./dbModules');
const { ParamExpressionsQuery } = require('./dbModules');

const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-southeast-1" });
let moment = require('moment');
const docClient = new AWS.DynamoDB.DocumentClient();
const cryptoRandomString = require('crypto-random-string');
const uuidv1 = require('uuid/v1');
const usersErrorTableSchema = {
    tableName: "ph_users_error",
    partitionKeyName: "id",
    sortKeyName: "dateTime"
};


const usersTableSchema = {
    tableName: "users_ph",
    partitionKeyName: "id",
}

const usersOtpTableSchema = {
    tableName: "ph_users_otp",
    partitionKeyName: "id",
    sortKeyName: "dateTime"

}

const usersTablePhoneIndexSchema = {
    tableName: "users_ph",
    partitionKeyName: "phoneNumber",
    indexName: "phoneNumber-index"
}

const sessionTableSchema = {
    tableName: "users_sessions_ph",
    partitionKeyName: "id",
    sortKeyName: "sessionId"

}
const origin = "db";

/** 
 * Task Table specific operations can be prepared from this class, once the  
 * Task is prepared then the dynamodb operations can be delegated to TableDao. 
 * 
 */


class SignupDao extends Dao {

    constructor() {
        super();
    }


    putDataIntoDb(pePut) {
        const params = pePut.createParams({});
        return new Promise((resolve, reject) => {
            docClient.put(params, function (err, data) {
                if (err) {
                    err.origin = origin;
                    reject(err)
                } else {
                    resolve(data);
                }
            });
        });

    }

    getDataFromDb(peGet) {
        const params = peGet.createParams({});
        return new Promise((resolve, reject) => {
            docClient.get(params, function (err, data) {
                if (err) {
                    err.origin = origin;
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
    }


    updateDataIntoDb(peUpdate) {
        const params = peUpdate.createParams({});
        return new Promise((resolve, reject) => {
            docClient.update(params, function (err, data) {
                if (err) {
                    err.origin = origin;
                    reject(err)
                } else {
                    resolve(data);
                }
            })
        });
    }

    query(peQuery) {
        const params = peQuery.createParams({})
        return new Promise((resolve, reject) => {
            docClient.query(params, (err, data) => {
                if (err) {
                    err.origin = origin;
                    reject(err)
                }
                resolve(data)
            })
        })
    }


    prepareParamToGetUser(userName) {
        let peGet = new ParamExpressionGet();
        peGet.tableName = usersTableSchema.tableName
        peGet.Key = {
            [usersTableSchema.partitionKeyName]: userName
        }
        return peGet
    }

    prepareErrorParams(username, dateTime, event, customError, awsError) {
        let pePut = new ParamExpressionPut();
        pePut.tableName = usersErrorTableSchema.tableName;
        if (awsError) {
            pePut.payload = {
                [usersErrorTableSchema.partitionKeyName]: username,
                [usersErrorTableSchema.sortKeyName]: dateTime,
                payload: event.payload,
                errorResponse: customError,
                awsError: awsError
            }
        } else {
            pePut.payload = {
                [usersErrorTableSchema.partitionKeyName]: username,
                [usersErrorTableSchema.sortKeyName]: dateTime,
                payload: event.payload,
                errorResponse: customError
            }
        }
        return pePut;
    }

    prepareParamsToGetOTP(userName, globalTimeFormat) {
        let peQuery = new ParamExpressionsQuery();
        var dateTime = new Date();
        peQuery.tableName = usersOtpTableSchema.tableName
        peQuery.keyConditionExpression = 'id = :username AND #phoneVerifyCodeSentDateTime <  :toDateTime '
        peQuery.expressionAttributeValues = {
            ':toDateTime': moment(dateTime).format(globalTimeFormat),
            ':username': userName,
            ':typeValue': "signup_phone_verify"
        }
        peQuery.expressionAttributeNames = {
            '#phoneVerifyCodeSentDateTime': 'dateTime',
            '#filterType': 'type'
        }
        peQuery.filterExpression = '#filterType = :typeValue';
        peQuery.scanIndexForward = true
        return peQuery;
    }


    prepareParamToUpdateUserOTP(userDetails, phoneCodeSendDateTime, phoneCodeSendAllowed) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = userDetails.id;
        peUpdate.expressionAttributeValues = {
            ":phoneVerifyCodeSentValue": userDetails.phoneVerifyCodeSentCount ? userDetails.phoneVerifyCodeSentCount >= phoneCodeSendAllowed ? 1 : userDetails.phoneVerifyCodeSentCount + 1 : 1,
            ":lastPhoneVerifyCodeSentDateTimeValue": phoneCodeSendDateTime,
            ":totalPhoneVerifyCodeSentValue": userDetails.totalPhoneVerifyCodeSentCount ? userDetails.totalPhoneVerifyCodeSentCount + 1 : 1,
            ":lastUpdatedTimeValue": phoneCodeSendDateTime,
            ":lastUpdatedByValue": userDetails.id
        }
        peUpdate.updateExpression = "SET phoneVerifyCodeSentCount=:phoneVerifyCodeSentValue , lastPhoneVerifyCodeSentDateTime=:lastPhoneVerifyCodeSentDateTimeValue ,totalPhoneVerifyCodeSentCount=:totalPhoneVerifyCodeSentValue ,lastUpdatedTime=:lastUpdatedTimeValue ,lastUpdatedBy=:lastUpdatedByValue";
        return peUpdate;
    }


    prepareParamToPutUserOTPDetail(username, dateTime, otp, type, phoneNumber) {
        let pePut = new ParamExpressionPut();
        pePut.tableName = usersOtpTableSchema.tableName;
        pePut.payload = {
            [usersOtpTableSchema.partitionKeyName]: username,
            [usersOtpTableSchema.sortKeyName]: dateTime,
            type: type,
            code: otp,
            phoneNumber: phoneNumber
        }
        return pePut;
    }

    prepareParamToUpdateVerifyPhone(username, phoneCodeVerifyDateTime) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = username;
        peUpdate.expressionAttributeValues = {
            ":phoneVerifiedValue": true,
            ":lastUpdatedTimeValue": phoneCodeVerifyDateTime,
            ":lastUpdatedByValue": username
        }
        peUpdate.updateExpression = `SET phoneVerified=:phoneVerifiedValue ,lastUpdatedTime=:lastUpdatedTimeValue ,lastUpdatedByValue=:lastUpdatedByValue`;
        return peUpdate;
    }
    prepareParamToUpdateChangePhone(username, newPhone, userDetails, phoneChangeDateTime) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = username;
        peUpdate.expressionAttributeValues = {
            ":phoneNumberValue": newPhone,
            ":phoneVerifiedValue": false,
            ":phoneChangeCountValue": userDetails.phoneChangeCount ? userDetails.phoneChangeCount + 1 : 1,
            ":phoneChangeDateTimeValue": phoneChangeDateTime,
            ":lastUpdatedTimeValue": phoneChangeDateTime,
            ":lastUpdatedByValue": username
        }
        peUpdate.updateExpression = "SET phoneNumber=:phoneNumberValue ,phoneVerified=:phoneVerifiedValue, phoneChangeCount=:phoneChangeCountValue ,phoneChangeDateTime=:phoneChangeDateTimeValue ,lastUpdatedTime=:lastUpdatedTimeValue ,lastUpdatedByValue=:lastUpdatedByValue";
        return peUpdate;
    }
    prepareParamToUpdateUserOTPVerify(userDetails, phoneCodeVerifyDateTime, phoneCodeVerifyAllowed) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = userDetails.id;
        peUpdate.expressionAttributeValues = {
            ":phoneCodeVerifyInvalidAttemptCountValue": userDetails.phoneCodeVerifyInvalidAttemptCount ? userDetails.phoneCodeVerifyInvalidAttemptCount >= phoneCodeVerifyAllowed ? 1 : userDetails.phoneCodeVerifyInvalidAttemptCount + 1 : 1,
            ":lastPhoneCodeVerifyInvalidAttemptDateTimeValue": phoneCodeVerifyDateTime,
            ":totalPhoneCodeVerifyInvalidAttemptCountValue": userDetails.totalPhoneCodeVerifyInvalidAttemptCount ? userDetails.totalPhoneCodeVerifyInvalidAttemptCount + 1 : 1,
            ":lastUpdatedTimeValue": phoneCodeVerifyDateTime,
            ":lastUpdatedByValue": userDetails.id
        }
        peUpdate.updateExpression = "SET phoneCodeVerifyInvalidAttemptCount=:phoneCodeVerifyInvalidAttemptCountValue , lastPhoneCodeVerifyInvalidAttemptDateTime=:lastPhoneCodeVerifyInvalidAttemptDateTimeValue ,totalPhoneCodeVerifyInvalidAttemptCount=:totalPhoneCodeVerifyInvalidAttemptCountValue,lastUpdatedTime=:lastUpdatedTimeValue ,lastUpdatedByValue=:lastUpdatedByValue";
        return peUpdate;
    }
    prepareParamToUnblockUserPhoneVerify(username, phoneCodeVerifyDateTime) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = username;
        peUpdate.expressionAttributeValues = {
            ":phoneCodeVerifyInvalidAttemptCountValue": 0,
            ":lastUpdatedTimeValue": phoneCodeVerifyDateTime,
            ":lastUpdatedByValue": username
        }
        peUpdate.updateExpression = "SET phoneCodeVerifyInvalidAttemptCount=:phoneCodeVerifyInvalidAttemptCountValue ,lastUpdatedTime=:lastUpdatedTimeValue ,lastUpdatedByValue=:lastUpdatedByValue";
        return peUpdate;
    }

    prepareParamsToQueryUserPhoneNumber(phoneNumber) {
        let peQuery = new ParamExpressionsQuery();
        peQuery.tableName = usersTablePhoneIndexSchema.tableName;
        peQuery.indexName = usersTablePhoneIndexSchema.indexName;
        peQuery.keyConditionExpression = `#partitionKey = :partitionkeyValue`;
        peQuery.projectionExpression = "phoneVerified"
        peQuery.filterExpression = '#filterType = :typeValue'
        peQuery.expressionAttributeNames = {
            "#partitionKey": `${[usersTablePhoneIndexSchema.partitionKeyName]}`,
            "#filterType": "phoneVerified",

        };
        peQuery.expressionAttributeValues = {
            ":partitionkeyValue": phoneNumber,
            ":typeValue": true
        };
        return peQuery;
    }


    prepareParamToPutUserSession(username, rememberflag, sessionStartTime, sessionEndTime) {
        let pePut = new ParamExpressionPut()
        pePut.tableName = sessionTableSchema.tableName
        if (rememberflag) {
            pePut.payload = {
                [sessionTableSchema.partitionKeyName]: username,
                [sessionTableSchema.sortKeyName]: this.generateSessionId(),
                deviceId: this.generateDeviceKey(),
                deviceSecret: this.generateDeviceSecret(),
                mfaVerified: true,
                lastUpdatedTime: sessionStartTime,
                lastUpdatedBy: username,
                sessionStartTime: sessionStartTime,
                sessionEndTime: sessionEndTime

            }
        } else {
            pePut.payload = {
                [sessionTableSchema.partitionKeyName]: username,
                [sessionTableSchema.sortKeyName]: this.generateSessionId(),
                mfaVerified: true,
                lastUpdatedTime: sessionStartTime,
                lastUpdatedBy: username,
                sessionStartTime: sessionStartTime,
                sessionEndTime: sessionEndTime

            }

        }
        return pePut
    }
    getDateTime(dateTimeFormat) {
        return moment(new Date()).format(dateTimeFormat);
    }
    generateDeviceKey() {
        return uuidv1()
    }

    generateDeviceSecret() {
        return cryptoRandomString({ length: 256 })
    }
    generateSessionId() {
        let uuid = uuidv1()
        const sessionId = "SID" + uuid + Math.floor(Math.random() * (9999999 - 1000000) + 1000000)
        return sessionId.replace(/[-]/g, "")
    }


}

module.exports = new SignupDao();
