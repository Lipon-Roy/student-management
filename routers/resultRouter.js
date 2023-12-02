// external imports
const express = require('express');

// internal imports
const { getTabulation, getCourseTabulation, getImproveMarkTabulation } = require('../controllers/resultController');

const router = express.Router();

router.get('/:dept/:session/:semester', getTabulation);

router.get('/:dept/:session/:semester/:course/:code', getCourseTabulation);

router.get('/:dept/:session/:course/:code', getImproveMarkTabulation);

module.exports = router;