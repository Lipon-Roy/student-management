// front end a total field ta auto fill kore dis, jkhon marks input dibe
// External import
const createError = require('http-errors');

// Internal imports
const Mark = require('../models/Mark');
const User = require('../models/People');

// get all marks
const getMarks = async (req, res, next) => {
    try {
        const marks = await Mark.find();
        res.status(200).json({
            result: marks
        });
    } catch (err) {
        next(createError(err.message));
    }
}

// add marks
const addMarks = async (req, res, next) => {
    try {
        // await newMark.save();
        await Mark.insertMany(req.body.marks)

        res.status(201).json({
            message: 'Marks added successfully'
        });
    } catch (err) {
        res.status(500).json({
            errors: {
                common: {
                    message: err.message
                }
            }
        });
    }
}

// add internal mark for single student
const addSingleMark = async (req, res, next) => {
    try {
        const { department, semester, roll, courseId, examName, mark } = req.body;
        const name = examName;
        // 64e384d6b12e86454d8d2ce4
        await Mark.updateOne({
            department: department,
            semester: semester,
            roll: roll,
            courseId: courseId
        }, {
            $set: {
                [name]: mark
            }
        }, {
            upsert: true
        });
        res.status(200).send({
            message: `Mark added for ${examName}`
        });
    } catch (err) {
        res.status(400).json(err.message);
    }
}

// add internal mark for multiple student
const addMultipleMark = async (req, res, next) => {
    try {
        const { marks } = req.body;
        // 64e384d6b12e86454d8d2ce4

        let examName;
        const bulk = []
        marks.forEach(m => {
            examName = m.examName;

            let updateDoc = {
                'updateOne': {
                    'filter': { 
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseId: m.courseId 
                    },
                    'update': { [m.examName]: m.mark },
                    'upsert': true
                }
            }
            bulk.push(updateDoc)
        });
        await Mark.bulkWrite(bulk);

        res.status(200).json({
            message: `Marks added for ${examName}`
        });
    } catch (err) {
        console.log(err);
        res.status(400).json(err.message);
    }
}

// add marks for external

// add lab marks

// add improvements marks

module.exports = {
    getMarks,
    addMarks,
    addSingleMark,
    addMultipleMark
}
