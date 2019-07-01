const Joi = require("@hapi/joi");

validator = (schema, request) => {
    return new Promise((resolve, reject) => {
        let message, response;
        Joi.validate(request, schema, function (err, value) {
            if (err) {
                message = "Validation failed: ";
                if (err.details) {
                    err.details.forEach(element => {
                        message = message + " " + element.message;
                    });
                    response = {
                        statusCode: 400,
                        errorCode: 120


                    };
                }
                reject(JSON.stringify(response));
            } else {
                response = {
                    statusCode: 200,
                    body: "Validation Successful."
                };
                resolve(response);
            }
        });
    });
};

module.exports = { validator };