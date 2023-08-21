// External imports
const express = require('express');

// Internal imports
const checkLogin = require('../middlewares/common/checkLogin');
const { addSessionValidators, addSessionValidationHandler } = require('../middlewares/session/sessionValidators');
const { getSession, addSession, getSessions, addCourse, getCourse } = require('../controllers/sessionController');
const { addCourseValidators, addCourseValidationHandler } = require('../middlewares/session/courseValidators');

// create router
const router = express.Router();

// get single session
router.get('/:id',getSession);

// get all sessions
router.get('/', getSessions);

// get cour in semester
router.post('/course/', getCourse);

// add session
router.post('/', addSessionValidators, addSessionValidationHandler, addSession);

// add course
router.put('/course', addCourseValidators, addCourseValidationHandler, addCourse);

module.exports = router;