// e.g. http://www5.javferry.com/movie/xxxxxx -> xxxxxx
const connectDB = require('./helper_function').connectDB;
const contentDB = require('../db_models/content_db');
const disconnectDB = require('./helper_function').disconnectDB;
const scheduler = require('../db_operations/helper_functions').scheduler;
function updateJavfinderIndexUrl(url){
    let segments = url.split('/');
    if(segments.length !== 5){
        console.log('javfinder.is', url);
        return null;
    }else{
        return segments[4];
    }
}
//http://javseen.com/kept-are-in-happy-transformation-anal-pet-maria-wakatsuki/
function updateJavseenIndexUrl(url){
    let segments = url.split('/');
    if(segments.length != 5){
        console.log('javseen.com',url);
        return null;
    }else{
        return segments[3];
    }
}

connectDB((connectResult)=>{
    if(connectResult.success){
        contentDB.find({status:79}, null, null, (err, docs)=>{
            if(err){
                console.log(err.message);
            }else{
                scheduler(docs, 5, (doc, __callback)=>{
                    let newIndexUrl;
                    if(doc.domain === 'javfinder.is'){
                        newIndexUrl = updateJavfinderIndexUrl(doc.indexUrl);
                    }else if(doc.domain === 'javseen.com'){
                        newIndexUrl = updateJavseenIndexUrl(doc.indexUrl);
                    }else{
                        console.log('Unknow domain', doc.indexUrl, doc._id, doc.domain);
                        __callback({success: true, reasons:[]});
                        return;
                    }
                    if(newIndexUrl){
                        doc.indexUrl = newIndexUrl;
                        doc.status = 69;
                        doc.save((err, res)=>{
                            if(err){
                                console.log(doc._id, err.message);
                            }
                            __callback({success: true, reasons:[]});
                        });
                    }else{
                        __callback({success: true, reasons:[]});
                    }
                    
                }, ()=>{
                    disconnectDB();
                });
            }
        })
    }else{
        console.log(JSON.stringify(connectResult.reasons));
    }
})
