const mongoose = require('mongoose');
const async = require('async');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');
const metaDB = require('../db_models/meta_db');
const profileDB = require('../db_models/profile_db');
const scheduler = require('./metacache_db_ops').scheduler;
const mergeResults = require('./manage_db_ops').mergeResults;

const MAX_NUM_CONTENTS_RETURN = 60;
const DEFAULT_NUM_CONTENTS_RETURN = 20;

const valid_fields = ["id", "index", "studio", "genre", "director","starname"];
const valid_sort = ["view", "duration", "rating","favorite", "releaseDate"];

const support_recommend_fields = ['starname'];
const returned_fields = '_id title index videoDomain videoUrl director starnames genres studio duration imgSummaryUrl favorite rating view releaseDate';
const DEFAULT_SORT = "releaseDate";
module.exports.returned_fields = returned_fields;
/**
 * term
 * 1. user content. User content is a document that stored in the contentDB but only returns partial fields
 * specified in the 'returned_fields'
 */

////////////////////////////////////////////////////////////////////////
//////////////////// user query function starts ////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * helper functions
 */
/**
 * Convert a string to a non negative integer, otherwise return -1
 * @param {*} str A string value
 */
function __convertToNonNeg(str){
    let num = parseInt(str);
    if(num.toString() === str){
        if(num >= 0){
            return num;
        }else{
            return -1;
        }
    }else{
        return -1;
    }
}

/**
 * 
 * @param field A string cannot be null or undefined
 * @param value A string cannot be null or undefined
 * @param sort A string can be null or undefined
 * @param from A string can be null or undefined
 * @param limit A string can be null or undefined
 * @return {success: false | true, reasons: [string], value: {fields:[string], values:[string], option: {}}}
 * 1. check the field is valid
 * 2. check sort
 * 3. check from and limit, from and limit must no negative
 * 
 */
function __validateQueryInput(field, value, sort, from, limit){

    if(valid_fields.indexOf(field) === -1){
        return {success: false, reasons: [`${field} is an invalid field`]};
    }
    if(sort && valid_sort.indexOf(sort) === -1){
        return {success: false, reasons: [`${sort} is an invalid sort`]};
    }
    
    from_n = __convertToNonNeg(from);
    limit_n = __convertToNonNeg(limit);
    let options = {};
    if(sort){
        options['sort'] = {};
        options['sort'][sort] = -1;
    }
    if(from_n !== -1){
        options['skip'] = from_n;
    }
    if(limit_n !== -1){
        if(limit_n > MAX_NUM_CONTENTS_RETURN){
            limit_n = MAX_NUM_CONTENTS_RETURN;
        }
        options['limit'] = limit_n;
    }else{
        options['limit'] = DEFAULT_NUM_CONTENTS_RETURN;
    }
    let result = {field: field, value: value, option: options}
    return {success: true, value: result};
}
/**
 * All __query*** function's callback returns
 * {
 *  success: boolean,
 *  reasons:[string],
 *  value:[user-content, user-content]
 * }
 * ** If content is not found, also return true, and return value:[]
*/

/**
 * query user content 
 * @param id the content id
 * @param callback
*/
function __queryContentById(id, callback){
    contentDB.findById(id).select(returned_fields)
    .then((content)=>{
        if(content){
            callback({success: true, reasons:[], value: [content]});
        }else{
            callback({success: false, reasons:[], value: []});
        }
    }).catch((err)=>{
        callback({success: false, reasons:[err.message]});
    });
}
/**
 * query star/genre and sort, then populate with selected fields.
 * @param type "genre" or "star"
 * @param value genrename or starname
 * @param options : {sort:{xxx:-1}, limit:, skip:}
 * @param callback ({success:boolean, reasons:[], value:[]})
*/
function __queryContentsByStarOrGenre(type, value, options, callback){
    let modelDB;
    if(type === 'genre'){
        modelDB = genreDB;
    }else if(type === 'starname'){
        modelDB = starDB;
    }else{
        callback({success: false, reasons: [`${type} is not supported`]});
        return;
    }
    let query = modelDB.find({name: value}, null, options).populate({path: 'contentId', select: returned_fields});
    query.exec((err, contents)=>{
        if(err){
            callback({success: true, reasons:[err.message]});
        }else{
            let value = [];
            contents.forEach(ele=>{
                value.push(ele.contentId);
            });
            callback({success:true, reasons:[], value:value});
        }
    });
}
/**
 * find documents from contentDB
*/
function __queryContentsByOtherFields(field, value, options, callback){
    let query_condition = {};
    query_condition[field] = value;
    contentDB.find(query_condition, returned_fields, options, (err, contents)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            callback({success: true, reasons:[], value: contents});
        }
    });
}


/**
 * @param field A string
 * @param value A string
 * @param sort A string
 * @param from A string
 * @param limit A string can be undefined 
 */

function queryContents(field, value, sort, from, limit, callback){

    let queryValue = __validateQueryInput(field, value, sort, from, limit);
    if(!queryValue.success){
        callback(queryValue);
        return;
    }
    switch(queryValue.value.field){
        case "id":{
            __queryContentById(
                queryValue.value.value,
                callback
            );
        };break;

        case "starname":
        case "genre":{
            __queryContentsByStarOrGenre(
                queryValue.value.field, 
                queryValue.value.value,
                queryValue.value.option, 
                callback
            );
        };break;

        default:{
            __queryContentsByOtherFields(
                queryValue.value.field, 
                queryValue.value.value,
                queryValue.value.option, 
                callback
            );
        };break; 
    }
}

module.exports.queryContents = queryContents;

////////////////////////////////////////////////////////////////////////
//////////////////// user query function ends ////////////////////////
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//////////////////// quickquery function starts ////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * helper function
*/
function __valid_quick_query(sort, from, limit){
    let options = {};
    if(sort && valid_sort.indexOf(sort) === -1){
        return {success:false, reasons:[`Invalid sort ${sort}\nPlease choose from ${valid_sort}`]};
    }
    options['sort'] = {};
    if(sort){
        options['sort'][sort] = -1;
    }else{
        options['sort'][DEFAULT_SORT] = -1;
    }
    let from_n = __convertToNonNeg(from);
    if(from_n >= 0){
        options['skip'] = from_n;      
    }else{
        options['skip'] = 0;
    }
    let limit_n = __convertToNonNeg(limit);
    if(limit_n !== -1){
        if(limit_n > MAX_NUM_CONTENTS_RETURN){
            limit_n = MAX_NUM_CONTENTS_RETURN;
        }
        options['limit'] = limit_n;
    }else{
        options['limit'] = DEFAULT_NUM_CONTENTS_RETURN;
    }
    return {success: true, value:options};
}
/**
 * 
 * @param {*} sort 
 * @param {*} from A string
 * @param {*} limit A string
 * @param {*} callback 
 */
function quickQueryContents(sort, from, limit, callback){
    let queryValue = __valid_quick_query(sort, from, limit);
    if(!queryValue.success){
        callback(queryValue);
        return;
    }
    contentDB.find({}, returned_fields, queryValue.value,(err, contents)=>{
        if(err){
            callback({success:false, reasons:[err.message]});
        }else{
            callback({success: true, reasons:[], value: contents});
        }
    });
}
module.exports.quickQueryContents = quickQueryContents;

////////////////////////////////////////////////////////////////////////
//////////////////// quickquery function ends ////////////////////////
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//////////////////// recommended function starts ////////////////////////
////////////////////////////////////////////////////////////////////////
const DEFAULT_NUM_RECOMMEND_RETURN = 10;
const MAX_NUM_RECOMMEND_RETURN = 20;

function __recommendStarContents(id, limit, callback){
    
    
    let options =  {};
    options['limit'] = limit_n;
    let sort = valid_sort[1];
    options['sort'] = {};
    options['sort'][sort] = -1;
    options['skip'] = 0;
    __queryContentsByStarOrGenre('starname', starname, options, callback);
}
function __random(from, through){
    return Math.ceil(Math.random() * (through - from)) + from;
}
const hot_genres = [];
function __filterGenres(genres){
    let result = [];
    genres.forEach(ele=>{
        if(hot_genres.indexOf(ele) !== -1){
            result.push(ele);
        }
    });
    return result;
}
function recommendContents(id, limit, callback){
    let limit_n = __convertToNonNeg(limit);
    if(limit_n === -1){
        limit_n = DEFAULT_NUM_RECOMMEND_RETURN;
    }else if(limit_n > MAX_NUM_RECOMMEND_RETURN){
        limit_n = MAX_NUM_RECOMMEND_RETURN;
    }
    //limit_n = limit_n + 1;
    
    contentDB.findById(id, (err, content)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            let results = [];
            let err_messages = [];
            let remaining = limit_n;
            let starnames = content.starnames;
            let genres = __filterGenres(content.genres);
            async.series([
                // star
                (__callback__)=>{
                    if(starnames.length >= 1){
                        let query = starDB.find({name:starnames[0]}, null, {skip: __random(0, 10), limit: Math.ceil(remaining / 3)}).populate({path:'contentId', select: returned_fields});
                        query.exec((err, contents)=>{
                            if(err){
                                err_messages.push(err.message);
                                __callback__();
                            }else{
                                contents.forEach(ele=>{
                                    if(ele.contentId._id !== id){
                                        results.push(ele.contentId);
                                        remaining--;
                                    }
                                });
                                __callback__();
                            }
                        });
                    }else{
                        __callback__();
                    }
                },
                (__callback__)=>{
                // genre
                    if(genres.length === 0){
                        __callback__();
                    }else{
                        let item_pre_genre = Math.ceil(remaining / genres.length);
                        scheduler(genres, 4, (genre, __callback____)=>{
                            let query = genreDB.find({name: genre}, null, {skip: __random(0,200), limit: item_pre_genre}).populate({path:'contentId', select: returned_fields});
                            query.exec((err, contents)=>{
                                if(err){
                                    __callback____(err);
                                }else{
                                    contents.forEach(ele=>{
                                        if(ele.contentId._id !== id && remaining > 0){
                                            results.push(ele.contentId);
                                            remaining--;
                                        }
                                    });
                                    __callback____();
                                }
                            });
                        },(result_)=>{
                            if(result_.success){
                                __callback__();
                            }else{
                                err_messages = err_messages.concat(result_.reasons);
                                __callback__();
                            }
                        });
                    }
                }, 
                (__callback__)=>{
                    if(remaining > 0){
                        contentDB.find({}, returned_fields, {skip: __random(0, 4000), limit: remaining}, (err, contents)=>{
                            if(err){
                                err_messages.push(err.message);
                                __callback__();
                            }else{
                                results = results.concat(contents);
                                __callback__();
                            }
                        });
                    }else{
                        __callback__();
                    }
                }
            ],(err, result)=>{
                callback({success: err_messages.length === 0, reasons: err_messages, value: results});
            });
        }
    });
}

module.exports.recommendContents = recommendContents;

////////////////////////////////////////////////////////////////////////
//////////////////// recommended function ends ////////////////////////
////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////
//////////////////// profile function starts ////////////////////////
////////////////////////////////////////////////////////////////////////

function queryProfile(field, value, callback){
    if(typeof field !== 'string' || typeof value !== 'string'){
        callback({success: false, reasons:['invalid inputs']});
    }else{
        profileDB.findOne({field: field, value: value}, 'field value profile_url intro', (err, item)=>{
            if(err){
                callback({success: false, reasons:[err.message]});
            }else if(item){
                callback({success: true, reasons:[], value: item});
            }else{
                callback({success: false, reasons:[`queryProfile ${field} ${value} not found`]}); 
            }
        });
    }
}

/**
 * help query meta to query image url
*/
function __queryAProfileForQueryMeta(object, callback){
    queryProfile(object.field, object.name, (result_)=>{
        if(result_.success){
            object.profile_url = result_.value.profile_url;
        }
        callback({success: true, reasons:[], value: object});
    });
}
function __queryProfilesForQueryMeta(object_arr, callback){
    scheduler(object_arr, 10, (object, __callback__)=>{
        queryProfile(object.field, object.name, (result_)=>{
            if(result_.success){
                object.profile_url = result_.value.profile_url;
            }
            __callback__();
        });
    },()=>{
        callback({success:true, reasons:[], value: object_arr});
    });
    
}
module.exports.queryProfile = queryProfile;

////////////////////////////////////////////////////////////////////////
//////////////////// profile function ends ////////////////////////
////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////
//////////////////// queryMeta function starts ////////////////////////
////////////////////////////////////////////////////////////////////////
const valid_meta = ["meta", "starname", "genre", "director", "studio"];
const meta_selected_fields = 'field name counter';
const DEFAULT_META_ITEM_NUM = 20;
const MAX_META_TIEM_NUM = 60;
/**
 * field, value
*/
function queryMeta(field, value, from, limit, callback){
    if(valid_meta.indexOf(field) === -1){
        callback({success: false, 
            reasons: [`${field} is not supported on queryMeta\nPlease choose from ${valid_meta}`]
        });
        return;
    }
    
    if(value === undefined){
        let from_n = __convertToNonNeg(from);
        if(from_n === -1){
            from_n = 0;
        }
        let limit_n = __convertToNonNeg(limit);
        if(limit_n === -1){
            limit_n = DEFAULT_META_ITEM_NUM;
        }else if(limit_n > MAX_META_TIEM_NUM){
            limit_n = MAX_META_TIEM_NUM;
        }
        const options = {
            sort: {name: 1},
            skip: from_n,
            limit: limit_n
        };
        metaDB.find({field: field},meta_selected_fields, options, (err, results)=>{
            if(err){
                callback({success: false, reasons:[err.message]});
            }else{
                __queryProfilesForQueryMeta(results, callback);
                //callback({success: true, reasons:[], value: results});
            }
        });
    }else{
        metaDB.findOne({field: field, name:value},meta_selected_fields, (err, result)=>{
            if(err){
                callback({success: false, reasons:[err.message]});
            }else{
                __queryAProfileForQueryMeta(result, callback);
                //callback({success: true, reasons:[], value: result});
            }
        });
    }
}

module.exports.queryMeta = queryMeta;

////////////////////////////////////////////////////////////////////////
//////////////////// queryMeta function starts ////////////////////////
////////////////////////////////////////////////////////////////////////