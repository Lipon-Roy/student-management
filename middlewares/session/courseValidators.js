// External import
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

const addCourseValidators = [
    check('courseName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Course is required')
        .isAlpha('en-US', { ignore: ' - ' })
        .withMessage('Course name must be alphabet'),
    check('courseCode')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Course code is required'),
    check('semester')
        .isDecimal()
        .withMessage('Semester must be number')
        .custom(async value => {
            try {
                if (value < 1 || value > 8) {
                    throw createError('Semester must be 1 to 8');
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('credit')
        .isDecimal()
        .withMessage('Credit must be number'),
];

const addCourseValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    const mappedErrors = errors.mapped();

    if (Object.keys(mappedErrors).length == 0) next();
    else {
        res.status(500).json({
            errors: mappedErrors
        });
    }
}

module.exports = {
    addCourseValidators,
    addCourseValidationHandler
}