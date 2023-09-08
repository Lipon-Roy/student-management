// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addMarkValidators, addMarksValidationHandler } = require('../middlewares/mark/allMarkValidators');

const { addMarks, getAllMarks, addSingleInternalMark, addMultipleInternalMark, addSingleExternalMark, addMultipleExternalMark, addSingleLabMark, addMultipleLabMark, addSingleImproveMark, getLabMarks, getSingleMark } = require('../controllers/markController');

const { addSingleInternalMarkValidators, addSingleInternalMarksValidationHandler} = require('../middlewares/mark/singleInternalMarkValidators');

const { addMultiInternalMarkValidators, addMultiInternalMarksValidationHandler } = require('../middlewares/mark/multiInternalMarkValidators');

const { addSingleExternalMarkValidators, addSingleExternalMarksValidationHandler } = require('../middlewares/mark/singleExternalMarkValidators');

const { addMultiExternalMarkValidators, addMultiExternalMarksValidationHandler } = require('../middlewares/mark/multiExternalMarksValidators');

const { addSingleLabMarkValidators, addSingleLabMarkValidationHandler} = require('../middlewares/labMark/singleMarkValidators');

const { addMultipleLabMarkValidators, addMultipleLabMarkValidationHandler } = require('../middlewares/labMark/multipleLabMarkValidators');

// create router
const router = express.Router();

// get all marks
router.get('/', getAllMarks);

// get single mark
router.get('/:dept/:semester/:course/:roll', getSingleMark);

// get all lab marks
router.get('/lab', getLabMarks);

// add all marks for all student for the individual session
router.post('/', addMarkValidators, addMarksValidationHandler, addMarks);

// add internal mark for single student
router.put('/internal/single', addSingleInternalMarkValidators, addSingleInternalMarksValidationHandler, addSingleInternalMark);

// add internal marks for multiple student
router.put('/internal/multiple', addMultiInternalMarkValidators, addMultiInternalMarksValidationHandler, addMultipleInternalMark);

// add external mark for single student
router.put('/external/single', addSingleExternalMarkValidators, addSingleExternalMarksValidationHandler, addSingleExternalMark);

// add external marks for multiple student
router.put('/external/multiple', addMultiExternalMarkValidators, addMultiExternalMarksValidationHandler,  addMultipleExternalMark);

// add lab mark for single student
router.put('/lab/single', addSingleLabMarkValidators, addSingleLabMarkValidationHandler, addSingleLabMark);

// add lab marks for multiple student
router.put('/lab/multiple', addMultipleLabMarkValidators, addMultipleLabMarkValidationHandler, addMultipleLabMark);

// add theory course improvements mark for single student
router.put('/improve/single', addSingleExternalMarkValidators, addSingleExternalMarksValidationHandler, addSingleImproveMark);

module.exports = router;