// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addSessionValidators, addSessionValidationHandler } = require('../middlewares/session/sessionValidators');
const { getSession, addSession, getSessions } = require('../controllers/sessionController');

// create router
const router = express.Router();

// get single session
router.get('/:id', checkLogin, getSession);

// get all sessions
router.get('/', checkLogin, getSessions);

// add session
router.post('/', checkLogin, addSessionValidators, addSessionValidationHandler, addSession);

module.exports = router;