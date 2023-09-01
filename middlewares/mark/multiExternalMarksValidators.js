// External imports
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal imports
const User = require('../../models/People');

// marks validators
const addMultiExternalMarkValidators = [
    check('marks.*.department')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Department is required'),
    check('marks.*.semester')
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
    check('marks.*.roll')
        .trim()
        .isLength({ min: 8, max: 8 })
        .withMessage('Roll must be in 8 length')
        .custom(async (value, { req }) => {
            try {
                const student = await User.findOne({
                    roll: value,
                    department: req.body.marks[0].department
                });
                if (!student) throw createError(`Student doesn't exists, please check roll`);
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('marks.*.courseId')
        .trim()
        .isLength({ min: 24, max: 24 })
        .withMessage('Course name is required'),
    check('marks.*.firstExaminer')
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
    check('marks.*.secondExaminer')
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
    check('marks.*.thirdExaminer')
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
        })
];

const addMultiExternalMarksValidationHandler = (req, res, next) => {
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
    addMultiExternalMarkValidators,
    addMultiExternalMarksValidationHandler
}