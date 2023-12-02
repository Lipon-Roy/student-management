const mongoose = require('mongoose');

const pointSchema = mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    currentSession: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    roll: {
        type: String,
        required: true
    },
    totalPoint: {
        type: Number,
        required: true
    },
    totalCredit: {
        type: Number,
        required: true
    }
})

const Point = mongoose.model('POint', pointSchema);

module.exports = Point;