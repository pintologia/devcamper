// Bringing Express
const express = require('express');

// Bring the methods from controllers
const {
    getCourses, 
    getCourse, 
    addCourse, 
    updateCourse, 
    deleteCourse 
} 
    = require('../controllers/courses');


    const Course = require('../models/Course');
    const advancedResults = require('../middleware/advancedResults');


// Initialize router
const router = express.Router({mergeParams: true}); // so we're gonna be able to merge with bootcamps, and go to /bootcamps, or /:id

// Protect functions
//! wherever i put protect, the user must be logged in 
const { protect, authorize } = require('../middleware/auth');

// Using the routes
router.route('/')  
.get(advancedResults(Course, {
            path: 'bootcamp',
            select: 'name description'
        }), getCourses)
.post(protect, authorize('publisher', 'admin'), addCourse);

router.route('/:id')
.get(getCourse)
.put(protect, authorize('publisher', 'admin'), updateCourse)
.delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router; 