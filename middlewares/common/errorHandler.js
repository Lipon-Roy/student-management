// External import
const createError = require('http-errors');

// not found handler
const notFoundHandler = (req, res, next) => {
    next(createError(404, "your request content was not found!"));
}

// default error handler
const errorHandler = (err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        errors: {
            message: err.message,
        }
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
}