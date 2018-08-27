const async = require('async');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');
const VideoContent = require('../../data_model/video_content');
const mergeResults = require('./helper_functions').mergeResults;
const scheduler = require('./helper_functions').scheduler;


///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Query genre starts /////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function queryContentsByGenre(name, options, callback){
    let query = genreDB.find({name: name}, null, options).populate({path:'contentId'});
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
////////////////////////// Query genres ends //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Update genre starts ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

/**
 * Update content stored in the ContentDB:
 * old genre  name to new genre name
 * @param contentId content id
 * @param old value A string indicates the old genre
 * @param new value A string indicates the new genre
 * @callback ({success: boolean, reasons:[string], value:[]})
 * 
*/
function __updateGenreInContentDB(contentId, oldGenre, newGenre, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(content){
            let i_p = content.genres.indexOf(newGenre);
            if(i_p === -1){
                content.genres.push(newGenre);
            }
            i_p = content.genres.indexOf(oldGenre);
            if(i_p !== -1){
                content.genres.splice(i_p, 1);
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

function updateGenre(oldGenre, newGenre, callback){
    genreDB.find({name: oldGenre}, null, null, (err, genres)=>{
        if(err){
            callback({success: false, reasons:[]});
        }else{
            scheduler(genres, 5, (genre, __callback)=>{
                __updateGenreInContentDB(genre.contentId, oldGenre, newGenre, (updateResult)=>{
                    if(updateResult.success){
                        genreDB.findByIdAndUpdate(genre._id, {name: newGenre}, {new: true}, (err, rs)=>{
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
////////////////////////// Update genre ends ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// delete genre starts ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function __deleteGenreInContentDB(contentId, name, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(content){
            let i_p = content.genres.indexOf(name);
            if(i_p !== -1){
                content.genres.splice(i_p, 1);
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

function deleteGenre(name, callback){
    genreDB.find({name: name}, null, null, (err, genres)=>{
        if(err){
            callback({success: false, reasons:[]});
        }else{
            scheduler(genres, 5, (genre, __callback)=>{
                __deleteGenreInContentDB(genre.contentId, name, (result)=>{
                    if(result.success){
                        genreDB.findByIdAndRemove(genre._id, (err, findR)=>{
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

///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Delete genre ends //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

module.exports.queryContentsByGenre = queryContentsByGenre;
module.exports.updateGenre = updateGenre;
module.exports.deleteGenre = deleteGenre;