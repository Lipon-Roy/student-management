// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addMarkValidators, addMarksValidationHandler } = require('../middlewares/mark/markValidators');
const { addMarks } = require('../controllers/markController');

// create router
const router = express.Router();

// add marks
router.post('/', checkLogin, addMarkValidators, addMarksValidationHandler, addMarks);

module.exports = router;