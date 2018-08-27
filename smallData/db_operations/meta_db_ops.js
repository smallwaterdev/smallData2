/**
 * Update MetaDB from ContentDB, StarDB, and GenreDB
 */

const async = require('async');
const EventEmitter = require('events');
const metaDB = require('../db_models/meta_db');
const contentDB = require('../db_models/content_db');
const scheduler = require("./helper_functions").scheduler;
const starDB = require('../db_models/star_db');
const genreDB = require('../db_models/genre_db');
const mergeResults = require('./helper_functions').mergeResults;
// const 
const valid_meta_fields = ['meta','genre', 'starname', 'studio', 'director','domain', 'videoDomain', 'status'];
// const valid_meta_fields = ['director', 'studio', 'genre', 'starname'];


///////////////////////////////////////////////////////////////////////////////
////////////////////// Retriving meta function starts /////////////////////////
///////////////////////////////////////////////////////////////////////////////
function queryMeta(field, name, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`${field} is not supported\nPlease choose ${valid_meta_fields}`]});
        return;
    }
    let condition = {};
    condition['field'] = field;
    if(name !== null && name !== undefined){
        condition['name'] = name;
    }
    metaDB.find(condition, null, null, (err, data)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(data){
            callback({success: true, reasons:[], value: data});
        }else{
            callback({success: true, reasons:[], value: []});
        }
    });
}

///////////////////////////////////////////////////////////////////////////////
////////////////////// Retriving meta function ends ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
///////////////////// Remove meta starts ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function deleteMeta(field, name, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`${field} is not supported\nPlease choose ${valid_meta_fields}`]});
        return;
    }
    if(name === undefined || name === null){
        metaDB.remove({field: field}, (err, result)=>{
            if(err){
                callback({success: false, reasons: [err.message]});
                return;
            }else{
                callback({success: true, reasons:[], value: result});
            }
        });
        //callback({success: false, reasons:['function is not supported now']});
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
////////////////////////////////////////////////////////////////////////////////////
///////////////////// Remove meta ends /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////
///////////////////// refresh meta starts /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


/**
 * helper function
*/
/**
 * query the number of contents that belongs to match in the dbModel.
 * @param field A string be one of the valid_meta_fields
 * @param value A query condition "big-tits"
 * @callback ({success: , reasons:[], value: number});
*/
function __queryFieldValueCount(field, value, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`Invalid field ${field}`]});
        return;
    }
    switch (field) {
        case "genre":
        case "starname":{
            let dbModel;
            if(field === "genre"){
                dbModel = genreDB;
            }else{
                dbModel = starDB;
            }
            dbModel.find({name: value}, (err, contents)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: contents.length});
                }
            });
        };break;
        case "meta":{
            switch(value){
                case "genre":
                case "starname":{
                    let dbModel = starDB;
                    if(value === 'genre'){
                        dbModel = genreDB;
                    }
                    dbModel.find({}).distinct('name', (err, results)=>{
                        if(err){
                            callback({success: false, reasons:[err.message]});
                        }else{
                            callback({success: true, reasons:[], value: results.length});
                        }
                    });
                };break;
                case "total":{
                    contentDB.find({}, (err, contents)=>{
                        if(err){
                            callback({success: false, reasons:[err.message]});
                        }else{
                            callback({success: true, reasons:[], value: contents.length});
                        }
                    });
                };break;
                default:{
                    contentDB.find({}).distinct(value, (err, results)=>{
                        if(err){
                            callback({success: false, reasons:[err.message]});
                        }else{
                            callback({success: true, reasons:[], value: results.length});
                        }
                    });
                };break;
            }
        };break;
        default:{
            let condition = {};
            condition[field] = value;
            contentDB.find(condition, null, null, (err, data)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: data.length});
                }
            });
        };break;
    }
    
}
/**
 * query distinct names of either genres or starnames
 * @param dbModel Either genreDB or starDB
 * @callback ({success: , reasons:, value: ["big-tits", "small-tits",...]});
 * 
*/
function __queryFieldValues(field, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`Invalid field ${field}`]});
        return;
    }
    switch (field) {
        case "genre":
        case "starname":{
            let dbModel;
            if(field === "genre"){
                dbModel = genreDB;
            }else{
                dbModel = starDB;
            }
            dbModel.find({}).distinct('name', (err, results)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: results});
                }
            });
        };break;
        default:{
            contentDB.find({}).distinct(field, (err, data)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: data});
                }
            });
        };break;
    }
}

function __updateOrCreateMeta(field, value, count, callback){
    metaDB.findOneAndUpdate({field: field, name: value}, {counter: count}, {new: true}, (err, result)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(result){
            callback({success: true, reasons:[], value: result});
        }else{
            metaDB.create({field: field, name: value, counter: count}, (err, result)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: result});
                }
            });
        }  
    });
}
function __refreshMetaMeta(meta, callback){
    if(meta === 'meta' || valid_meta_fields.indexOf(meta) === -1){
        callback({success: false, reasons:[`Invalid field ${field}`]});
        return;
    }
    __queryFieldValueCount('meta', meta, (result)=>{
        if(result.success){
            __updateOrCreateMeta('meta', meta, result.value, callback);
        }else{
            callback(result);
        }
    });
}

function refreshMeta(field, value, callback){
    if(field === 'meta' && value === 'total'){
        __queryFieldValueCount('meta', 'total', (result)=>{
            if(result.success){
                __updateOrCreateMeta('meta', 'total', result.value, callback);
            }else{
                callback(result);
            }
        });
        return;
    }
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`Invalid field ${field}`]});
        return;
    }
    if(field === 'meta'){
        if(value){
            __refreshMetaMeta(value, callback);
        }else{
            //const valid_meta_fields = ['meta','genre', 'starname', 'studio', 'director','domain', 'videoDomain', 'status'];
            
            
            scheduler(valid_meta_fields, 1, (value, __callback)=>{
                if(value === 'meta'){
                    __callback({success: true, reasons:[], value:null});
                }else{
                    __refreshMetaMeta(value, __callback);
                }
            },(rs)=>{
                __queryFieldValueCount('meta', 'total', (result)=>{
                    if(result.success){
                        __updateOrCreateMeta('meta', 'total', result.value, (ts)=>{
                            callback(mergeResults([rs, ts]));
                        });
                    }else{
                        callback(mergeResults([rs, result]));
                    }
                });
            });
        }
    }else{
        if(value){
            __queryFieldValueCount(field, value, (result)=>{
                if(result.success){
                    let count = result.value;
                    __updateOrCreateMeta(field, value, count, callback);
                }else{
                    callback(result);
                }
            });
        }else{
            __queryFieldValues(field, (result)=>{
                if(result.success){
                    let values = result.value;
                    scheduler(values, 5, (value, __callback)=>{
                        if(value){
                            refreshMeta(field, value, __callback);
                        }else{
                            __callback({success: true, reasons:[], value:null});
                        }
                    },callback);
                }else{
                    callback(result);
                }
            });
        }
    }
}



///////////////////////////////////////////////////////////////////
////////////////////// core functions end /////////////////////////
///////////////////////////////////////////////////////////////////

module.exports.queryMeta = queryMeta;
module.exports.deleteMeta = deleteMeta;
module.exports.refreshMeta = refreshMeta;