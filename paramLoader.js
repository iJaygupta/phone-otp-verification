let SSM = require('./config/SSMConfig'); 
 
 
let SSMService = require('./service/SSMService');  
let invalidKeys = []; //Global Array  
let valuesGlobalMap = new Map();  //Global Map  
  
/**  
 * Module which interacts with AWS to fetch values from Parameter Store  
 * @param {*} keyArray - Input JSON Array for Keys  
 */  
const getParametersMap = async(keyArray) => {  
    try {  
        if (valuesGlobalMap.size === 0 && keyArray !== undefined && keyArray !==null ) { //Null Checks and Cold/Hot Storage checks  
            let psObj = SSMService;  
  
            //Interaction with ParameterStore Object to fetch the Values  
            let valuesFromAWS =await psObj.fetchValuesFromAWS(JSON.parse(keyArray).Keys);  
            console.log('Fetching values for provided keys...');  
            if (valuesFromAWS !== undefined || valuesFromAWS !== null) { //Null Check  
                for (let value of valuesFromAWS) {  
                    //console.log(params.Parameters.length);  
                    if (value.Parameters.length) {    
                        for (const val of value.Parameters) {  
                            valuesGlobalMap.set(`${val.Name}`,`${val.Value}`);  
                        }  
                    }  
                    else {  
                        console.log('Oops! Please check your parameter names');  
                    }  
                    if (value.InvalidParameters.length) {  
                        for (let i = 0; i <= value.InvalidParameters.length - 1; i++) {  
                            invalidKeys.push(value.InvalidParameters[i]);  
                        }  
                    }  
                }  
            }  
            else {  
                console.error('Could not fetch result for the parameters from SSM.')  
            }  
        }  
        else if (valuesGlobalMap.size > 0) {  
            console.log('Loading all the valid parameters stored in array valuesGlobalMap');  
            console.log('Invalid Keys are ', invalidKeys);  
        }  
    }  
    catch (ex) {  
        console.log('getParameters Error is: ' + ex);  
    }  
    // return {  
    //     params: valuesGlobalMap  
    // }  
    return valuesGlobalMap;  
} 
 
 
const getParamValue = function(paramName){ 
 
    var params = { 
        Name: paramName, /* required */ 
        WithDecryption: true 
      }; 
    return new Promise((resolve,reject)=>{ 
        SSM.getParameter(params,(err,data)=>{ 
            if (err) { 
                console.log('err',err); 
                reject(err) 
            } else { 
                console.log('data',data); 
                resolve(data.Parameter.Value) 
            } 
        }); 
    }); 
    
} 
 
 
module.exports = {getParamValue,getParametersMap} 