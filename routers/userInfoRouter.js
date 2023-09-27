// External imports
const express = require('express');

// internal imports
const getUserInfo = require('../controllers/userInfoController');

const router = express.Router();

router.get('/', getUserInfo);

module.exports = router;