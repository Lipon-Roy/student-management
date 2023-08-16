// External import
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');

// internal import
const User = require('../models/People');

const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ roll: req.body.userRoll });
        
        if (user && user._id) {
            const isValidPassword = await bcrypt.compare(
                req.body.password,
                user.password
            );

            if (isValidPassword) {
                const userObj = {
                    userId: user._id,
                    userName: user.username,
                    userDept: user.department
                };

                const token = jwt.sign(userObj, process.env.JWT_SECRET, {
                    expiresIn: '1h'
                });

                res.status(200).json({token});
            } else {
                throw createError('Login failed, please try again latter');
            }
        } else {
            throw createError('Login failed, please try again latter')
        }
    } catch(err) {
        res.status(400).json({
            errors: {
                common: {
                    message: err.message
                }
            }
        })
    }
}

module.exports = {
    login,
}