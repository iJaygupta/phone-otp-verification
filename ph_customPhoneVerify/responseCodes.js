const challengeObj = {
    verifyEmail: {
        statusCode: 200,
        challengeCode: 151
    },
    resendEmail: {
        statusCode: 200,
        challengeCode: 152
    },
    emailCodeAlreadySent: {
        statusCode: 200,
        challengeCode: 153
    },
    sendPhoneCode: {
        statusCode: 200,
        challengeCode: 154
    },
    verifyPhone: {
        statusCode: 200,
        challengeCode: 155
    },
    verifyEmailUserExist: {
        statusCode: 200,
        challengeCode: 156
    },
    login: {
        statusCode: 200,
        challengeCode: 157
    },
    verifyPhoneUserExist: {
        statusCode: 200,
        challengeCode: 158
    },
    verifyMfa: {
        statusCode: 200,
        challengeCode: 159
    }
};

const customMessagesObj = {
    EmailAlreadyConfirmed: {
        statusCode: 200,
        body: 'Email already confirmed for this user. Please try signing up.'
    }
}

module.exports = { challengeObj, customMessagesObj };