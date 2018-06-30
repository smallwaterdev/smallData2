/**
 * Update MetaDB from ContentDB, StarDB, and GenreDB
 */

const async = require('async');
const EventEmitter = require('events');
const metaDB = require('../db_models/meta_db');
const contentDB = require('../db_models/content_db');
const queryMeta = require('./manage_db_ops').queryMeta;


///////////////////////////////////////////////////////////////////
////////////////// helper functions start ////////////////////////
///////////////////////////////////////////////////////////////////


/**
 * A scheduler function that start #numWorker workers to run the task function:
 * @argument arr A array of Item that is the input of the task
 * @argument numWorker Specify the number of workers
 * @argument task A function that takes an Item as input and a callback function
 * @argument callback A callback will be trigger when all task are done.
 * 
 * The task function's callback argument task an optional error as input. Error message will be 
 * record in an array, and gives to the final callback function.
 * The callback argument task an object input {success: true|false, [reason:[string]]}
 */
function scheduler(arr, numWorker, task, callback){
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
            task(arr[i], (err_or_result)=>{
                if(err_or_result){
                    if(typeof err_or_result.message === 'string'){
                        // err
                        error_message.push(err_or_result.message);
                    }else if(err_or_result.success === false && err_or_result.reasons){
                        error_message = error_message.concat(err_or_result.reasons);
                    }  
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
}
module.exports.scheduler = scheduler;
///////////////////////////////////////////////////////////////////
////////////////////// helper function end /////////////////////////
///////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
///////////////////// core functions start /////////////////////
////////////////////////////////////////////////////////////////

const valid_meta_fields = ['director', 'studio', 'genre', 'starname'];

/**
 * __refreshMetaDB either update or create a new document in the Meta collection.
 * @argument callback (err, result)
 */

function __refreshMetaDB(doc, callback){
    metaDB.findOneAndUpdate({field: doc.field, name: doc.name}, {$set: doc},{new: true}, (err, result)=>{
        if(err){
            callback(err);
        }else if(result){
            callback(null, result);
        }else{
            metaDB.create(doc, callback);
        }
    });
}


/**
 * The all in one function that takes care all field to update metaDB.
 */
function updateMetaCache(field, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`${field} is not supported\nPlease choose ${valid_meta_fields}`]});
        return;
    }
    queryMeta(field, undefined, (result)=>{
        if(result.success){
            const keys = Object.keys(result.value);
            let documents = [];
            keys.forEach(key=>{
                documents.push({field: field, name: key, counter: result.value[key]});
            })
            scheduler(documents, 10, (doc, __callback__)=>{
                __refreshMetaDB(doc, __callback__);
            },(update_result)=>{
                callback(update_result);
            });            
        }else{
            callback(result);
        }
    });
}

function removeMetaCache(field, name, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`${field} is not supported\nPlease choose ${valid_meta_fields}`]});
        return;
    }
    if(name === undefined){
        /*metaDB.remove({field: field}, (err, result)=>{
            if(err){
                callback({success: false, reasons: [err.message]});
                return;
            }else{
                callback({success: true, reasons:[], value: result});
            }
        });*/
        callback({success: false, reasons:['function is not supported now']});
    }else{
        metaDB.findOneAndRemove({field: field, name: name}, (err, result)=>{
            if(err){
                callback({success: false, reasons: [err.message]});
                return;
            }else{
                callback({success: true, reasons:[], value: result});
            }
        })
    }
}

function setProfileUrl(field, name, url, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`${field} is not supported\nPlease choose ${valid_meta_fields}`]});
        return;
    }
    metaDB.findOneAndUpdate({field: field, name: name}, {profile_url: url}, {new: true}, (err, result)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(result){
            callback({success: true, reasons:[], value: result});
        }else{
            callback({success: false, reasons:[`${field} ${name} is not found`]});
        }
    });
}

/**
 * 
 * @param {} field 
 * @param {*} callback ({success: boolean, reasons:[string], value:number}); // value = 0, also return true.
 */
function __countMetaDBMeta(field, callback){
    if(valid_meta_fields.indexOf(field) === -1 && field !== 'total'){
        callback({success: false, reasons: [`Invalid field ${field} which is not supported on querymetadbmeta`]});
        return;
    }
    if(field === 'total'){
        contentDB.find({}, (err, contents)=>{
            if(err){
                callback({success: false,  reasons:[err.message]});
            }else{
                callback({success: true, value: contents.length, reasons:[]});
            }
        });
    }else{
        metaDB.find({field: field}, (err, items)=>{
            if(err){
                callback({success: false,  reasons:[err.message]});
            }else{
                callback({success: true, value: items.length, reasons:[]});
            }
        });
    }
}

/**
 * This function will update and count all contents {meta: total}
 * all genre {meta:genre}
 * all starname {meta: starname}
 * all studio {meta: studio}
 * all director {meta: director} 
 * @param {*} callback 
 */

function allMetaCache(callback){
    scheduler(
        ['total', 'director', 'studio', 'starname', 'genre'],
        5,
        (field, __callback__)=>{
            __countMetaDBMeta(field, (result)=>{
                if(result.success){
                    __refreshMetaDB({field: 'meta', name: field, counter: result.value}, (err, result)=>{
                        if(err){
                            __callback__(err);
                        }else{
                            __callback__(null, result);
                        }
                    })
                }else{
                    __callback__(result);
                }
            });
        },
        callback
    );
}

///////////////////////////////////////////////////////////////////
////////////////////// core functions end /////////////////////////
///////////////////////////////////////////////////////////////////

module.exports.updateMetaCache = updateMetaCache;
module.exports.removeMetaCache = removeMetaCache;
module.exports.setProfileUrl = setProfileUrl;
module.exports.allMetaCache = allMetaCache;