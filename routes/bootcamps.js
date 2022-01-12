// Bringing Express
const express = require('express');

// Bring the methods from controllers
const {
    getBootcamps, 
    getBootcamp, 
    createBootcamps, 
    updateBootcamps, 
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload
} = require('../controllers/bootcamps');


const Bootcamp = require('../models/Bootcamp');
//! Wherever we wanna use, we need to pass it in with models.
const advancedResults = require('../middleware/advancedResults');

//! Include other resource routers 
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

// Initialize router
const router = express.Router();
// protect route 
const { protect, authorize } = require('../middleware/auth');

//! Re-route into other resource routers, mount that into the course routers.
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewRouter);

router.route('/:photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

router.route('/radius/:zipcode/:distance').
get(getBootcampsInRadius);

// Using the routes
router.route('/')  
.get( advancedResults(Bootcamp, 'courses'),getBootcamps)
.post(protect, createBootcamps);

router.route('/:id')
.get(getBootcamp)
.put(protect, authorize('publisher', 'admin'), updateBootcamps)
.delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

module.exports = router;