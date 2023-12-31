// External imports
const express = require("express");

// Internal imports
const checkLogin = require("../middlewares/common/checkLogin");
const {
  addMarkValidators,
  addMarksValidationHandler,
} = require("../middlewares/mark/allMarkValidators");

const {
  addMarks,
  getAllMarks,
  addSingleInternalMark,
  addMultipleInternalMark,
  addSingleExternalMark,
  addMultipleExternalMark,
  addSingleLabMark,
  addMultipleLabMark,
  addSingleImproveMark,
  getLabMarks,
  getSingleMark,
  getIsThirdExaminer,
  addThirdExaminerMarks,
  getImproveMark,
  addSingleThirdImproveMark,
  addSingleLabImproveMark,
} = require("../controllers/markController");

const {
  addSingleInternalMarkValidators,
  addSingleInternalMarksValidationHandler,
} = require("../middlewares/mark/singleInternalMarkValidators");

const {
  addMultiInternalMarkValidators,
  addMultiInternalMarksValidationHandler,
} = require("../middlewares/mark/multiInternalMarkValidators");

const {
  addSingleExternalMarkValidators,
  addSingleExternalMarksValidationHandler,
} = require("../middlewares/mark/singleExternalMarkValidators");

const {
  addMultiExternalMarkValidators,
  addMultiExternalMarksValidationHandler,
} = require("../middlewares/mark/multiExternalMarksValidators");

const {
  addThirdExaminerMarkValidator,
  addThirdExaminerMarkValidationHandler,
} = require("../middlewares/mark/multiThirdMarkValidators");

const {
  addSingleLabMarkValidators,
  addSingleLabMarkValidationHandler,
} = require("../middlewares/labMark/singleMarkValidators");

const {
  addMultipleLabMarkValidators,
  addMultipleLabMarkValidationHandler,
} = require("../middlewares/labMark/multipleLabMarkValidators");

// create router
const router = express.Router();

// add all marks for all student for the individual session
router.post("/", addMarkValidators, addMarksValidationHandler, addMarks);

// add internal mark for single student
router.put(
  "/internal/single",
  addSingleInternalMarkValidators,
  addSingleInternalMarksValidationHandler,
  addSingleInternalMark
);

// add internal marks for multiple student
router.put(
  "/internal/multiple",
  addMultiInternalMarkValidators,
  addMultiInternalMarksValidationHandler,
  addMultipleInternalMark
);

// add external mark for single student
router.put(
  "/external/single",
  addSingleExternalMarkValidators,
  addSingleExternalMarksValidationHandler,
  addSingleExternalMark
);

// add external marks for multiple student
router.put(
  "/external/multiple",
  addMultiExternalMarkValidators,
  addMultiExternalMarksValidationHandler,
  addMultipleExternalMark
);

// add third examiner external marks for multiple student
router.put(
  "/third/multiple",
  addThirdExaminerMarkValidator,
  addThirdExaminerMarkValidationHandler,
  addThirdExaminerMarks
);

// add lab mark for single student
router.put(
  "/lab/single",
  addSingleLabMarkValidators,
  addSingleLabMarkValidationHandler,
  addSingleLabMark
);

// add lab marks for multiple student
router.put(
  "/lab/multiple",
  addMultipleLabMarkValidators,
  addMultipleLabMarkValidationHandler,
  addMultipleLabMark
);

router.put(
  "/lab/improve/single",
  addSingleLabMarkValidators,
  addSingleLabMarkValidationHandler,
  addSingleLabImproveMark
);

// add theory course improvements mark for single student
router.put(
  "/improve/single",
  addSingleExternalMarkValidators,
  addSingleExternalMarksValidationHandler,
  addSingleImproveMark
);

// add third examiner mark for theory course improvements
router.put("/improve/third", addSingleThirdImproveMark);

// get multiple mark
router.get("/:dept/:session/:semester/:courseName/:courseCode", getAllMarks);

// get single mark
router.get(
  "/:dept/:session/:semester/:courseName/:courseCode/:roll",
  getSingleMark
);

// get mark which are isThirdExaminer true
router.get("/:dept/:semester/:courseName/:courseCode", getIsThirdExaminer);

// get improve third examiner mark
router.get(
  "/improve/:dept/:semester/:courseName/:courseCode/:roll",
  getImproveMark
);

// get all lab marks
router.get("/lab", getLabMarks);

module.exports = router;
