const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');


// @desc      Get all Courses
// @route     GET /api/v1/courses
// @route     GET /api/v1/bootcamps/:bootcampId/courses
// @access    Public


exports.getCourses = asyncHandler(async (req, res, next)=>{
    if(req.params.bootcampId){
       const courses = await Course.find
       ({bootcamp: req.params.bootcampId});

         res.status(200).json({
        success: true,
        count: courses.length,
        data: courses
    });
    } else {
        //! populate its  way a better option then to use JOIN
        // IN order to have just the information we want, we use {} and the object in case
      res.status(200).json(res.advancedResults);
    }

    const courses = await query;

   
});




// @desc      Get all Courses
// @route     GET /api/v1/courses
// @route     GET /api/v1/bootcamps/:bootcampId/courses
// @access    Public


exports.getCourse = asyncHandler(async (req, res, next)=>{
     const course = await Course.findById(req.params.id).populate({
            path: 'bootcamp',
            select: 'name description'
        });   
    if (!course) {
        return next(
            new ErrorResponse(`No course with the id of ${req.params.id}`), 404
        )
    }
    res.status(200).json({
        success: true,
        data: course
    })
});



// @desc      Add Course
// @route     POST /api/v1/bootcamps/:bootcampId/courses
// @access    Private
//! A course is associated with a bootcamp, so we need a way to get the bootcamp ID

exports.addCourse = asyncHandler(async (req, res, next)=>{
    // We wanna submit bootcamp as a body field, in the course model, bootcamp is an actual field
    // Assign (=) , referring to our course model.
    req.body.bootcamp = req.params.bootcampId;
   const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if (!bootcamp) {
        return next(
            new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`), 404
        )
    }

         // Make sure user logged is the bootcamp owner
    //! this is gonna give us an object Id, and We wanna compare to this to the actual req.user.id which is a string  
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to add the bootcamp ${bootcamp._id}`, 401));
    }

    const course = await Course.create(req.body)
    
    res.status(200).json({
        success: true,
        data: course
    })
});



// @desc      Update Course
// @route     PUT /api/v1/courses/:id
// @access    Private

exports.updateCourse = asyncHandler(async (req, res, next)=>{
   let course = await Course.findById(req.params.id)
    if (!course) {
        return next(
            new ErrorResponse(`No couse with the id of ${req.params.id}`), 404
        )
    }

            // Make sure user logged is the bootcamp owner
    //! this is gonna give us an object Id, and We wanna compare to this to the actual req.user.id which is a string  
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to update the course ${course._id}`, 401));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body,{
        new: true,
        runValidators:true
    })
    
    res.status(200).json({
        success: true,
        data: course
    })
});


// @desc      Delete Course
// @route     PUT /api/v1/courses/:id
// @access    Private

exports.deleteCourse = asyncHandler(async (req, res, next)=>{
   const course = await Course.findById(req.params.id)
    if (!course) {
        return next(
            new ErrorResponse(`No couse with the id of ${req.params.id}`), 404
        )
    }


            // Make sure user logged is the bootcamp owner
    //! this is gonna give us an object Id, and We wanna compare to this to the actual req.user.id which is a string  
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to delete the course ${course._id}`, 401));
    }

    await course.remove();
    
    res.status(200).json({
        success: true,
        data: {}
    })
});