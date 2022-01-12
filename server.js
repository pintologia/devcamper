const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize'); // sec
const helmet = require('helmet'); // sec
const xss_clean = require('xss-clean'); // sec
const hpp = require('hpp'); // sec
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const path = require('path');




// Load the ENV
dotenv.config({path: './config/config.env'});

// Connect to database 
connectDB();

// Route files 
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

// Body Parser
app.use(express.json());

// cookie-Parser
app.use(cookieParser());

// Dev logging  middleware 
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
};

// file upload 
app.use(fileupload());

//! Sanitize data
app.use(mongoSanitize()); /**prevent from NonSQL injection */

//! set security headers
app.use(helmet()); /**Helmet helps you secure your Express apps by setting various HTTP headers. It's not a silver bullet, but it can help! */

//! Prevent XSS attacks (from html or jss script tags input on the field)
app.use(xss_clean());

//! Rate Limiting (of requests)
    const limiter = rateLimit({
        windowMs: 10* 60* 1000, // 10 min
        max: 100
    })
    app.use(limiter);

//! Prevent Http params pollution
app.use(hpp());

//! enable cors 
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

// MiddleWare must be loaded after routes if we wanna be able to use it, they are executed in a linear order
app.use(errorHandler);


const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, console.log(`Server running on ${process.env.NODE_ENV} mode on port ${PORT}`.blue.bold));

// Handle unhandled promise rejections 
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server and exit process
    server.close(() => process.exit(1));
})
