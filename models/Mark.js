// External import
const mongoose = require('mongoose');

const markSchema = mongoose.Schema(
    {
        department: {
            type: String,
            required: true
            //enum korar plan ase pore
        },
        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 8,
        },
        roll: {
            type: String,
            required: true
        },
        courseName: {
            type: String,
            required: true,
        },
        courseCode: {
            type: String,
            required: true,
        },
        midOne: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        midTwo: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        attendance: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        presentationOrAssignment: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        firstExaminer: {
            type: Number,
            required: true,
            min: 0,
            max: 60
        },
        secondExaminer: {
            type: Number,
            required: true,
            min: 0,
            max: 60
        },
        thirdExaminer: {
            type: Number,
            min: 0,
            max: 60,
            default: 0
        },
        total: {
            type: Number,
            // required: true
        }
    }
);

const Mark = mongoose.model('Mark', markSchema);

module.exports = Mark;