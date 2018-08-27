const mongoose = require('mongoose');
const async = require('async');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');
const metaDB = require('../db_models/meta_db');
const profileDB = require('../db_models/profile_db');
const scheduler = require('../db_operations/helper_functions').scheduler;
const string2NonNegative = require('../db_operations/helper_functions').string2NonNegative;
const returned_fields = '_id title index videoDomain videoUrl director starnames genres studio duration imgSummaryUrl favorite rating view releaseDate';

module.exports.returned_fields = returned_fields;

const MAX_RETURN_CONTENT_NUM = 40;
const DEFAULT_RETURN_CONTENT_NUM = 20;
const DEFAULT_RECOMMEND_CONTENT_NUM = 10;
const MAX_RECOMMEND_CONTENT_NUM = 20;

////////////////////////////////////////////////////////////////
//////////////////// query contents starts /////////////////////
////////////////////////////////////////////////////////////////

/**
 * Replace starnames ["aika", "honda"] with 
 * {
 *  "aiki":"image_url",
 *  "honda":"image_url"
 * }
*/
function attachStarProfiles(content, callback){
    if(content.starnames && content.starnames.length > 0){
        let star_profiles = {};
        scheduler(content.starnames, 3, (starname, __callback)=>{
            profileDB.findOne({field:"starname", value: starname}, (err, value)=>{
                if(value && value.profile_url){
                    star_profiles[starname] = value.profile_url;
                }else{
                    star_profiles[starname] = "";
                }
                __callback({success: true, reasons:[]});
            });
        }, (result)=>{
            content.starnames = star_profiles;
            callback({success: true, reasons:[], value: content});
        }); 
    }else{
        content.starnames = {};
        callback({success: true, reasons:[], value: content});
    }
}
function attachStarProfileToContents(contents, callback){
    let recommendContents = [];
    let task_arr = new Array(contents.length);
    for(let i = 0; i < task_arr.length; i++){
        task_arr[i] = i;
    }
    scheduler(task_arr, 3, (i, __callback)=>{
        let cont;
        try{
            cont = contents[i].toObject();
        }catch(err){
            cont = contents[i];
        }
        attachStarProfiles(cont, (fC)=>{
            if(fC.success){
                recommendContents[i] = fC.value;
                __callback({success: true, reasons:[]});
            }else{
                cont.starnames = {};
                recommendContents[i] = cont;
                __callback(fC);
            }                                
        });
    }, (starsResult)=>{
        callback({success: starsResult.success, reasons: starsResult.reasons, value: recommendContents});
    });
}


function verifyCondition(condition){
    if(condition && typeof condition === 'object'){
        let support_fields = ['studio', 'director', '_id', 'index'];
        let valid_condition = {};
        for(let i =0 ;i < support_fields.length; i++){
            let value = condition[support_fields[i]];
            if(value){
                valid_condition[support_fields[i]] = value;
            }
        }
        return valid_condition;
    }
    return null;
}
function verifyOption(option){
    if(!option){
        option = {};
    }
    let valid_option = {};
    let support_sorts = ['view', 'releaseDate', 'duration', 'favorite', 'rating'];
    let limit = string2NonNegative(option.limit);
    if(limit === -1){
        valid_option['limit'] = DEFAULT_RETURN_CONTENT_NUM;
    }else if(limit > MAX_RETURN_CONTENT_NUM){
        valid_option['limit'] = MAX_RETURN_CONTENT_NUM;
    }else{
        valid_option['limit'] = limit;
    }
    let skip = string2NonNegative(option.skip);
    if(skip === -1){
        valid_option['skip'] = 0;
    }else{
        valid_option['skip'] = skip;
    }
    let sort = option.sort;
    if(sort){
        for(let i = 0; i < support_sorts.length; i++){
            let value = sort[support_sorts[i]];
            if(value){
                let valid_sort = {};
                valid_sort[support_sorts[i]] = value;
                valid_option['sort'] = valid_sort;
                return valid_option;
            }
        }
    }
    return valid_option;
}

/**
 * Having a content, manually populate its star profile and genre and studio profile
 */
function queryStarnames(starname, option, callback){
    starDB.find({name: starname}, null, option, (err, starsContents)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            let contents = [];
            for(let i =0; i < starsContents.length; i++){
                contents.push(starsContents[i].contentId);
            }
            attachStarProfileToContents(contents, callback);
        }
    });
}
function queryGenres(genre, option, callback){
    genreDB.find({name: genre}, null, option, (err, genreContents)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            let contents = [];
            for(let i =0; i < genreContents.length; i++){
                contents.push(genreContents[i].contentId);
            }
            attachStarProfileToContents(contents, callback);
        }
    });
}
function queryContents(condition, option, callback){
    let validOption = verifyOption(option);
    if(condition.starname){
        queryStarnames(condition.starname, validOption, callback);
    }else if(condition.genre){
        queryGenres(condition.genre, validOption, callback);
    }else{
        contentDB.find(
            verifyCondition(condition), 
            returned_fields, 
            validOption, 
            (err, contents)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else if(contents.length > 0){
                    let task_number_arr = new Array(contents.length);
                    let finalConents = [];
                    for(let i = 0; i < contents.length; i++){
                        task_number_arr[i] = i;
                    }
                    scheduler(task_number_arr, 5, (no, __callback)=>{
                        let content = contents[no].toObject();
                        attachStarProfiles(content, (fC)=>{
                            if(fC.success){
                                finalConents[no] = fC.value;
                            }else{
                                content.starnames = {};
                                finalConents[no] = content;
                            }
                            __callback({success: true, reasons:[]});
                        });
                    }, (result)=>{
                        callback({success: true, reasons:[], value: finalConents});
                    });
                }else{
                    callback({success: true, reasons:[], value:[]});
                }
            }
        );
    }
}
////////////////////////////////////////////////////////////////
//////////////////// query contents ends ///////////////////////
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
//////////////////// recommend contents ends ///////////////////
////////////////////////////////////////////////////////////////
const recommendGenres = ['big-tits', 'uncensored'];

function filterGenres(genres){
    let result = [];
    genres.forEach(ele=>{
        if(recommendGenres.indexOf(ele) !== -1){
            result.push(ele);
        }
    });
    return result;
}

function random(seed){
    //seed a string
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        let char = seed.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    if(hash < 0){
        hash = -1 * hash;
    }
    return hash;
}

function recommendContents(id, limit, callback){
    // limit 2/3 star
    // remaining 2/3 selected fields
    // random
    let limit_n = string2NonNegative(limit);
    if(limit_n === -1){
        limit_n = DEFAULT_RECOMMEND_CONTENT_NUM;
    }else if(limit_n > MAX_RECOMMEND_CONTENT_NUM){
        limit_n = MAX_RECOMMEND_CONTENT_NUM;
    }
    limit_n = limit_n + 10; // avoid replicate with the input id.

    contentDB.findById(id, (err, content)=>{
        if(err || !content){
            if(err){
                callback({success: false, reasons:[err.message]});
            }else{
                callback({success: false, reasons: [`${id} not existed`]});
            }
        }else{
            let recommendContents = [];
            let errMessages = [];
            let remaining = limit_n;
            let starnames = content.starnames;
            let genres = filterGenres(content.genres);
            let randomNum = random(id);
            async.series([
                // star
                (__callback__)=>{
                    if(starnames.length >= 1){
                        let query = starDB.find({name:starnames[0]}, null, {skip: random % 10, limit: Math.ceil(remaining / 3)}).populate({path:'contentId', select: returned_fields});
                        query.exec((err, contents)=>{
                            if(err){
                                errMessages.push(err.message);
                                __callback__();
                            }else{
                                for(let i = 0; i < contents.length; i++){
                                    recommendContents.push(contents[i].contentId);
                                }
                                __callback__();
                            }
                        });
                    }else{
                        // no starname is found
                        __callback__();
                    }
                },
                (__callback__)=>{
                // genre
                    if(genres.length === 0){
                        __callback__();
                    }else{
                        remaining = limit_n - recommendContents.length;
                        let item_pre_genre = Math.ceil(remaining / genres.length);
                        // just 1
                        scheduler(genres, 1, (genre, __callback)=>{
                            let query = genreDB.find({name: genre}, null, {skip: randomNum % 200, limit: item_pre_genre}).populate({path:'contentId', select: returned_fields});
                            query.exec((err, contents)=>{
                                if(err){
                                    errMessages.push(err.message);
                                    __callback({success: false, reasons:[err.message]});
                                }else{
                                    for(let i = 0; i < contents.length; i++){
                                        recommendContents.push(contents[i].contentId);
                                    }
                                    __callback({success: true, reasons:[]});
                                }
                            });
                        },(result)=>{
                            __callback__();
                        });
                    }
                }, 
                (__callback__)=>{
                    remaining = limit_n - recommendContents.length;
                    if(remaining > 0){
                        contentDB.find({}, returned_fields, {skip: randomNum % 4000, limit: remaining}, (err, contents)=>{
                            if(err){
                                errMessages.push(err.message);
                                __callback__();
                            }else{
                                recommendContents = recommendContents.concat(contents);
                                __callback__();
                            }
                        });
                    }else{
                        __callback__();
                    }
                }
            ],(err, result)=>{
                let idList = [id];
                let contentList = [];
                limit_n = limit_n - 10;
                let counter = 0;
                for(let i = 0; i < recommendContents.length; i++){
                    if(counter < limit_n){
                        if(idList.indexOf(recommendContents[i]._id) === -1){
                            contentList.push(recommendContents[i]);
                            idList.push(recommendContents[i]._id);
                            counter++;
                        }
                    }
                }
                attachStarProfileToContents(contentList, (result)=>{
                    if(errMessages.length > 0){
                        result.success = false;
                        result.reasons = result.reasons.concat(errMessages);
                    }
                    callback(result);
                });
            });
        }
    });
}



////////////////////////////////////////////////////////////////
//////////////////// recommned contents ends ///////////////////
////////////////////////////////////////////////////////////////
module.exports.attachStarProfiles = attachStarProfiles;
module.exports.queryContents = queryContents;
module.exports.recommendContents = recommendContents;
