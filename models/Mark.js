// External import
const mongoose = require('mongoose');

const markSchema = mongoose.Schema(
    {
        department: {
            type: String,
            required: true
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
        courseId: {
            type: mongoose.ObjectId,
            required: true,
        },
        midOne: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        midTwo: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        attendance: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        presentationOrAssignment: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        firstExaminer: {
            type: Number,
            min: 0,
            max: 60,
            default: 0
        },
        secondExaminer: {
            type: Number,
            min: 0,
            max: 60,
            default: 0
        },
        thirdExaminer: {
            type: Number,
            min: 0,
            max: 60,
            default: 0
        }
    }
);

const Mark = mongoose.model('Mark', markSchema);

module.exports = Mark;