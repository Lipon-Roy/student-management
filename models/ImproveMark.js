// External import
const mongoose = require('mongoose');

const improveMarkSchema = mongoose.Schema(
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
        isThirdExaminer: {
            type: Boolean,
            default: false
        },
        thirdExaminer: {
            type: Number,
            min: 0,
            max: 60,
            default: 0
        }
    }
);

const ImproveMark = mongoose.model('Improve', improveMarkSchema);

module.exports = ImproveMark;