const errorsDbObj = {
  ProvisionedThroughputExceededException: {
    statusCode: 500,
    errorCode: 1
  },
  ResourceNotFoundException: {
    statusCode: 500,
    errorCode: 2
  },
  ConditionalCheckFailedException: {
    statusCode: 500,
    errorCode: 3
  },
  TransactionConflictException: {
    statusCode: 500,
    errorCode: 4
  },
  RequestLimitExceeded: {
    statusCode: 500,
    errorCode: 5
  },
  ItemCollectionSizeLimitExceededException: {
    statusCode: 500,
    errorCode: 6
  },
}


const errorsCustomObj = { //Make spearate Error code for different blocking mechanisms //One for LognBlokck and verifyBlock
  UserNotFoundException: {
    statusCode: 404,
    errorCode: 101
  },
  UserNotFoundExceptionInDb: {
    statusCode: 404,
    errorCode: 102
  },
  ActionNotSupported: {
    statusCode: 400,
    errorCode: 103
  },
  PasswordPolicyMismatch: {
    statusCode: 400,
    errorCode: 104
  },
  IncorrectPassword: {
    statusCode: 400,
    errorCode: 105
  },
  PasswordNotFoundInDB: {
    statusCode: 404,
    errorCode: 106
  },
  UserBlockedForResendEmailCode: {
    statusCode: 423,
    errorCode: 107
  },
  UserBlockedForVerifyEmail: {
    statusCode: 423,
    errorCode: 108
  },
  UserBlockedForlogin: {
    statusCode: 423,
    errorCode: 109
  },
  LoadSSMFailedException: {
    statusCode: 500,
    errorCode: 110
  },
  default: {
    statusCode: 500,
    errorCode: 111
  },
  UserBlockedForSendPhoneCode: {
    statusCode: 423,
    errorCode: 112
  },
  UserBlockedForVerifyPhone: {
    statusCode: 423,
    errorCode: 113
  },
  UserBlockedForChangePhone: {
    statusCode: 423,
    errorCode: 114
  },
  UserOTPExpired: {
    statusCode: 441,
    errorCode: 115
  },
  UserOTPIncorrect: {
    statusCode: 441,
    errorCode: 116
  },
  UserNotAllowedToChangePhone: {
    statusCode: 400,
    errorCode: 117
  },
  PhoneAlreadyExist: {
    statusCode: 400,
    errorCode: 118
  }

}

const errorsCognitoObj = {

  InvalidUserPoolConfigurationException: {
    statusCode: 500,
    errorCode: 40
  }, //500
  MFAMethodNotFoundException: {
    statusCode: 500,
    errorCode: 41
  }, //will never come
  PasswordResetRequiredException: {
    statusCode: 500,
    errorCode: 42
  }, //200 with body:{challenge:"passwordReset"}

  // Forget Password
  // =====================

  CodeDeliveryFailureException: {
    statusCode: 400,
    errorCode: 43
  }, // 400 with errorCode.
  InvalaidEmailRoleAccessPolicyException: {
    statusCode: 500,
    errorCode: 44
  }, //500
  InvalidSmsRoleAccessPolicyException: {
    statusCode: 500,
    errorCode: 45
  }, //500
  InvalidSmsRoleTrustRelationshipException: {
    statusCode: 500,
    errorCode: 46
  }, //500

  // confirm forget password
  // ============================

  CodeMismatchException: {
    statusCode: 400,
    errorCode: 47
  }, // 400
  ExpiredCodeException: {
    statusCode: 400,
    errorCode: 48
  }, // 400
  InvalidLambdaResponseException: {
    statusCode: 500,
    errorCode: 49
  }, //500
  InvalidParameterException: {
    statusCode: 500,
    errorCode: 50
  }, //500
  InvalidPasswordException: {
    statusCode: 400,
    errorCode: 51
  }, //400 // in case of password policy will never come. 
  LimitExceededException: {
    statusCode: 400,
    errorCode: 52
  }, //400 
  NotAuthorizedException: {
    statusCode: 400,
    errorCode: 53
  }, //400 //incorrect password entered.
  ResourceNotFoundException: {
    statusCode: 500,
    errorCode: 54
  }, //500
  TooManyFailedAttemptsException: {
    statusCode: 400,
    errorCode: 55
  }, // 400 
  TooManyRequestsException: {
    statusCode: 400,
    errorCode: 56
  }, //400
  UnexpectedLambdaException: {
    statusCode: 500,
    errorCode: 57
  }, //500
  UserLambdaValidationException: {
    statusCode: 500,
    errorCode: 58
  }, //500
  UserNotConfirmedException: {
    statusCode: 400,
    errorCode: 59
  }, // 400 that his email is not confirmed
  UserNotFoundException: {
    statusCode: 400,
    errorCode: 60
  }, // 400
  AliasExistsException: {
    statusCode: 500,
    errorCode: 61
  } //500 should never come.

}

const errorsSnsObj = {

  AuthorizationError: {
    statusCode: 500,
    errorCode: 80
  }, //500 
  InvalidSecurity: {
    statusCode: 500,
    errorCode: 81
  }, //500
  KMSOptInRequired: {
    statusCode: 500,
    errorCode: 82
  }, //500

  EndpointDisabled: {
    statusCode: 500,
    errorCode: 83
  }, //500 
  InvalidParameter: {
    statusCode: 400,
    errorCode: 84
  }, //400 
  KMSAccessDenied: {
    statusCode: 500,
    errorCode: 85
  }, //500
  KMSDisabled: {
    statusCode: 500,
    errorCode: 86
  }, //500
  KMSInvalidState: {
    statusCode: 500,
    errorCode: 87
  }, //500
  KMSNotFound: {
    statusCode: 500,
    errorCode: 88
  }, //500
  KMSThrottling: {
    statusCode: 500,
    errorCode: 89
  }, //500
  ParameterValueInvalid: {
    statusCode: 400,
    errorCode: 90
  }, //400
  PlatformApplicationDisabled: {
    statusCode: 500,
    errorCode: 91
  }, //500
}
module.exports = {
  errorsCognitoObj,
  errorsDbObj,
  errorsSnsObj,
  errorsCustomObj
};