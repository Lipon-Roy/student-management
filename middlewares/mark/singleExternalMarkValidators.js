// External imports
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal imports
const User = require('../../models/People');

// marks validators
const addSingleExternalMarkValidators = [
    check('department')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Department is required'),
    check('semester')
        .isDecimal()
        .withMessage('Semester must be decimal')
        .custom(async (value) => {
            try {
                if (value < 1 || value > 8) {
                    throw createError("Semester must be 1 to 8");
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('roll')
        .trim()
        .isLength({ min: 8, max: 8 })
        .withMessage('Roll must be in 8 length')
        .custom(async (value, { req }) => {
            try {
                const student = await User.findOne({
                    roll: value,
                    department: req.body.department
                });
                if (!student) throw createError(`Student doesn't exists, please check roll`);
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('courseName')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Course name is required'),
    check('courseCode')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Course code is required'),
    check('firstExaminer')
        .isDecimal()
        .withMessage('Mark must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 60) {
                    throw createError('First examiner mark must be from 0 to 60');
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('secondExaminer')
        .isDecimal()
        .withMessage('Mark must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 60) {
                    throw createError('Second examiner mark must be from 0 to 60');
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('currentSession')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Current session is required')
];

const addSingleExternalMarksValidationHandler = (req, res, next) => {
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
    addSingleExternalMarkValidators,
    addSingleExternalMarksValidationHandler
}