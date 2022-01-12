
//!Basically this a short hand of kinda put a function inside of a function 
const advancedResults = (model, populate) => async (req, res, next) =>{
      // https://docs.mongodb.com/manual/reference/operator/query/


    let query;

    //! Copy of req.query
    const reqQuery= {...req.query};

    //! Fields to exclude => to not confuse the select with a attribute from our db 
    const removeFields= ['select', 'sort', 'page', 'limit'];

    //! Loop over removeFields and delete from reqQuery
    removeFields.forEach(param=> delete reqQuery[param]);
    
    // !Create query String 
    // Query parameters as a JSON String
    let queryStr = JSON.stringify(reqQuery);

    //! Create operators 
    // This characters /\b(gt|gte|lt|lte|in)\b/g are the reason why we previosly Stringified the query
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)


    //! Finding resource
    // Now we PARSE it back to JSON format 
    //! If we want to limit the fields, in the courses, we could do the same we did in the courses con. with de type and select
    query = model.find(JSON.parse(queryStr));

    //! Select Fields
    if (req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    //! Sort fields
    if (req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else{
        query = query.sort('-createdAt');
    }

    //! Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt (req.query.limit, 10) || 100;
    const startIndex = (page -1)*limit;
    const endIndex = page*limit;
    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    //! Populate
    if(populate){
        query = query.populate(populate);
    }


    //! Executing our query
    const results = await  query;

    //! Pagination result
    const pagination ={};

    if(endIndex < total){
        pagination.next ={
            page: page + 1,
            limit
        }
    }

    if(startIndex > 0){
        pagination.prev ={
            page: page - 1,
            limit
        }
    }

    //! create  a object on the res obj that we can use within any routes that use the middleware
    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    // we call, since is a middleware
    next();
};

module.exports = advancedResults;