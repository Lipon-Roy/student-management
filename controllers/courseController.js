// Internal imports
const Session = require('../models/Session');

// get course in semesterwise
const getCourse = async (req, res, next) => {
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

module.exports = {
    getCourse
}