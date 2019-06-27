
class ParamExpressions{

    constructor(){
      
      this._tableName ;
      this._partitionKey;
      this._sortKey;
      this._partitionKeyValue;
      this._sortKeyValue; 
    }

    get tableName() {
        return this._tableName;
    }
    set tableName(tableName){
        this._tableName=tableName;
    }

    set partitionKeyValue(partitionKeyValue){
      this._partitionKeyValue= partitionKeyValue;
    }

    set sortKeyValue(sortKeyValue){
        this._sortKeyValue= sortKeyValue;
    }

    get partitionKeyValue(){
        return this._partitionKeyValue;
    }

    get sortKeyValue(){
        return this._sortKeyValue;
    }

    get partitionKey() {
        return this._partitionKey;
    }

    get sortKey() {
        return this._sortKey;
    }

    set partitionKey(partitionKey) {
        this._partitionKey=partitionKey;
    }

    set sortKey(sortKey) {
        this._sortKey=sortKey;
    }
}

module.exports=ParamExpressions