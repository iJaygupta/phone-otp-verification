const ParamExpressions = require('./ParamExpressions') 
 
 
class ParamExpressionsUpdate extends ParamExpressions{ 
 
    constructor(){ 
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
    createParams(params){ 
        
        params['TableName'] = this.tableName; 
     
        if(!params['Key']){/*Required*/ 
            params['Key']={}; 
            //value of partition key and sort key can be changed while creating paramExpression for gsi and lsi. 
            params= this._utilsParams(params,'Key', this.partitionKey, this.partitionKeyValue) 
             
             if(this.sortKey){ 
                params= this._utilsParams(params,'Key', this.sortKey, this.sortKeyValue) 
            }  
        } 
 
 
        if(this.keyConditionExpression){ 
            params['KeyConditionExpression'] = this.keyConditionExpression; 
        } 
         
        if(this.expressionAttributeNames){ 
            params['ExpressionAttributeNames'] = this.expressionAttributeNames; 
        } 
         
        if(this.expressionAttributeValues){ 
            params['ExpressionAttributeValues'] =this.expressionAttributeValues; 
        } 
        if(this.updateExpression){ 
            params['UpdateExpression'] =this.updateExpression; 
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
     
    _utilsParams(params,parentKey,key,value){ 
        //console.log('Entered into _utilsParams',key,value) 
        //console.log(typeof value) 
        switch (typeof value) { 
            case 'string': 
                params[parentKey][`${key}`]=`${value}`; 
                break; 
            case 'number': 
                params[parentKey][`${key}`]=value; 
                break; 
            case 'boolean': 
                params[parentKey][`${key}`]=value; 
                break; 
            case 'object': 
                params[parentKey][`${key}`]=value; 
                break; 
            default: 
            console.log('we have the object here...'+ typeof value) 
                break; 
        } 
        return params 
    } 
     
} 
 
module.exports=ParamExpressionsUpdate; 