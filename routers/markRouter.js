// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addMarkValidators, addMarksValidationHandler } = require('../middlewares/mark/markValidators');
const { addMarks, getMarks } = require('../controllers/markController');

// create router
const router = express.Router();

// get all marks
router.get('/', getMarks);

// add marks
router.post('/', addMarkValidators, addMarksValidationHandler, addMarks);

module.exports = router;