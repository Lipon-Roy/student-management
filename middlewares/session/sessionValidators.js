// External imports
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal imports

// validators
const addSessionValidators = [
    check('session')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Session is required'),
    check('department')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Deparement is required')
];

const addSessionValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    const mappedErrors = errors.mapped();

    if (Object.keys(mappedErrors).length == 0) next();
    else {
        res.status(400).json({
            errors: mappedErrors
        });
    }
}

module.exports = {
    addSessionValidators,
    addSessionValidationHandler
}