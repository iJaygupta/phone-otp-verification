const ParamExpressions = require('./ParamExpressions')

class ParamExpressionsQuery extends ParamExpressions {


    constructor() {
        super();
    }

    /**
     * @yields Prepares the basic query for selecting the Item. Below query will work on the documentClient Object of DynamoDB.
     * Do not call the method directly. Pass your object to ForgeParams, 
     * or create new method
     *
     * @param {object} params
     * @returns {object} params  
     * @memberof ParamExpressionGetItem
     */
    createParams(params) {


        params['TableName'] = this.tableName;

        if (this.keyConditionExpression) {
            params['KeyConditionExpression'] = this.keyConditionExpression;
        }

        if (this.expressionAttributeNames) {
            params['ExpressionAttributeNames'] = this.expressionAttributeNames;
        }

        if (this.expressionAttributeValues) {
            params['ExpressionAttributeValues'] = this.expressionAttributeValues;
        }

        if (this.indexName) {
            params['IndexName'] = this.indexName;
        }

        if (this.filterExpression) {
            params['FilterExpression'] = this.filterExpression;
        }

        if (this.consistentRead) {
            params['ConsistentRead'] = this.consistentRead;
        }

        if (this.exclusiveStartKey) {
            params['ExclusiveStartKey'] = this.exclusiveStartKey;
        }
        if (this.limit) {
            params['Limit'] = this.limit;
        }

        if (this.projectionExpression) {
            params['ProjectionExpression'] = this.projectionExpression;
        }
        if (this.returnConsumedCapacity) {
            params['ReturnConsumedCapacity'] = this.returnConsumedCapacity;
        }
        if (this.scanIndexForward) {
            params['ScanIndexForward'] = this.scanIndexForward;
        }
        if (this.select) {
            params['Select'] = this.select;
        }

        return params;
    }


}

module.exports = ParamExpressionsQuery;