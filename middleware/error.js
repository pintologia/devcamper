const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next)=>{
    // spread operator
    let error = {...err}
    error.message = error.message;
    // Log to console for dev mode 
    console.log(err)

    // mongoose bad ObjectID
    if(err.name === 'CastError'){
        const message= `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);

    }

    // mongoose DUPLICATE KEY 
    // 11000 stands for duplicated key code
    if(err.code === 11000){
        const message = 'Duplicate Field'
        error = new ErrorResponse(message, 400);
    }

    // Mongoose Validation Error
    if(err.name === 'ValidationError'){
        const message= Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }


    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'server error'
    });
};

module.exports = errorHandler;

// since its a middleware we need to run it through app.use

// CastError, ValidationError, Duplicate Errors are just the 'NAME ' of the errors that we are handling