// external imports
const express = require("express");

// internal imports
const {
  getTabulation,
  getCourseTabulation,
  getImproveMarkTabulation,
  getSemesterTranscript,
} = require("../controllers/resultController");

const router = express.Router();

router.get("/semester-transcript/:dept/:session/:roll", getSemesterTranscript);

router.get("/:dept/:session/:semester", getTabulation);

router.get("/:dept/:session/:semester/:course/:code", getCourseTabulation);

router.get("/:dept/:session/:course/:code", getImproveMarkTabulation);

module.exports = router;
