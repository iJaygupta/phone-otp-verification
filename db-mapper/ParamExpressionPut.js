/** 
 * @author Bhanu Prakash Pasupula 
 * @email bhanu.prakash@creditculture.sg 
 * @create date 2019-05-31 10:41:11 
 * @modify date 2019-05-31 10:41:11 
 * @desc [param expression put class] 
 */ 
const ParamExpressions = require('./ParamExpressions') 
 
class ParamExpressionPut extends ParamExpressions{ 
 
    constructor(){ 
        super() 
    } 
 
    createParams(params){ 
        
        params['TableName'] = this.tableName; 
         
        if(!params['Item']){/*Required*/ 
            params['Item']={}; 
            params['Item'] = this.payload  
        } 
 
        if(this.conditionExpression){ 
            params['ConditionExpression'] = this.conditionExpression  
        } 
         
        if(this.returnConsumedCapacity){ 
            params['ReturnConsumedCapacity'] = this.returnConsumedCapacity; 
        } 
        if(this.returnItemCollectionMetrics){ 
            params['ReturnItemCollectionMetrics'] = this.returnItemCollectionMetrics; 
        } 
         
        if(this.returnValues){ 
            params['ReturnValues'] = this.returnValues; 
        } 
        
        return params; 
    } 
 
} 
 
module.exports = ParamExpressionPut; 