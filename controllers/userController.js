// External imports
const createError = require('http-errors');
const bcrypt = require('bcrypt');

// Internal imports
const User = require('../models/People');

// get single user
const getUser = async (req, res, next) => {
    try {
        const user = await User.findById({_id: req.params.id});
        res.status(200).json({ result: user });
    } catch (err) {
        next(createError(err.message));
    }
}

// get all user
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ result: users });
    } catch (err) {
        next(createError(err.message));
    }
}

// get user sessionwise
const getUsersInSession = async (req, res, next) => {
    try {
        const users = await User.find({
            currentSession: req.params.current,
            department: req.params.department
        }).sort('roll');
        res.status(200).json({
            result: users
        });
    } catch(err) {
        next(createError(err.message));
    }
}

// add user
const addUser = async (req, res, next) => {
    try {
        // check user already exist or not
        


        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            ...req.body,
            password: hashedPassword,
            
        });

        await newUser.save();
        res.status(201).json({
            message: 'User was added successfully'
        });

    } catch (err) {
        res.status(500).json({
            errors: {
                common: {
                    message: err.message
                }
            }
        })
    }
}

module.exports = {
    getUser,
    getUsers,
    getUsersInSession,
    addUser,
}