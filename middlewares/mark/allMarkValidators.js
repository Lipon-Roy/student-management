// External imports
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal imports
const Mark = require('../../models/Mark');
const User = require('../../models/People');

// marks validators
const addMarkValidators = [
    check('marks.*.department')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Department is required'),
    check('marks.*.semester')
        .isDecimal()
        .withMessage('Semester must be decimal')
        .custom(async (value, { req }) => {
            try {
                if (value != req.body.marks[0].semester) {
                    throw createError('Semester must be same for all student')
                }
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

                const mark = await Mark.findOne({
                    roll: value,
                    semester: req.body.marks[0].semester,
                    department: req.body.marks[0].department,
                    courseName: req.body.marks[0].courseName,
                    courseCode: req.body.marks[0].courseCode
                });
                if (mark && mark._id) throw createError(`Marks already exists for roll ${value}`);
            } catch (err) {
                throw createError(err.message);
            }
        }),
    check('marks.*.courseId')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Course id is required'),
    check('marks.*.midOne')
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
    check('marks.*.midTwo')
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
    check('marks.*.attendance')
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
    check('marks.*.presentationOrAssignment')
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
    check('marks.*.firstExaminer')
        .isDecimal()
        .withMessage('First examiner mark must be number')
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
        .withMessage('Second examiner mark must be number')
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
        .withMessage('Third examiner mark must be number')
        .custom(async value => {
            try {
                if (value < 0 || value > 60) {
                    throw createError('Third examiner mark must be from 0 to 60');
                }
            } catch (err) {
                throw createError(err.message);
            }
        })
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