// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addMarkValidators, addMarksValidationHandler } = require('../middlewares/mark/allMarkValidators');
const { singleInternalMarkValidators, singleInternalMarksValidationHandler } = require('../middlewares/mark/singleInternalMarkValidators');
const { multiInternalMarkValidators, multiInternalMarksValidationHandler } = require('../middlewares/mark/multiInternalMarkValidators');
const { addMarks, getMarks, addSingleMark, addMultipleMark } = require('../controllers/markController');

// create router
const router = express.Router();

// get all marks
router.get('/', getMarks);

// add all marks for all student for the individual session
router.post('/', addMarkValidators, addMarksValidationHandler, addMarks);

// add internal mark for single student
router.put('/single', singleInternalMarkValidators, singleInternalMarksValidationHandler, addSingleMark);

// add internal marks for multiple student
router.put('/multiple', multiInternalMarkValidators, multiInternalMarksValidationHandler, addMultipleMark);

module.exports = router;