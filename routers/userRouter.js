// External import
const express = require('express');

// Internal imports
const { addUser, getUser, getUsers, getUsersInSession } = require('../controllers/userController');
const { userValidators, userValidationHandler } = require('../middlewares/user/userValidators');
const checkLogin = require('../middlewares/common/checkLogin');

// create router
const router = express.Router();

// get single user
router.get('/:id', getUser);

// get all users
router.get('/', getUsers);

// get users in session
router.get('/session', getUsersInSession);

// add user
router.post('/', userValidators, userValidationHandler, addUser);

module.exports = router;