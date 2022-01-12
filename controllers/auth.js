const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');


// @desc      Register User
// @route     POST /api/v1/auth/register
// @access    Public

exports.register = asyncHandler(async (req, res, next)=>{
    // pull staff from the body
    const {name, email, password, role} = req.body;
    /// Create user 
    const user = await User.create({
        name, 
        email, 
        password, 
        role
    });

    //! User and user => User (we're calling a static on the model), user (we're calling a method (For the actual user))
    //! Create Token

    const token = user.getSignedJwtToken();
    res.status(200).json({success: true, token});
})



// @desc      Login User
// @route     POST /api/v1/auth/login
// @access    Public

exports.login = asyncHandler(async (req, res, next)=>{
    // pull staff from the body
    //! using the data that is being passed in, just to authenticate
    const {email, password} = req.body;

    // Validate email & password
    if (!email || !password) {
        return next (new ErrorResponse('Please provide an email and password', 400));
    }

    // check for user 
    //! select password because set it to false in the model
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return next (new ErrorResponse('Invalid credentials', 401));
    }

    // check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return next(new ErrorResponse('Invalid Password'))
    }


    sendTokenResponse(user, 200, res)
  })




// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});


// @desc      log user out
// @route     POST /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});


//! @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {


    //So we don't we're going to use fine fine by the an update but we don't want to just past and request
  //req.body because then if a password is sent or a roll or any other user field that's in the model
  /// is sent it will actually update that. Just name and e-mail

  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});


// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
// Password is selected false by default, thats why we select 
  const user = await User.findById(req.user.id).select('+password');
   
   
  //! Check current password
  // We have in the model e method to match password, in fact is asynchronous it returns a promise
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});



//! @desc      Forgot Password
// @route     POST /api/v1/auth/forgotPassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    // check for user 
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next (new ErrorResponse('No user with that email', 404));
    }

    // Get reset Token
    const resetToken = user.getResetPasswordToken();
    // save it
    await user.save({ validateBeforeSave: false})

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }


 /* res.status(200).json({
    success: true,
    data: user
  }); */
});



//! Where we actually use the sent token
//! @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken, // which  is called in the DB
    resetPasswordExpire: { $gt: Date.now() }
  });
 
  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});





//! Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
