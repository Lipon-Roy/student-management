// external imports
const express = require('express');

// internal imports
const { getTabulation, getCourseTabulation } = require('../controllers/resultController');

const router = express.Router();

router.get('/:dept/:session/:semester', getTabulation);

router.get('/:dept/:session/:semester/:course/:code', getCourseTabulation);

module.exports = router;