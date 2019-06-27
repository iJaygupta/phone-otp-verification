const errorsCognitoObj = {

  InvalidUserPoolConfigurationException: 40, //500
  MFAMethodNotFoundException: 41, //will never come
  PasswordResetRequiredException: 42, //200 with body:{challenge:"passwordReset"}

  // Forget Password
  // =====================

  CodeDeliveryFailureException: 43, // 400 with errorCode.
  InvalidEmailRoleAccessPolicyException: 44, //500
  InvalidSmsRoleAccessPolicyException: 45, //500
  InvalidSmsRoleTrustRelationshipException: 46, //500

  // confirm forget password
  // ============================

  CodeMismatchException: 47, // 400
  ExpiredCodeException: 48, // 400
  InvalidLambdaResponseException: 49, //500
  InvalidParameterException: 50, //500
  InvalidPasswordException: 51, //400 // in case of password policy will never come.  
  LimitExceededException: 52, //400 
  NotAuthorizedException: 53, //400 //incorrect password entered.
  ResourceNotFoundException: 54,//500
  TooManyFailedAttemptsException: 55, // 400 
  TooManyRequestsException: 56, //400
  UnexpectedLambdaException: 57, //500
  UserLambdaValidationException: 58, //500
  UserNotConfirmedException: 59, // 400 that his email is not confirmed
  UserNotFoundException: 60, // 400
  AliasExistsException: 61 //500 should never come.

}


const errorsDbObj = {
  ProvisionedThroughputExceededException: 1,
  ResourceNotFoundException: 2,
  ConditionalCheckFailedException: 3,
  TransactionConflictException: 4,
  RequestLimitExceeded: 5,
  ItemCollectionSizeLimitExceededException: 6,
}

const errorsSnsObj = {

  AuthorizationError: 80, //500 
  InvalidSecurity: 81, //500
  KMSOptInRequired: 82, //500

  EndpointDisabled: 83, //500  
  InvalidParameter: 84, //400 
  KMSAccessDenied: 85, //500
  KMSDisabled: 86, //500
  KMSInvalidState: 87, //500
  KMSNotFound: 88, //500
  KMSThrottling: 89, //500
  ParameterValueInvalid: 90, //400
  PlatformApplicationDisabled: 91, //500

}


module.exports = { errorsCognitoObj, errorsDbObj, errorsSnsObj };