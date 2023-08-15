// External imports
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal imports
const User = require('../../models/People');

// marks validators
const addMarkValidators = [
    check('department')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Department is required'),
    check('semester')
        .trim()
        .custom(value => {
            try {
                const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
                if (!semesters.includes(value)) {
                    throw createError(`semester value must be 1, 2, 3, 4, 5, 6, 7 or 8`);
                }
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('roll')
        .trim()
        .isLength({ min: 8, max: 8 })
        .withMessage('Roll must be in 8 length'),
    check('courseName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Course name is required'),
    check('courseCode')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Course code is required'),
    check('midOne')
        .trim()
        .custom(value => {
            if (value < 0 || value > 10) {
                throw createError('Mid one mark must be from 0 to 10');
            }
        }),
    check('midTwo')
        .trim()
        .custom(value => {
            if (value < 0 || value > 10) {
                throw createError('Mid two mark must be from 0 to 10');
            }
        }),
    check('attendance')
        .trim()
        .custom(value => {
            if (value < 0 || value > 10) {
                throw createError('Attendance marks must be from 0 to 10');
            }
        }),
    check('presentationOrAssignment')
        .trim()
        .custom(value => {
            if (value < 0 || value > 10) {
                throw createError('Presentation or assignment marks must be from 0 to 10');
            }
        }),
    check('firstExaminer')
        .trim()
        .custom(value => {
            if (value < 0 || value > 10) {
                throw createError('First examiner marks must be from 0 to 60');
            }
        }),
    check('secondExaminer')
        .trim()
        .custom(value => {
            if (value < 0 || value > 10) {
                throw createError('Second examiner marks must be from 0 to 60');
            }
        }),
];

const addMarksValidationHandler = (req, res, next) => {
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
    addMarkValidators,
    addMarksValidationHandler
}