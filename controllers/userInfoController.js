// external imports
const jwt = require('jsonwebtoken');

// internal imports
const User = require('../models/People');

const getUserInfo = async (req, res, next) => {
    let { token } = req.headers;

    if (token) {
        try {
            token = token.split(' ')[1];
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            
            const user = await User.findOne({ _id: decode.userId });

            res.status(200).json({
                result: user
            });
        } catch(err) {
            res.status(500).json({
                error: 'Authentication failure'
            });
        }
    } else {
        res.status(401).json({
            error: 'Authentication failure'
        });
    }
}

module.exports = getUserInfo;