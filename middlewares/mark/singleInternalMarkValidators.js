// External imports
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal imports
const User = require('../../models/People');

// marks validators
const addSingleInternalMarkValidators = [
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
        .withMessage('Course  name is required'),
    check('courseCode')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Course code is required'),
    check('midOne')
        .isDecimal()
        .withMessage('Mid one number must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 10) {
                    throw createError('Mid one mark must be from 0 to 10');
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('midTwo')
        .isDecimal()
        .withMessage('Mid two mark must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 10) {
                    throw createError('Mid two mark must be from 0 to 10');
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('attendance')
        .isDecimal()
        .withMessage('Attendance mark must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 10) {
                    throw createError('Attendance mark must be from 0 to 10');
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('presentationOrAssignment')
        .isDecimal()
        .withMessage('Presentation mark must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 10) {
                    throw createError('Presentation or assignment mark must be from 0 to 10');
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

const addSingleInternalMarksValidationHandler = (req, res, next) => {
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
    addSingleInternalMarkValidators,
    addSingleInternalMarksValidationHandler
}