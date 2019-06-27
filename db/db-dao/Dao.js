const { docClient } = require('./DdInit')

class Dao {


    query(params) {

        console.log(JSON.stringify(params))

        return new Promise((resolve, reject) => {

            docClient.query(params, function (err, data) {
                let response;

                if (err) {

                    response = {
                        'statusCode': 400,
                        'body': err
                    }
                    reject(response)
                } else {
                    response = {
                        'statusCode': 200,
                        'body': data
                    }

                    resolve(response)
                }
            });
        });
    }


    update(params) {

        console.log('update params:: ', params);

        return new Promise((resolve, reject) => {

            docClient.update(params, function (err, data) {
                let response;

                if (err) {

                    response = {
                        'statusCode': 400,
                        'body': err
                    }
                    reject(response)
                } else {

                    response = {
                        'statusCode': 200,
                        'body': data
                    }
                    resolve(response)
                }
            });
        });
    }

    scan(params) {

        console.log(JSON.stringify(params))

        return new Promise((resolve, reject) => {

            docClient.scan(params, function (err, data) {
                let response;

                if (err) {

                    response = {
                        'statusCode': 400,
                        'body': err
                    }
                    reject(response)
                } else {

                    response = {
                        'statusCode': 200,
                        'body': data
                    }
                    resolve(response)
                }
            })
        })
    }
    putItem(params) {
        console.log('Put item params::', params);

        return new Promise((resolve, reject) => {
            docClient.put(params, function (err, data) {
                let response;
                if (err) {
                    response = {
                        'statusCode': 400,
                        'body': err
                    }
                    reject(response);
                } else {
                    response = {
                        'statusCode': 200,
                        'body': data
                    }
                    resolve(response);
                }
            })
        });
    }

    delete(params) {
        return new Promise((resolve, reject) => {
            docClient.delete(params, function (err, data) {
                let response;

                if (err) {

                    response = {
                        'statusCode': 400,
                        'body': err
                    }
                    reject(response)
                } else {

                    response = {
                        'statusCode': 200,
                        'body': data
                    }
                    resolve(response)
                }
            });
        })
    }

    get(params) {
        console.log("get param ", params)
        return new Promise((resolve, reject) => {
            docClient.get(params, function (err, data) {
                let response;

                if (err) {

                    response = {
                        'statusCode': 400,
                        'body': err
                    }
                    reject(response)
                } else {

                    response = {
                        'statusCode': 200,
                        'body': data
                    }
                    resolve(response)
                }
            });
        })
    }
}

module.exports = Dao;