// external imports
const express = require('express');

// internal imports
const { getTabulation } = require('../controllers/resultController');

const router = express.Router();

router.get('/', getTabulation);

module.exports = router;