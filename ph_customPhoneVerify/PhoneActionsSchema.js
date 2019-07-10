const Joi = require("/opt/node_modules/@hapi/joi");

const sendPhoneCodeActionDetails = () => {
    const schema = Joi.object({
        action: Joi.string().required()
    })
    return schema;
};

const verifyPhoneActionDetails = () => {
    const schema = Joi.object()
        .keys({
            action: Joi.string().required(),
            payload: Joi.object()
                .required()
                .keys({
                    code: Joi.number().required(),
                    isRemembered: Joi.boolean(),
                })
        })
    return schema;
};

const changePhoneActionDetails = () => {
    const schema = Joi.object()
        .keys({
            action: Joi.string().required(),
            payload: Joi.object()
                .required()
                .keys({
                    phoneNumber: Joi.string().required()
                })
        })
    return schema;
};



module.exports = { sendPhoneCodeActionDetails, verifyPhoneActionDetails, changePhoneActionDetails };
