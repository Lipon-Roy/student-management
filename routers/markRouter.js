// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addMarkValidators, addMarksValidationHandler } = require('../middlewares/mark/allMarkValidators');

const { singleInternalMarkValidators, singleInternalMarksValidationHandler } = require('../middlewares/mark/singleInternalMarkValidators');

const { multiInternalMarkValidators, multiInternalMarksValidationHandler } = require('../middlewares/mark/multiInternalMarkValidators');

const { addMarks, getMarks, addSingleMark, addMultipleMark, addSingleExternalMark, addMultipleExternalMark } = require('../controllers/markController');

const { singleExternalMarkValidators, singleExternalMarksValidationHandler } = require('../middlewares/mark/singleExternalMarkValidators');

const { addMultiExternalMarkValidators, addMultiExternalMarksValidationHandler } = require('../middlewares/mark/multiExternalMarksValidators');

// create router
const router = express.Router();

// get all marks
router.get('/', getMarks);

// add all marks for all student for the individual session
router.post('/', addMarkValidators, addMarksValidationHandler, addMarks);

// add internal mark for single student
router.put('/internal/single', singleInternalMarkValidators, singleInternalMarksValidationHandler, addSingleMark);

// add internal marks for multiple student
router.put('/internal/multiple', multiInternalMarkValidators, multiInternalMarksValidationHandler, addMultipleMark);

// add external mark for single student
router.put('/external/single', singleExternalMarkValidators, singleExternalMarksValidationHandler, addSingleExternalMark);

// add external marks for multiple student
router.put('/external/multiple', addMultiExternalMarkValidators, addMultiExternalMarksValidationHandler, addMultipleExternalMark);

module.exports = router;