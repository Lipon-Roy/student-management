// front end a total field ta auto fill kore dis, jkhon marks input dibe
// External import
const createError = require('http-errors');

// Internal imports
const Mark = require('../models/Mark');
const User = require('../models/People');

// add marks
const addMarks = async (req, res, next) => {
    try {
        // check student exist or not
        const student = await User.findOne({
            roll: req.body.roll,
            department: req.body.department,
        });
        if (!student) throw createError(`Student doesn't exists, please check roll`);

        // check mark already exist or not
        const mark = await Mark.findOne({
            roll: req.body.roll,
            semester: req.body.semester,
            department: req.body.department,
            courseName: req.body.courseName,
            courseCode: req.body.courseCode
        });
        if (mark && mark._id) throw createError('Marks already added for this student')

        const total = req.body.midOne + req.body.midTwo + req.body.attendance + req.body.presentationOrAssignment + req.body.firstExaminer + req.body.secondExaminer;
        const newMark = new Mark({
            ...req.body,
            total
        });
        
        await newMark.save();

        res.status(201).json({
            message: 'Marks added successfully'
        });
    } catch(err) {
        res.status(500).json({
            errors: {
                common: {
                    message: err.message
                }
            }
        });
    }
}

module.exports = {
    addMarks
}
