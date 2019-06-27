const AWS = require('aws-sdk');  
  
AWS.config.update({region:'ap-southeast-1'});  
  
//AWS.config.loadFromPath('D:\\Code\\POC\\AWS SSM\\ssmConfig\\config.json');  
  
const SSM = new AWS.SSM(); 
  
module.exports = SSM;  