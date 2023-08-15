// External import
const express = require('express');

// Internal imports
const { addUser, getUser, getUsers } = require('../controllers/userController');
const { userValidators, userValidationHandler } = require('../middlewares/user/userValidators');
const checkLogin = require('../middlewares/common/checkLogin');

// create router
const router = express.Router();

// get single user
router.get('/:id', checkLogin, getUser);

// get all users
router.get('/', checkLogin, getUsers);

// add user
router.post('/', userValidators, userValidationHandler, addUser);

module.exports = router;