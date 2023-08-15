// External import
const mongoose = require('mongoose');

const peopleSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        roll: {
            type: String,
            required: true
        },
        session: {
            type: String,
            required: true,
        },
        currentSession: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: ""
        },
        mobile: {
            type: String,
            default: ""
        },
        password: {
            type: String,
            required: true
        },
        drop: {
            type: String,
            enum: ['year', 'drop', ""],
            default: ""
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        }
    }
);

const People = mongoose.model('People', peopleSchema);

module.exports = People;