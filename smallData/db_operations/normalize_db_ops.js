const async = require('async');
// const EventEmitter = require('events');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');

const removeContentById = require('./manage_db_ops').removeContentById;
const scheduler = require('./metacache_db_ops').scheduler;
const mergeResults = require('./manage_db_ops').mergeResults;
//////////////////////////////////////////////////////////////////
//////////////////// normalize function starts ///////////////////
//////////////////////////////////////////////////////////////////

/**
 * helper functions
*/

/**
 * scheduler that start numWorker task
 * @param arr An array of item that is the input of the task function.
 * @param numWorker number of workers
 * @param task A function defined by the user that need to take two arguments, 1) an element of the task_arr 
 *  2) a callback function that takes an optional err as input.
 * @param callback A function that will be run after all the task complete. It's agrument {success:false|true, reasons:[], values:[]}
 */
/*function scheduler(arr, numWorker, task, callback){
    const sche = new EventEmitter();
    let error_message = [];
    let worker_counter = 0;
    sche.once('done', ()=>{
        if(error_message.length === 0){
            callback({success: true});
        }else{
            callback({success: false, reason: error_message});
        }
    });

    sche.on('worker_complete', ()=>{
        worker_counter ++;
        if(worker_counter === numWorker){
            sche.emit('done');
        }
    });

    sche.on('next', (i)=>{
        if(i >= arr.length){
            sche.emit('worker_complete');
        }else{
            task(arr[i], (err)=>{
                if(err){
                    error_message.push(err.message);
                }
                sche.emit('next', i+numWorker);
            }); 
        }
    });

    let temp_i = 0;
    while(temp_i < numWorker){
        sche.emit('next', temp_i);
        temp_i++;
    }
}*/
/**
 * normalize methods: 
 *  1). update a field to a new value by its old value
 *  2). update a field to a new value by another field's value
 *  3). delete a field's value
*/
/** 
 * change star/genre's name from old value to new value. 
 * starDB/genreDB and contentDB's starnames/genres field need to be changed.
 * 
*/

//////////////////////////////////////////////////////////////////
//////////////////// remove function starts //////////////////////
//////////////////////////////////////////////////////////////////

/**
 * remove by genre and starname only delete document from genreDB and starDB, no content
 * docuemnt is removed, contentDB's content document only splice .starnames and genres.
 * 
 * ContentDB doc only can be removed by videoDomain, domain
 */
const support_remove_fields = ['genre', 'starname', 'domain', 'videoDomain'];
/**
 * __remove/addGenre/Starname/From/toContentDB
 * @param contentId the content id
 * @param name the value
 * @param callback (err, Object);
 */
function __removeGenreFromContentDB(contentId, name, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback(err);
        }else{
            let i_p = content.genres.indexOf(name);
            if(i_p === -1){
                callback(null, {modified:0});
            }else{
                content.genres.splice(i_p, 1);
                content.save(callback);
            }
        }
    });
}
function __removeStarnameFromContentDB(contentId, name, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback(err);
        }else{
            let i_p = content.starnames.indexOf(name);
            if(i_p === -1){
                callback(null, {modified:0});
            }else{
                content.starnames.splice(i_p, 1);
                content.save(callback);
            }
        }
    });
}
/**
 * Delete the document from contentDB also according to each document,
 * delete the corresponding documents in the genreDB and starDB.
 * @param {*} field 
 * @param {*} value 
 * @param {*} callback 
 */
function __removeOtherFieldsFromContentDB(field, value, callback){
    // find ids
    let contentids = [];
    let query_condition = {};
    query_condition[field] = value;
    contentDB.find(query_condition, '_id', (err, ids)=>{
        if(err){
            callback({success:false, reasons:[err.message]});
            return;
        }
        ids.forEach(id=>{
            contentids.push(id._id);
        });
        scheduler(contentids, 10, (id, __callback__)=>{
            removeContentById(id, __callback__);
        },callback);
    });
}

/**
 * Remove a name from genre/star. First modified the contentDB, if success then modified the starDB/genreDB.
 * @param {*} field 
 * @param {*} name 
 * @param {*} callback 
 */
function removeName(field, name, callback){
    if(support_remove_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`${field} is not supported to remove\nPlease choose from ${support_remove_fields}`]});
        return;
    }
    let dbModel;
    if(field === "genre"){
        dbModel = genreDB;
    }else if(field === "starname"){
        dbModel = starDB;
    }else{
        __removeOtherFieldsFromContentDB(field, name, callback);
        return;
    }
    dbModel.find({name:name}, '_id name contentId', (err, results)=>{
        let contentIds = [];
        results.forEach(ele=>{
            contentIds.push(ele.contentId);
        });
        // modified contentDB
        scheduler(contentIds, 10, (id, __callback__)=>{
            if(field === 'genre'){
                __removeGenreFromContentDB(id, name, (err, result)=>{
                    if(err){
                        __callback__(err);
                    }else{
                        __callback__();
                    }
                });
            }else if(field === 'starname'){
                __removeStarnameFromContentDB(id, name, (err, result)=>{
                    if(err){
                        __callback__(err);
                    }else{
                        __callback__();
                    }
                });
            }else{
                __callback__();
            }
        },(result)=>{
            // modified starDB, or genreDB.
            if(result.success){
                dbModel.remove({name:name},(err, result_)=>{
                    if(err){
                        callback({success: false, reasons:[err.message]});
                    }else{
                        callback({success:true, reasons:[]});
                    }
                })
            }else{
                callback(result);
            }
        });
    });
}

module.exports.removeName = removeName

//////////////////////////////////////////////////////////////////
//////////////////// remove function ends ////////////////////////
//////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////
//////////////////// update function starts //////////////////////
//////////////////////////////////////////////////////////////////

const support_update_fields = ['starname', 'genre', 'studio', 'director'];
/**
 * Update content stored in the ContentDB:
 * old starname name to new starname name
 * @param contentId content id
 * @param old value A string indicates the old starname
 * @param new value A string indicates the new starname
 * @callback ({success: boolean, reasons:[string], value:[]})
 * 
*/
function __updateStarnameToContentDB(contentId, oldName, newName, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback(err);
        }else if(content){
            async.series([
                (__callback__)=>{
                    // add new
                    let i_p = content.starnames.indexOf(newName);
                    if(i_p === -1){
                        content.starnames.push(newName);
                        content.save((err, result)=>{
                            if(err){
                                __callback__(null, {success: false, reasons:[err.message]});
                            }else{
                                __callback__(null, {success: true, reasons:[], value: result});
                            }
                        });
                    }else{
                        __callback__(null, {success: true, reasons:[], value: {modified:0}});
                    }
                },
                (__callback__)=>{
                    // remove old
                    let i_p = content.starnames.indexOf(oldName);
                    if(i_p !== -1){
                        content.starnames.splice(i_p, 1);
                        content.save((err, result)=>{
                            if(err){
                                __callback__(null, {success: false, reasons:[err.message]});
                            }else{
                                __callback__(null, {success: true, reasons:[], value: result});
                            }
                        });
                    }else{
                        __callback__(null, {success: true, reasons:[], value: {modified:0}});
                    }
                }
            ], (err, results)=>{
                callback(mergeResults(results));
            });
        }else{
            callback({success: false, reasons:[`${contentId} does not existed`]});
        }
    });
}
/**
 * update contentDB's genres array, remove the old value and add the new value.
 * @param contentId content id
 * @param old value A string indicates the old genre name
 * @param new value A string indicates the new genre name
 * @callback ({success: boolean, reasons:[string], value:[]})
 * 
 * It first finds the content document, if err or not exist, then {success:false}
 * Otherwise, use async.series first push new name and then remove old name.
 * ** use series, cannot use parallel
 * 
*/
function __updateGenreToContentDB(contentId, oldName, newName, callback){
    contentDB.findById(contentId, (err, content)=>{
        if(err){
            callback(err);
        }else if(content){
            async.series([
                (__callback__)=>{
                    // add new
                    let i_p = content.genres.indexOf(newName);
                    if(i_p === -1){
                        content.genres.push(newName);
                        content.save((err, result)=>{
                            if(err){
                                __callback__(null, {success: false, reasons:[err.message]});
                            }else{
                                __callback__(null, {success: true, reasons:[], value: result});
                            }
                        });
                    }else{
                        __callback__(null, {success: true, reasons:[], value: {modified:0}});
                    }
                },
                (__callback__)=>{
                    // remove old
                    let i_p = content.genres.indexOf(oldName);
                    if(i_p !== -1){
                        content.genres.splice(i_p, 1);
                        content.save((err, result)=>{
                            if(err){
                                __callback__(null, {success: false, reasons:[err.message]});
                            }else{
                                __callback__(null, {success: true, reasons:[], value: result});
                            }
                        });
                    }else{
                        __callback__(null, {success: true, reasons:[], value: {modified:0}});
                    }
                }
            ], (err, results)=>{
                callback(mergeResults(results));
            });
        }else{
            callback({success: false, reasons:[`${contentId} does not existed`]});
        }
    });
}
/**
 * This function update genre/star name in both genreDB/starDB and contentDB
 * @param type A string "genre" or "starname"
 * @param oldName A string value
 * @param newName A string value
 * @param ({success:boolean, reasons:[])
 * 
 * It first go through the genreDB/starDB to find all the content id that has the old value.
 * Next, use scheduler with 10 workers to update contentDB.
 * If success, then update the genreDB/starDB
*/
function __updateGenreOrStar(type, oldName, newName, callback){
    let modelDB;
    if(type === 'genre'){
        modelDB = genreDB;
    }else if(type === 'starname'){
        modelDB = starDB;
    }else{
        callback({success: false, reasons:[`${type} is not supported`]});
        return;
    }
    modelDB.find({name: oldName}, 'contentId', (err, contentids)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
            return;
        }else{
            let content_ids = [];
            contentids.forEach(ele=>{
                content_ids.push(ele.contentId);
            });
            scheduler(content_ids, 10, (id, __callback__)=>{
                if(type === 'genre'){
                    __updateGenreToContentDB(id, oldName, newName, __callback__);
                }else{
                    // star
                    __updateStarnameToContentDB(id, oldName, newName, __callback__);
                }
            },(result)=>{
                // modified starDB or GenreDB, ** 
                // err case : {name:"A", contentId: "123"} => {name:"B", contentid:"123"}, but
                // {name:"B", contentid:'123'} already existed
                if(result.success){
                    modelDB.find({name:oldName}, (err, items)=>{
                        scheduler(items, 5, (item, __callback__)=>{
                            modelDB.findOne({name: newName, contentId: item.contentId}, (err ,result)=>{
                                if(err){
                                    __callback__(err);
                                }else if(result){
                                    __callback__(); // ignore because already existed;
                                }else{
                                    item.name = newName;
                                    item.save(__callback__);
                                }
                            });
                        },callback);
                    });
                    
                }else{
                    callback(result);
                }
            });
        }
    });
}
/**
 * Update "director" or "studio" from a oldvalue to a new value.
 * @param field 
 * @param callback({success: boolean, reasons:[]})
 * Use updateMany directly update the contentDB.
*/

function __updateOtherFieldsValue(field, oldValue, newValue, callback){
    let query_condition = {};
    let new_condition = {};
    query_condition[field] = oldValue;
    new_condition[field] = newValue;

    contentDB.updateMany(query_condition, new_condition, {new: true}, (err, result)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            callback({success: true, reasons:[], value:result});
        }
    }); 
}

/**
 * The all in one function for update old to new
 * first validate field.
 * 
*/
function updateNewValueByOldValue(field, oldValue, newValue, callback){
    if(support_update_fields.indexOf(field) === -1){
        callback({success:false, reasons:[`${field} is not supported\nPlease choose from ${support_update_fields}`]});
        return;
    }
    switch(field){
        case "starname":
        case "genre":{
            __updateGenreOrStar(field, oldValue, newValue, callback);
        };break;
        
        default:{
            __updateOtherFieldsValue(field, oldValue, newValue, callback);
        };break;
    }
}
module.exports.updateNewValueByOldValue = updateNewValueByOldValue;

//////////////////////////////////////////////////////////////////
//////////////////// update function ends //////////////////////
//////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////
////////////// update by another field function starts ///////////
//////////////////////////////////////////////////////////////////

const support_source_fields = ["genre"];
const support_target_fields = ['status'];
