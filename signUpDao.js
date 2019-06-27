const Dao = require('./db/db-dao/Dao');
const { ParamExpressionPut } = require('./dbModules'); //CHange in Lambda    
const { ParamExpressionUpdate } = require('./dbModules');
const { ParamExpressionGet } = require('./dbModules');
const { ParamExpressionsQuery } = require('./dbModules');

const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-southeast-1" });
let moment = require('moment');
const docClient = new AWS.DynamoDB.DocumentClient();
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


    prepareErrorParams(username, error, dateTime, type) {
        let pePut = new ParamExpressionPut();
        pePut.tableName = usersErrorTableSchema.tableName;
        pePut.payload = {
            [usersErrorTableSchema.partitionKeyName]: username,
            error: error,
            [usersErrorTableSchema.sortKeyName]: dateTime,
            type: type
        }
        return pePut;
    }

    prepareParamsToGetOTP(userName, validTimeLimit, validTimeFormat, globalTimeFormat) {
        let peQuery = new ParamExpressionsQuery();
        var dateTime = new Date();
        peQuery.tableName = usersOtpTableSchema.tableName
        peQuery.keyConditionExpression = 'id = :username AND #phoneVerifyCodeSentDateTime BETWEEN :fromDateTime AND :toDateTime '
        peQuery.expressionAttributeValues = {
            ':fromDateTime': moment(dateTime).subtract(validTimeLimit, validTimeFormat).format(globalTimeFormat),
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
        console.log("phoneCodeSendAllowed", phoneCodeSendAllowed)
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = userDetails.id;
        peUpdate.expressionAttributeValues = {
            ":phoneVerifyCodeSentValue": userDetails.phoneVerifyCodeSentCount ? userDetails.phoneVerifyCodeSentCount >= phoneCodeSendAllowed ? 1 : userDetails.phoneVerifyCodeSentCount + 1 : 1,
            ":lastPhoneVerifyCodeSentDateTimeValue": phoneCodeSendDateTime,
            ":totalPhoneVerifyCodeSentValue": userDetails.totalPhoneVerifyCodeSentCount ? userDetails.totalPhoneVerifyCodeSentCount + 1 : 1
        }
        peUpdate.updateExpression = "SET phoneVerifyCodeSentCount=:phoneVerifyCodeSentValue , lastPhoneVerifyCodeSentDateTime=:lastPhoneVerifyCodeSentDateTimeValue ,totalPhoneVerifyCodeSentCount=:totalPhoneVerifyCodeSentValue";
        return peUpdate;
    }


    prepareParamToPutUserOTPDetail(username, dateTime, otp, type) {
        let pePut = new ParamExpressionPut();
        pePut.tableName = usersOtpTableSchema.tableName;
        pePut.payload = {
            [usersOtpTableSchema.partitionKeyName]: username,
            [usersOtpTableSchema.sortKeyName]: dateTime,
            type: type,
            code: otp
        }
        return pePut;
    }

    prepareParamToUpdateVerifyPhone(username) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = username;
        peUpdate.expressionAttributeValues = {
            ":phoneVerifiedValue": true
        }
        peUpdate.updateExpression = `SET phoneVerified=:phoneVerifiedValue`;
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
            ":phoneChangeDateTimeValue": phoneChangeDateTime
        }
        peUpdate.updateExpression = "SET phoneNumber=:phoneNumberValue ,phoneVerified=:phoneVerifiedValue, phoneChangeCount=:phoneChangeCountValue ,phoneChangeDateTime=:phoneChangeDateTimeValue";
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
            ":totalPhoneCodeVerifyInvalidAttemptCountValue": userDetails.totalPhoneCodeVerifyInvalidAttemptCount ? userDetails.totalPhoneCodeVerifyInvalidAttemptCount + 1 : 1
        }
        peUpdate.updateExpression = "SET phoneCodeVerifyInvalidAttemptCount=:phoneCodeVerifyInvalidAttemptCountValue , lastPhoneCodeVerifyInvalidAttemptDateTime=:lastPhoneCodeVerifyInvalidAttemptDateTimeValue ,totalPhoneCodeVerifyInvalidAttemptCount=:totalPhoneCodeVerifyInvalidAttemptCountValue";
        return peUpdate;
    }
    prepareParamToUnblockUserPhoneVerify(username) {
        let peUpdate = new ParamExpressionUpdate();
        peUpdate.tableName = usersTableSchema.tableName;
        peUpdate.partitionKey = usersTableSchema.partitionKeyName;
        peUpdate.partitionKeyValue = username;
        peUpdate.expressionAttributeValues = {
            ":phoneCodeVerifyInvalidAttemptCountValue": 0
        }
        peUpdate.updateExpression = "SET phoneCodeVerifyInvalidAttemptCount=:phoneCodeVerifyInvalidAttemptCountValue";
        return peUpdate;
    }



}

module.exports = new SignupDao();
