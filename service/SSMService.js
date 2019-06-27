let SSM = require('../config/SSMConfig');  
  
/**  
 * Class to connect to AWS parameter store using AWS SDK and fetch the values for the Keys JSON  
 */  
class SSMService {  
  
    /**  
     * Constructor to initialize required Variables and arrays  
     */  
    constructor(){  
        this.queryArr = [];  
        this.valuesArray = [];  
        this.chunkSize = 10;  
    }  
     
  
    /**  
    *   
    * @param {*} keyArray - Array of keys extracted from JSON string  
    * Since ssm can yield maximum 10 keys at a time, we are dividing the keys array into chunks of 10  
    */  
    divideKeyArrayToChunks(keyArray) {  
        if (keyArray.length > 10) {  
            this.queryArr = keyArray.map((element, index) => {  
                return index % this.chunkSize === 0 ? keyArray.slice(index, index + this.chunkSize) : null;  
            }).filter((element) => {  
                return element;  
            });  
        }  
        else {  
            this.queryArr.push(keyArray);  
        }  
        return this.queryArr;  
    }  
  
    /**  
     * Function to create queries and fetch values for all keys.  
     * Async function/ Entry point from index.js to fetch SSM parameters  
     */  
    async fetchValuesFromAWS(keyArray) { 
        console.log('keyArray:',keyArray); 
        const KEYSARRAYCHUNKS = this.divideKeyArrayToChunks(keyArray);  
        if (KEYSARRAYCHUNKS.length > 0) {  
            let query;  
            for (let arrChunk of KEYSARRAYCHUNKS) {  
                query = {  
                    "Names": arrChunk,  
                    "WithDecryption": true  
                }  
                try {  
                    let responseFromPromise = await this.runQueriesUsingPromise(query);  
                    this.valuesArray.push(responseFromPromise)  
                }  
                catch (ex) {  
                    console.error('fetchValuesFromAWS Error is ' + ex);  
                }  
            }  
        }  
        return this.valuesArray;  
    }  
  
    /**  
    *   
    * @param {*} ssm - The SSM object  
    * @param {*} query - Query to fetch values for the keys.  
    * Running Promise for each chunk of size 10  
    */  
    runQueriesUsingPromise(query) {  
        return new Promise((resolve, reject) => {  
            SSM.getParameters(query, (err, data) => {  
                if (err) {  
                    console.error('runQueriesUsingPromise Error is:' + err)  
                    reject(err);  
                }  
                else {  
                    resolve(data);  
                }  
            });  
        });  
    };  
  
}  
  
//Exporting Class for being instantiated in index.js  
module.exports = new SSMService;  