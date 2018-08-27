const async = require('async');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');
const VideoContent = require('../../data_model/video_content');
const mergeResults = require('./helper_functions').mergeResults;
const scheduler = require('./helper_functions').scheduler;


///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Query starname starts /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function queryContentsByStarname(name, options, callback){
    let query = starDB.find({name: name}, null, options).populate({path:'contentId'});
    query.exec((err, results)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            let contents = [];
            for(let item of results){
                contents.push(item.contentId);
            }
            callback({success: true, reasons:[], value:contents});
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Query starname ends ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Update starname starts /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

/**
 * Update content stored in the ContentDB:
 * old starname name to new starname name
 * @param contentId content id
 * @param old value A string indicates the old starname
 * @param new value A string indicates the new starname
 * @callback ({success: boolean, reasons:[string], value:[]})
 * 
*/
function __updateStarnameInContentDB(contentId, oldName, newName, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(content){
            let i_p = content.starnames.indexOf(newName);
            if(i_p === -1){
                content.starnames.push(newName);
            }
            i_p = content.starnames.indexOf(oldName);
            if(i_p !== -1){
                content.starnames.splice(i_p, 1);
            }
            content.save((err, result)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: result});
                }
            });
        }else{            
            callback({success: true, reasons:[], value:null});
        }
    });
}

function updateStarname(oldName, newName, callback){
    starDB.find({name: oldName}, null, null, (err, starnames)=>{
        if(err){
            callback({success: false, reasons:[]});
        }else{
            scheduler(starnames, 5, (starname, __callback)=>{
                __updateStarnameInContentDB(starname.contentId, oldName, newName, (updateResult)=>{
                    if(updateResult.success){
                        starDB.findByIdAndUpdate(starname._id, {name: newName}, {new: true}, (err, rs)=>{
                            if(err){
                                __callback({success: true, reasons:[err.message]});
                            }else{
                                __callback({success: true, reasons:[], value: rs});
                            }
                        });
                    }else{
                        __callback(updateResult);
                    }
                });
            }, callback);
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Update starname ends ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function __deleteStarnameInContentDB(contentId, name, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(content){
            let i_p = content.starnames.indexOf(name);
            if(i_p !== -1){
                content.starnames.splice(i_p, 1);
                content.save((err, result)=>{
                    if(err){
                        callback({success: false, reasons:[err.message]});
                    }else{
                        callback({success: true, reasons:[], value: result});
                    }
                });
            }else{
                callback({success: true, reasons:[], value: null});
            }
        }else{
            callback({success: true, reasons:[]});
        }
    });
}

function deleteStarname(name, callback){
    starDB.find({name: name}, null, null, (err, starnames)=>{
        if(err){
            callback({success: false, reasons:[]});
        }else{
            scheduler(starnames, 5, (starname, __callback)=>{
                __deleteStarnameInContentDB(starname.contentId, name, (result)=>{
                    if(result.success){
                        starDB.findByIdAndRemove(starname._id, (err, findR)=>{
                            if(err){
                                __callback({success: false, reasons:[err.message]});
                            }else{
                                __callback({success: true, reasons:[], value: findR});
                            }
                        });
                    }else{
                        __callback(result);
                    }
                });
            }, callback);
        }
    });
}

module.exports.queryContentsByStarname = queryContentsByStarname;
module.exports.updateStarname = updateStarname;
module.exports.deleteStarname = deleteStarname;