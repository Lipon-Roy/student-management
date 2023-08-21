// External import
const createError = require('http-errors');

// Internal imports
const Session = require('../models/Session');

// get course in semesterwise
const getCourses = async (req, res, next) => {
    try {
        const session = await Session.findOne({
            session: req.params.session,
            department: req.params.department
        });

        const result = [];
        if (session && session._id) {
            const { courses } = session;
            
            for (let course of courses) {
                if (course.semester == req.params.semester) {
                    result.push(course)
                }
            }
        }
        res.status(200).json({result});
    } catch(err) {
        next(createError(err.message));
    }
}

// get single course for update
const getCourse = async (req, res, next) => {
    try {
        const session = await Session.findOne({
            session: req.params.session,
            department: req.params.department
        });

        let singleCourse;
        if (session && session._id) {
            for (let course of session.courses) {
                if (course._id == req.params.id) {
                    singleCourse = course;
                    break;
                }
            }
        }
        res.status(200).json({result: singleCourse});

    } catch(err) {
        next(createError(err.message));
    }
}

// update course
const updateCourse = async (req, res, next) => {
    try {
        const { courseName, courseCode, semester, credit } = req.body;

        // new course name and course code exists or not
        const session = await Session.findOne({
            session: req.params.session,
            department: req.params.department
        });

        if (session && session._id) {
            const { courses } = session;
            for (let course of courses) {
                if (course._id != req.params.id && course.courseName == courseName) {
                    throw createError(`Course already exist in semester ${course.semester}`)
                }
                if (course._id != req.params.id && course.courseCode == courseCode) {
                    throw createError(`Course already exist in semester ${course.semester}`)
                }
            }
        }
        
        await Session.updateOne({
                "courses._id": req.params.id
            },
            { $set: {
                    "courses.$.courseName": courseName,
                    "courses.$.courseCode": courseCode,
                    "courses.$.semester": semester,
                    "courses.$.credit": credit
                }
            }
        );
        
        res.status(200).json({
            message: 'Course successfully updated'
        });
    } catch(err) {
        res.status(500).json({
            errors: {
                common: err.message
            }
        });
    }
}

// delete course
const deleteCourse = async (req, res, next) => {
    try {
        await Session.updateOne({
            session: req.params.session,
            department: req.params.department
        }, {
            $pull: {
                courses: {_id: req.params.id}
            }
        });
        res.status(200).json({
            message: 'Course was deleted successfully'
        });
    } catch(err) {
        next(createError(err.message));
    }
}

module.exports = {
    getCourses,
    getCourse,
    updateCourse,
    deleteCourse
}