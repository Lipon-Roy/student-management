// front end a total field ta auto fill kore dis, jkhon marks input dibe
// External import
const createError = require('http-errors');

// Internal imports
const Mark = require('../models/Mark');
const LabMark = require('../models/LabMark');
const ImproveMark = require('../models/ImproveMark');

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
    } catch (err) {
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
    } catch (err) {
        next(createError(err.message));
    }
}

// get improve third examiner mark
const getImproveMark = async (req, res, next) => {
    const { dept, semester, course, roll } = req.params;

    try {
        const mark = await ImproveMark.findOne({
            department: dept,
            semester,
            courseId: course,
            roll
        });

        res.status(200).json({
            result: mark
        });
    } catch (err) {
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
        const { department, semester, roll, courseName, courseCode, midOne, midTwo, attendance, presentationOrAssignment, currentSession } = req.body;

        // 64e384d6b12e86454d8d2ce4
        await Mark.updateOne({
            department: department,
            semester: semester,
            roll: roll,
            courseName: courseName,
            courseCode: courseCode,
            currentSession
        }, {
            $set: {
                midOne,
                midTwo,
                attendance,
                presentationOrAssignment,
                credit: 3
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
            const { midOne, midTwo, attendance, presentationOrAssignment, currentSession } = m;

            let updateDoc = {
                'updateOne': {
                    'filter': {
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseName: m.courseName,
                        courseCode: m.courseCode,
                        currentSession
                    },
                    'update': {
                        midOne,
                        midTwo,
                        attendance,
                        presentationOrAssignment,
                        credit: 3
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
        const { department, semester, roll, courseName, courseCode, firstExaminer, secondExaminer, currentSession } = req.body;
        let total;

        // get internal marks and set total
        const result = await Mark.findOne({
            department,
            semester,
            roll,
            courseName,
            courseCode,
            currentSession
        });

        if (result && result._id) {
            const { midOne, midTwo, attendance, presentationOrAssignment } = result;

            total = midOne + midTwo + attendance + presentationOrAssignment;
        } else throw (`Mark was not found for id ${roll}`);

        total += (firstExaminer + secondExaminer) / 2;

        await Mark.updateOne({
            department,
            semester,
            roll,
            courseName,
            courseCode,
            currentSession
        }, {
            $set: {
                firstExaminer,
                secondExaminer,
                total: total.toFixed(2),
                isThirdExaminer: Math.abs(firstExaminer - secondExaminer) > 12
            }
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
        // forEach er moddhe async/await babohar kora jaccilo na

        const bulk = []
        for (let m of marks) {
            const { firstExaminer, secondExaminer } = m;
            let total = 0;

            // get internal marks and set total
            const result = await Mark.findOne({
                department: m.department,
                semester: m.semester,
                roll: m.roll,
                courseName: m.courseName,
                courseCode: m.courseCode,
                currentSession: m.currentSession
            });

            if (result && result._id) {
                const { midOne, midTwo, attendance, presentationOrAssignment } = result;

                total = midOne + midTwo + attendance + presentationOrAssignment;
            } else throw (`Mark was not found for id ${m.roll}`);

            total += (firstExaminer + secondExaminer) / 2;

            let updateDoc = {
                'updateOne': {
                    'filter': {
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseName: m.courseName,
                        courseCode: m.courseCode,
                        currentSession: m.currentSession
                    },
                    'update': {
                        firstExaminer,
                        secondExaminer,
                        total: total.toFixed(2),
                        isThirdExaminer: Math.abs(firstExaminer - secondExaminer) > 12
                    }
                }
            }

            bulk.push(updateDoc)
        }
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

// add third examiner mark for multiple student
const addThirdExaminerMarks = async (req, res, next) => {
    try {
        const { marks } = req.body;

        const bulk = []
        for (let m of marks) {
            const { thirdExaminer } = m;
            let total, minimum;

            // get internal marks and set total and minimum
            const result = await Mark.findOne({
                department: m.department,
                semester: m.semester,
                roll: m.roll,
                courseName: m.courseName,
                courseCode: m.courseCode,
                isThirdExaminer: true,
                currentSession: m.currentSession
            });
            
            if (result && result._id) {
                const { midOne, midTwo, attendance, presentationOrAssignment, firstExaminer, secondExaminer } = result;

                let diffOne = Math.abs(firstExaminer - secondExaminer);
                let diffTwo = Math.abs(secondExaminer - thirdExaminer);
                let diffThree = Math.abs(firstExaminer - thirdExaminer);

                minimum = Math.min(diffOne, diffTwo, diffThree);

                switch (minimum) {
                    case Math.abs(firstExaminer - secondExaminer):
                        total = (firstExaminer + secondExaminer)/2;
                        break;
                    case Math.abs(secondExaminer - thirdExaminer):
                        total = (secondExaminer + thirdExaminer)/2;
                        break;
                    default:
                        total = (firstExaminer + thirdExaminer)/2;
                }

                total = total + midOne + midTwo + attendance + presentationOrAssignment;
            } else throw (createError(`Mark was not found for id ${m.roll}`));

            let updateDoc = {
                'updateOne': {
                    'filter': {
                        department: m.department,
                        semester: m.semester,
                        roll: m.roll,
                        courseName: m.courseName,
                        courseCode: m.courseCode,
                        isThirdExaminer: true,
                        currentSession: m.currentSession
                    },
                    'update': {
                        thirdExaminer,
                        minimum,
                        total: total.toFixed(2),
                        // isThirdExaminer: false
                    }
                }
            }
            bulk.push(updateDoc)
        }
        await Mark.bulkWrite(bulk);

        res.status(200).json({
            message: `Third examiner marks added`
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
        const { department, semester, roll, courseName, courseCode, labTotal, currentSession } = req.body;
        await LabMark.updateOne({
            department,
            semester,
            roll,
            courseName,
            courseCode,
            currentSession
        }, {
            $set: {
                labTotal,
                credit: 1.5
            }
        }, {
            upsert: true
        });

        res.status(201).json({
            message: 'Lab mark successfully added'
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
                        courseName: m.courseName,
                        courseCode: m.courseCode,
                        currentSession: m.currentSession
                    },
                    'update': { labTotal: m.labTotal, credit: 1.5 },
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
        const { department, semester, roll, courseId, firstExaminer, secondExaminer } = req.body;
        // 64e384d6b12e86454d8d2ce4
        // akhane number check kore mul mark ta update kore dibo
        await ImproveMark.updateOne({
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

// add third examiner mark for theory course improvement
const addSingleThirdImproveMark = async (req, res) => {
    try {
        const { department, semester, roll, courseId, thirdExaminer } = req.body;
        // 64e384d6b12e86454d8d2ce4
        // akhane number check kore mul mark ta update kore dibo
        await ImproveMark.updateOne({
            department: department,
            semester: semester,
            roll: roll,
            courseId: courseId
        }, {
            $set: {
                thirdExaminer,
                isThirdExaminer: false
            }
        });

        res.status(200).send({
            message: `Third examiner mark added for improvements`
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
    getImproveMark,
    getLabMarks,
    addMarks,
    addSingleInternalMark,
    addMultipleInternalMark,
    addSingleExternalMark,
    addMultipleExternalMark,
    addThirdExaminerMarks,
    addSingleLabMark,
    addMultipleLabMark,
    addSingleImproveMark,
    addSingleThirdImproveMark
}
