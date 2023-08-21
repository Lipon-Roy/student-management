// External import
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

const updateCourseValidators = [
    check('courseName')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Course is required'),
    check('courseCode')
        .trim()
        .isLength({ min: 4 })
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
        .withMessage('Credit must be number')
        .custom(async value => {
            try {
                if (value < 1 || value > 3) {
                    throw createError('Credit must be 1 to 3');
                }
            } catch(err) {
                throw createError(err.message)
            }
        }),
];

const updateCourseValidationHandler = (req, res, next) => {
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
    updateCourseValidators,
    updateCourseValidationHandler
}