const AWS = require("aws-sdk");
AWS.config.update({region: process.env.region});

/**
 * Dynamo Database connection will be obtained here. 
 * This file would use default logged in credentials of api key and secret in local or 
 * and policy permissions of role in aws environment.
 */
class DdbInit{

    constructor(){
        this.dynamoDB = new AWS.DynamoDB();
        this.docClient = new AWS.DynamoDB.DocumentClient({region:'ap-southeast-1'});
    }
}
module.exports= new DdbInit()