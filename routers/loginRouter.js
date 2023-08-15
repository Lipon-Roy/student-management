// External imports
const express = require('express');

// internal imports
const { loginValidators, loginValidationHandler } = require('../middlewares/login/loginValidators');
const { login } = require('../controllers/loginController');

const router = express.Router();

router.post('/', loginValidators, loginValidationHandler, login);

module.exports = router;