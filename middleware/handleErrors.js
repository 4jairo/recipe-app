module.exports = (err, req, res) => {
    console.log('handle errors', err.name)
    const errorCodes = {
        TypeError: {
            code: 400,
            message: 'request with a invalid body'
        },
        CastError: {
            code: 400,
            message: 'not a valid id'
        },
        ReferenceError: {
            code: 404,
            message: 'id does not exist'
        },
        default: {
            code: 500,
            message: 'something failed'
        }
    }

    const currentError = errorCodes[err.name] 
        ? errorCodes[err.name] 
        : errorCodes.default

    res.sendSatus(currentError.code).send({
        error: currentError.message,
        name: err.name
    })
}