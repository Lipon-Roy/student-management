// External import
const mongoose = require('mongoose');

const labMarkSchema = mongoose.Schema(
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
            required: true
        },
        currentSession: {
            type: String,
            required: true
        },
        credit: {
            type: Number,
            required: true
        },
        labTotal: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    }
);

const LabMark = mongoose.model('LabMark', labMarkSchema);

module.exports = LabMark;