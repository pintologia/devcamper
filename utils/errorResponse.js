class ErrorResponse extends Error {
    // object from the class 
    constructor(message, statusCode){
        // call that constructor, he has his own message
        super(message);
        // create a custom property 
        this.statusCode = statusCode;
    }
}

module.exports = ErrorResponse;