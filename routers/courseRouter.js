// External import
const express = require('express');

// Internal import
const { getCourses, getCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { updateCourseValidators, updateCourseValidationHandler} = require('../middlewares/course/courseUpdateValidators');

const router = express.Router();

router.get('/:session/:department/:semester', getCourses);

// get course for update
router.get('/update/:session/:department/:id', getCourse);

// update individual course
router.put('/:session/:department/:id', updateCourseValidators, updateCourseValidationHandler, updateCourse);

// delete course
router.delete('/:session/:department/:id', deleteCourse);


module.exports = router;