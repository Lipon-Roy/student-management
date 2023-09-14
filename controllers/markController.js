// front end a total field ta auto fill kore dis, jkhon marks input dibe
// External import
const createError = require('http-errors');

// Internal imports
const Mark = require('../models/Mark');
const LabMark = require('../models/LabMark');

// get all marks
const getAllMarks = async (req, res, next) => {
    try {
        const marks = await Mark.find();
        res.status(200).json({
            result: marks
        });
    } catch (err) {
        next(createError(err.message));
    }
}

// get internal mark for single student
const getSingleMark = async (req, res, next) => {
    const { dept, semester, course, roll } = req.params;

    try {
        const mark = await Mark.findOne({
            department: dept,
            semester,
            courseId: course,
            roll
        });

        res.status(200).json({
            result: mark
        });
    } catch(err) {
        next(createError(err.message));
    }
}

// get mark which are isThirdExaminer true
const getIsThirdExaminer = async (req, res, next) => {
    const { dept, semester, course } = req.params;

    try {
        const marks = await Mark.find({
            department: dept,
            semester,
            courseId: course,
            isThirdExaminer: true
        });

        res.status(200).json({
            result: marks
        });
    } catch(err) {
        next(createError(err.message));
    }
}

const getLabMarks = async (req, res, next) => {
    try {
        const marks = await LabMark.find();
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
const addSingleInternalMark = async (req, res, next) => {
    try {
        const { department, semester, roll, courseId, midOne, midTwo, attendance, presentationOrAssignment } = req.body;
        
        // 64e384d6b12e86454d8d2ce4
        await Mark.updateOne({
            department: department,
            semester: semester,
            roll: roll,
            courseId: courseId
        }, {
            $set: {
                midOne,
                midTwo,
                attendance,
                presentationOrAssignment
            }
        }, {
            upsert: true
        });
        res.status(200).send({
            message: `Internal marks updated successfully`
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

// add internal mark for multiple student
const addMultipleInternalMark = async (req, res, next) => {
    try {
        const { marks } = req.body;
        // 64e384d6b12e86454d8d2ce4

        const bulk = []
        marks.forEach(m => {
            const { midOne, midTwo, attendance, presentationOrAssignment } = m;

            let updateDoc = {
                'updateOne': {
                    'filter': {
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseId: m.courseId
                    },
                    'update': {
                        midOne,
                        midTwo,
                        attendance,
                        presentationOrAssignment
                    },
                    'upsert': true
                }
            }
            bulk.push(updateDoc)
        });
        await Mark.bulkWrite(bulk);

        res.status(200).json({
            message: `Internal marks added successfully for all student`
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

// add external mark for single student
const addSingleExternalMark = async (req, res, next) => {
    try {
        const { department, semester, roll, courseId, firstExaminer, secondExaminer } = req.body;
        // 64e384d6b12e86454d8d2ce4
        await Mark.updateOne({
            department: department,
            semester: semester,
            roll: roll,
            courseId: courseId
        }, {
            $set: {
                firstExaminer,
                secondExaminer,
                isThirdExaminer: Math.abs(firstExaminer - secondExaminer) >= 12
            }
        }, {
            upsert: true
        });

        res.status(200).send({
            message: `External mark added`
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

// add external marks for multiple student
const addMultipleExternalMark = async (req, res, next) => {
    try {
        const { marks } = req.body;
        // 64e384d6b12e86454d8d2ce4

        const bulk = []
        marks.forEach(m => {
            const { firstExaminer, secondExaminer } = m;

            let updateDoc = {
                'updateOne': {
                    'filter': {
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseId: m.courseId
                    },
                    'update': {
                        firstExaminer,
                        secondExaminer,
                        isThirdExaminer: Math.abs(firstExaminer - secondExaminer) >= 12
                    },
                    upsert: true
                }
            }
            bulk.push(updateDoc)
        });
        await Mark.bulkWrite(bulk);

        res.status(200).json({
            message: `External marks added`
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

// add lab mark for single student
const addSingleLabMark = async (req, res) => {
    try {
        const { department, semester, roll, courseId, labTotal } = req.body;
        await LabMark.updateOne({
            department,
            semester,
            roll,
            courseId
        }, {
            $set: {
                labTotal
            }
        }, {
            upsert: true
        });

        res.status(201).json({
            message: 'Lab mark successfully added'
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

// add lab mark for multiple student
const addMultipleLabMark = async (req, res) => {
    try {
        const { marks } = req.body;
        // 64e38506b12e86454d8d2cec

        const bulk = []
        marks.forEach(m => {

            let updateDoc = {
                'updateOne': {
                    'filter': {
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseId: m.courseId
                    },
                    'update': { labTotal: m.labTotal },
                    'upsert': true
                }
            }
            bulk.push(updateDoc)
        });
        await LabMark.bulkWrite(bulk);

        res.status(200).json({
            message: `Lab marks added for all student`
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

// add theory course improvements mark for single student
const addSingleImproveMark = async (req, res) => {
    try {
        const { department, semester, roll, courseId, firstExaminer, secondExaminer, thirdExaminer } = req.body;
        // 64e384d6b12e86454d8d2ce4
        // akhane age check kore nibo jodi improve hoi tahole update korte dibo.
        // ata porer kaj
        await Mark.updateOne({
            department: department,
            semester: semester,
            roll: roll,
            courseId: courseId
        }, {
            $set: {// akhane front-end theke jodi third jodi na o pathai tobuo kono problem hobe na.
                firstExaminer,
                secondExaminer,
                thirdExaminer
            }
        });

        res.status(200).send({
            message: `Improve mark added`
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

module.exports = {
    getAllMarks,
    getSingleMark,
    getIsThirdExaminer,
    getLabMarks,
    addMarks,
    addSingleInternalMark,
    addMultipleInternalMark,
    addSingleExternalMark,
    addMultipleExternalMark,
    addSingleLabMark,
    addMultipleLabMark,
    addSingleImproveMark,
}
