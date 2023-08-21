// External import
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');

// Internal Import
const Session = require('../../models/Session');

const addCourseValidators = [
    check('course.courseName')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Course is required')
        .custom(async (value, {req}) => {
            try {
                const { courseName } = req.body.course;
                const session = await Session.findOne({
                    session: req.body.session,
                    department: req.body.department,
                    "courses.courseName": courseName
                });
                if (session && session._id) {
                    throw createError(`${value} already exist!`);
                }
            } catch(err) {
                throw createError(err.message);
            }
        }),
    check('course.courseCode')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Course code is required')
        .custom(async (value, {req}) => {
            try {
                const { courseCode } = req.body.course;
                const session = await Session.findOne({
                    session: req.body.session,
                    department: req.body.department,
                    "courses.courseCode": courseCode
                });
                if (session && session._id) {
                    throw createError(`${value} already exist!`);
                }
            } catch(err) {
                throw createError(err.message);
            }
        }),
    check('course.semester')
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
    check('course.credit')
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