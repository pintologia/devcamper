const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema({
    name: {
        type: String,
        require:[true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength:[50, 'Name can not be more than 50 char']

    },
    slug: String,
    description:{
         type: String,
        require:[true, 'Please add a Description'],
        maxlength:[500, 'Description can not be more than 50 char']
    },
    website: {

        type: String,
    match:[
       /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
       'Please, add a valid HTTP'
     ]
    },
    phone:{
        type: String,
        maxlength: [20, 'phone can not be longer than 20 char']
    },
    email:{
        type: String,
        match:[
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'
        ]
    },
    address: {
        type: String,
        require: [true, 'Please add an address']
    },
     location:{
        //GeoJSON Point

        type: {
      type: String, 
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
    }, 
    careers:{
        type:[String],
        require: true,
        enum:[
            'Web Development',
            'Mobile Development',
            'UI/UX',
            'Data Science',
            'Business',
            'Other'
        ]
    },
    averageRating:{
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max:[10, 'Rating can not be more than 10']
    },
    averageCost: Number,
    photo:{
        type: String,
        default: false
    },
    housing:{
        type: Boolean,
        default: false 
    },
    jobAssistance:{
        type: Boolean,
        default: false 
    },
    jobGuarantee:{
        type: Boolean,
        default: false 
    },
    acceptGi:{
        type: Boolean,
        default: false 
    },
    createdAt:{
        type: Date,
        default: Date.now 
    },

    user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  } ,

},
      // we want to add course fields,  but virtual fields
     {
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
        }
); 

// Create bootcamp slug from the name 
// pre => before save, like saving post => after saving. 
BootcampSchema.pre('save', function(next){
    this.slug = slugify(this.name, { lower: true});
    next();
})




// Geocode & create location field
BootcampSchema.pre('save', async function(next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  };

  // Do not save address in DB
  // Becouse we dont really need that address
  this.address = undefined;
  next();
});


    //! Cascade delete courses, when a bootcamp is deleted 
    //! the method in controller must be find and not findByIdAndDelete 
    
    BootcampSchema.pre('remove', async function(next){

        console.log(`Courses being removed from bootc ${this._id}`);
        // this._id to specify the bootcamp being removed
        await this.model('Course').deleteMany({bootcamp: this._id})
        next();
    })

    //! Reverse populate with virtuals
    //! the method in controller must be find and not findByIdAndDelete 
    // a field called courses
    BootcampSchema.virtual('courses', {
        ref: 'Course',
        localField: '_id',
        // The field in the course model that we wanna pertain to witch of course s bootcamp
        foreignField:'bootcamp',
        justOne: false
    })


// 'Bootcamp' => the of the model.
module.exports= mongoose.model('Bootcamp', BootcampSchema);

