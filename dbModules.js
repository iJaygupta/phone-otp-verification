//const ParamExpressionQuery = require('./db/db-mapper/ParamExpressionQuery') 
const ParamExpressionUpdate = require('./db-mapper/ParamExpressionUpdate')
const ParamExpressionGet = require('./db-mapper/ParamExpressionGet')
const ParamExpressionsQuery = require('./db-mapper/ParamExpressionsQuery')

//const ParamExpressionScan = require('./db/db-mapper/ParamExpressionScan') 
const ParamExpressionPut = require('./db-mapper/ParamExpressionPut')

//const UserDao = require('./db/SignupDao');

module.exports = {
    ParamExpressionPut,
    ParamExpressionUpdate, ParamExpressionGet, ParamExpressionsQuery
} 