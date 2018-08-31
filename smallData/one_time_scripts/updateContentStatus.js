// e.g. http://www5.javferry.com/movie/xxxxxx -> xxxxxx
const connectDB = require('./helper_function').connectDB;
const contentDB = require('../db_models/content_db');
const disconnectDB = require('./helper_function').disconnectDB;
const scheduler = require('../db_operations/helper_functions').scheduler;

connectDB((connectResult)=>{
    if(connectResult.success){
        contentDB.find({status:69}, null, null, (err, docs)=>{
            if(err){
                console.log(err.message);
            }else{
                scheduler(docs, 5, (doc, __callback)=>{
                    doc.status = 79;
                    doc.save((err, res)=>{
                        if(err){
                            console.log(doc._id, err.message);
                        }
                        __callback({success: true, reasons:[]});
                    });
                }, ()=>{
                    disconnectDB();
                });
            }
        })
    }else{
        console.log(JSON.stringify(connectResult.reasons));
    }
})
