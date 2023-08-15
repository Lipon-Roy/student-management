// External imports
const { check, validationResult } = require('express-validator');

const userValidators = [
    check('username')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Username is required')
        .isAlpha('en-US', { ignore: ' -' })
        .withMessage('Username must not contain anything other than alphabet'),
    check('roll')
        .trim()
        .isNumeric()
        .withMessage('Roll must be numeric')
        .isLength({ min: 8, max: 8 })
        .withMessage('Roll must be 8 digit'),
    check('session')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Session is required'),
    check('currentSession')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Current session is required'),
    check('department')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Department is required'),
    check('password')
        .isStrongPassword()
        .withMessage("Password must be at least 8 characters long & should contain at least 1 lowercase, 1 uppercase, 1 number & 1 symbol")
];

const userValidationHandler = (req, res, next) => {
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
    userValidators,
    userValidationHandler
}