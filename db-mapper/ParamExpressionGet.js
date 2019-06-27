/**

 * @author Bhanu Prakash Pasupula

 * @email bhanu.prakash@creditculture.sg

 * @create date 2019-06-11 10:48:39

 * @modify date 2019-06-11 10:48:39

 * @desc [description]

 */
const ParamExpressions = require("./ParamExpressions");

class ParamExpressionGet extends ParamExpressions {
  constructor() {
    super();
  }

  createParams(params) {

    params["TableName"] = this.tableName;

    if (this.Key) {
      params["Key"] = this.Key
    }

    if (this.expressionAttributeNames) {
      params["ExpressionAttributeNames"] = this.expressionAttributeNames;
    }

    if (this.indexName) {
      params["IndexName"] = this.indexName;
    }

    if (this.consistentRead) {
      params["ConsistentRead"] = this.consistentRead;
    }

    if (this.conditionExpression) {
      params["ConditionExpression"] = this.conditionExpression;
    }

    if (this.returnItemCollectionMetrics) {
      params["ReturnItemCollectionMetrics"] = this.returnItemCollectionMetrics;
    }

    if (this.projectionExpression) {
      params["ProjectionExpression"] = this.projectionExpression;
    }

    if (this.returnConsumedCapacity) {
      params["ReturnConsumedCapacity"] = this.returnConsumedCapacity;
    }

    return params;
  }


}

module.exports = ParamExpressionGet;
