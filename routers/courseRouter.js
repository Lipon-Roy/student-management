// External import
const express = require('express');

// Internal import
const { getCourse } = require('../controllers/courseController');

const router = express.Router();

router.get('/:session/:department/:semester', getCourse);

module.exports = router;