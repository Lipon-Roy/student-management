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
            enum: [1, 2, 3, 4, 5, 6, 7, 8]
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
            required: true
        },
        midTwo: {
            type: Number,
            required: true
        },
        attendance: {
            type: Number,
            required: true
        },
        presentationOrAssignment: {
            type: Number,
            required: true
        },
        firstExaminer: {
            type: Number,
            required: true
        },
        secondExaminer: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }
);

const Mark = mongoose.model('Mark', markSchema);

module.exports = Mark;