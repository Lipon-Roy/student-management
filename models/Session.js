// External import
const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema(
    {
        session: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        },
        courses: {
            type: Array,
            default: [],
        },
        totalStudent: Number
    }
);

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;