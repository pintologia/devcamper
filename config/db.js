const mongoose = require('mongoose'); 

const connectDB = async ()=>{
    const conn = await mongoose.connect(process.env.MONGO_URI, {
        useCreateIndex: true,
        useNewUrlParser:true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
    console.log(`MongoDB connected: ${conn.connection.host} `)

};
module.exports= connectDB;