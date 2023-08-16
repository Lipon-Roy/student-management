// External import
const createError = require('http-errors');

// Internal imports
const Session = require('../models/Session');

// get single session
const getSession = async (req, res, next) => {
    try {
        const sessions = await Session.findById({_id: req.params.id});
        res.status(200).json({
            sessions
        });
    } catch(err) {
        next(createError(err.message));
    }
}

// get all session
const getSessions = async (req, res, next) => {
    try {
        const sessions = await Session.find();
        res.status(200).json({
            sessions
        });
    } catch(err) {
        next(createError(err.message));
    }
}

// add session
const addSession = async (req, res, next) => {
    try {
        // check session exist or not for the same department
        const session = await Session.findOne({
            session: req.body.session,
            department: req.body.department
        });
        if (session) throw createError('Session already exists for this department');

        const newSession = new Session({
            ...req.body
        });

        await newSession.save();
        res.status(201).json({
            message: 'Session added successfully'
        });
    } catch(err) {
        res.status(500).json({
            errors: {
                common: err.message
            }
        });
    }
}

// add course
const addCourse = async (req, res, next) => {
    try {
        // check course already exist or not
        const { courseName, courseCode, semester, credit } = req.body.course;
        const session = await Session.findOne({
            session: req.body.session,
            department: req.body.department,
            courses: {
                $elemMatch: {courseName: courseName, courseCode: courseCode }
            }
        });
        
        if (session) {
            throw createError('This course already exists');
        }
        
        // now add this course
        const newCourse = { courseName, courseCode, semester, credit }; 
        await Session.updateOne({
            session: req.body.session
        }, {
            $push: {
                "courses": newCourse
            }
        });

        res.status(201).json({
            message: "Course added successfully"
        });
    } catch(err) {
        res.status(500).json({
            errors: {
                common: err.message
            }
        });
    }
}

module.exports = {
    getSession,
    getSessions,
    addSession,
    addCourse
}