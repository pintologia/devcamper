const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');

// @desc      Get all Bootcamps 
// @route     GET /api/v1/bootcamps
// @access    Public
exports.getBootcamps = asyncHandler(async (req, res , next) =>{
  
    res
    .status(200)
    .json(res.advancedResults);

})


// @desc      Get Single Bootcamps 
// @route     GET /api/v1/bootcamps/:id
// @access    Public
exports.getBootcamp = asyncHandler( async (req, res , next) =>{

        const bootcamp = await  Bootcamp.findById(req.params.id);
        if(!bootcamp){
        return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({success: true, data: bootcamp});
})


// @desc      Create Bootcamps 
// @route     POST /api/v1/bootcamps
// @access    Private
exports.createBootcamps = asyncHandler(async (req, res , next) =>{

  // Add user to req.body
  req.body.user = req.user.id;

  // Check for published bootcamps (we're finding by the user.id, so wy req it)
  const publishedBootcamp = await Bootcamp.findOne({user: req.user.id})

  // If a user isn't a admin, they can only post one
  if (publishedBootcamp && req.user.role !== 'admin') {
    return next (new ErrorResponse(`The user with the ID ${req.user.id} as already published a Bootcamp`, 400))
  }

    const bootcamp =  await Bootcamp.create(req.body);
    res.status(201).json({success: true, data: bootcamp});
    
})


// @desc      Update Bootcamps 
// @route     PUT /api/v1/bootcamps/:id
 // @access    private
exports.updateBootcamps = asyncHandler( async (req, res , next) =>{

        let bootcamp = await Bootcamp.findById(req.params.id);

    // Make sure if bootcamp exist 
    if (!bootcamp){
        return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

    // Make sure user logged is the bootcamp owner
    //! this is gonna give us an object Id, and We wanna compare to this to the actual req.user.id which is a string  
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401));
    }


    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });


    res.status(200).json({success: true, data: bootcamp});
})


// @desc      Delete Bootcamps 
// @route     DELETE /api/v1/bootcamps
// @access    private
exports.deleteBootcamp = asyncHandler(async (req, res , next) =>{
        const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp){
        return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

      // Make sure user logged is the bootcamp owner
    //! this is gonna give us an object Id, and We wanna compare to this to the actual req.user.id which is a string  
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401));
    }

    // this method is gonna trigger that middleware (model)
    bootcamp.remove();
    res.status(200).json({success: true, data: {}});

});


// @desc      Get bootcamps within a radius 
// @route     DELETE /api/v1/bootcamps/radius/:zipcode/:distance
// @access    private
exports.getBootcampsInRadius = asyncHandler(async (req, res , next) =>{
    const {zipcode, distance}= req.params;

    // Get latitude/longitude from geocoder
    const loc= await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng= loc[0].longitude;

    // Calculate Radius
    // Divide distande by radius of earth
    // Earth radius= 3, 963 miles / 6,378 km
    const radius = distance /3963 ;
    const bootcamps = await Bootcamp.find({
        // mongoose.docs $phere $center
        location: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}
    });

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })


});


// @desc      photo upload 
// @route     PUT /api/v1/bootcamps/:id/photo
// @access    private
exports.bootcampPhotoUpload = asyncHandler(async (req, res , next) =>{
        const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp){
        return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }


      // Make sure user logged is the bootcamp owner
    //! this is gonna give us an object Id, and We wanna compare to this to the actual req.user.id which is a string  
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp photo`, 401));
    }

    if (!req.files){
        return  next(new ErrorResponse(`Please add a file`, 404));
    }

    const file = req.files.file;

    // Make sure the image is a photo
    // Test the mimetype
    if (!file.mimetype.startsWith('image')){
        return  next(new ErrorResponse(`Please upload an image`, 404));
    }


    // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });e

});



// we use the money sign no use operators (mongoose).