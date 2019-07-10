//const ParamExpressionQuery = require('./db/db-mapper/ParamExpressionQuery') 

const {
  ParamExpressionPut,
  ParamExpressionDelete,
  ParamExpressionQuery,
  ParamExpressionScan,
  ParamExpressionUpdate,
  ParamExpressionGet
} = require("/opt/dbModules");

// const ParamExpressionUpdate = require('./db-mapper/ParamExpressionUpdate')
// const ParamExpressionGet = require('./db-mapper/ParamExpressionGet')
// const ParamExpressionsQuery = require('./db-mapper/ParamExpressionsQuery')

//const ParamExpressionScan = require('./db/db-mapper/ParamExpressionScan') 
// const ParamExpressionPut = require('./db-mapper/ParamExpressionPut')

//const UserDao = require('./db/SignupDao');

module.exports = {
    ParamExpressionPut,
    ParamExpressionUpdate, ParamExpressionGet, ParamExpressionQuery
} 