/**
 * The manage db operations define functions for creating, retriving, updating, and removing function.
*/
const async = require('async');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');
const VideoContent = require('../../data_model/video_content');


///////////////////////////////////////////////////////////////////////////////
//////////////////////// Retriving function starts ////////////////////////////
///////////////////////////////////////////////////////////////////////////////


const splitter = "~";
const allow_one = ['id', 'index', 'indexUrl', "videoUrl", "starname", "genre"]; // only one field is allowed
const valid_fields = ["id", "index", "indexUrl", "videoUrl",  "domain", "videoDomain", "status" , "studio", "genre", "director","starname"];
const valid_sort = ["view", "duration", "rating", "favorite", "releaseDate", "createdAt", "updatedAt"];

/**
 * helper functions
*/

function __string2NonNegative(value){
    if(typeof value === 'number'){
        return value;
    }
    num = parseInt(value);
    if(value !== num.toString()){
        return -1;
    }else if(num >= 0){
        return num;
    }else{
        // NaN or negative
        return -1;
    }

}
module.exports.string2NonNegative = __string2NonNegative;
/**
 * 
 * @param fields A string cannot be null or undefined
 * @param values A string cannot be null or undefined
 * @param sort A string can be null or undefined
 * @param from A string can be null or undefined
 * @param limit A string can be null or undefined
 * @return {success: false | true, reasons: [string], value: {fields:[string], values:[string], option: {}}}
 * 1. check query fields and values length
 * 2. check fields are valid
 * 3. check allow one fields
 * 4. check sort
 * 5. reject "createdAt" and "updatedAt" on "genre" and "starname"
 * 6. check from and limit, from and limit must no negative
 * 
 */
function __validateQueryInput(fields, values, sort, from, limit){
    const query_fields = fields.split(splitter);
    const query_values = values.split(splitter);
    if(query_fields.length !== query_values.length){
        return {success: false, reasons: [`${query_fields} length is not same as ${query_values} length`]};
    }

    for(let ele of query_fields){
        if(valid_fields.indexOf(ele) === -1){
            return {success: false, reasons: [`${ele} is an invalid field`]};
        }
    }
    
    for(let ele of query_fields){
        if(allow_one.indexOf(ele) !== -1 && query_fields.length !== 1){
            return {success: false, reasons: [`${ele} is an allow-one field, but multiple fields are given`]};
        }
    };
    
    if(sort && valid_sort.indexOf(sort) === -1){
        return {success: false, reasons: [`${ele} is an invalid sort`]};
    }
    if(query_fields[0] === "starname" || query_fields [0] === "genre"){
        if(sort === "createdAt" || sort === "updatedAt"){
            return {success: false, reasons: [`${query_fields[0]} cannot be sorted by ${sort}`]};
        }
    }
    from_n = __string2NonNegative(from);
    limit_n = __string2NonNegative(limit);
    let options = {};
    if(sort){
        options['sort'] = {};
        options['sort'][sort] = -1;
    }
    if(from_n !== -1){
        options['skip'] = from_n;
    }
    if(limit_n !== -1){
        options['limit'] = limit_n;
    }
    let result = {fields: query_fields, values: query_values, option: options}
    return {success: true, value: result};
}

/**
 * __query*** return (err, [content])
*/


/**
 *  It first finds the target genres/starnames from the GenreDB or StarDB and populates to the
 *  contents with specific match and options. It never returns err but an empty array.
 * @param dbModel The DB model e.g. genreDB
 * @param value A string that is the starname e.g. "abc-def"
 * @param match The query conditions e.g. {status:99}.
 * @param options Defines skip, limit and sort
 * 
 * This function is different from query starname because the genre name is not unqiue.
*/
function __queryContentsByGenreOrStarname(dbModel, value, options, callback){
    let query = dbModel.find({name: value}, null, options).populate({path:'contentId'});
    query.exec((err, results)=>{
        if(err){
            callback(err);
        }else{
            let contents = [];
            for(let item of results){
                contents.push(item.contentId);
            }
            callback(null, contents);
        }
    });
}

/**
 * __queryContentsByOtherFields
 * @param fields An array of fields. e.g. ["domain", "videoDomain"]....
 * 
 */

function __queryContentsByOtherFields(fields, values, options, callback){
    let matches = {};
    let i = 0;
    while(i < fields.length){
        if(fields[i] === 'id'){
            matches['_id'] = values[i];
        }else{
            matches[fields[i]] = values[i];
        }
        i++;
    }
    contentDB.find(matches, null, options, callback);
}
/**
 * The all in one function that takes care all fields.
 * Query all allowed across multiple fields. e.g. {domain:xxx, videoDomain:yyy}, 
 * @param fields A string that represents one field or mutliple fields that connected by a ~. e.g. videoDomain~domain
 * @param values The values for each corresponding fields.
 * callback({success: false| true, reasons:[string], value:[content])
 *  
*/
function queryContents(fields, values, sort, from, limit, callback){

    let convertingResult = __validateQueryInput(fields, values, sort, from, limit);
    if(!convertingResult.success){
        callback(convertingResult);
        return;
    }

    function resultHandler(err, contents){
        // contents: [content]
        if(err){
            callback({success: false, reasons: [err.message]});
        }else{
            callback({success: true, value: contents});
        }
    }
    switch(convertingResult.value.fields[0]){
        case "genre":{
            __queryContentsByGenreOrStarname(genreDB,convertingResult.value.values[0], convertingResult.value.option, resultHandler);
        };break;
        case "starname":{
            __queryContentsByGenreOrStarname(starDB, convertingResult.value.values[0], convertingResult.value.option, resultHandler);
        };break;
        default:{
            __queryContentsByOtherFields(convertingResult.value.fields, convertingResult.value.values, convertingResult.value.option, resultHandler);
        };break;
    }
}

module.exports.queryContents = queryContents;
///////////////////////////////////////////////////////////////////////////////
//////////////////////// Retriving function ends //////////////////////////////
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
////////////////////// Retriving meta function starts /////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Different from user-side that use the metaDB 'cache' collection, 
 * this meta is real time meta, each query would be expensive.
*/


const valid_meta_fields = ['genre', 'starname', 'studio', 'director','domain', 'videoDomain', 'status'];
/**
 * helper function
*/
/**
 * query the number of contents that belongs to match in the dbModel.
 * @param dbModel A dbModel object
 * @param match A query condition {name: "big-tits"}
 * @callback (err, number);
*/
function __queryFieldMetaWithValue__(dbModel, match, callback){
    dbModel.find(match, (err, contents)=>{
        if(err){
            callback(err);
        }else{
            callback(null, contents.length);
        }
    });
}
/**
 * query the numbers of contents that belongs to each value in a field of the dbModel.
 * @param dbModel A dbModel object
 * @param field A string that indicates a field e.g. "domain"
 * @param callback(err, {big-tits: 100, titty-fuck:34, ...})
*/
function __queryFieldMeta__(dbModel, field, callback){
    let query = dbModel.find({}).select(field);
    query.exec((err, contents)=>{
        if(err){
            callback(err);
        }else{
            let results = {};
            contents.forEach(item=>{
                if(results[item[field]]){
                    results[item[field]] ++;
                }else{
                    results[item[field]] = 1;
                }
            });
            callback(null, results);
        }
    });
}

/**
 * A all in one function that query meta with value
 * query the number of contents that have a field with the specific value
 * @param field A string, e.g. domain
 * @param value A string, e.g. javseen.com, 
 * @param callback (err, number)
*/
function __queryFieldMetaWithValue(field, value, callback){
    switch(field){
        case "genre":{
            __queryFieldMetaWithValue__(genreDB, {name:value}, callback);
        };break;
        case "starname":{
            __queryFieldMetaWithValue__(starDB, {name:value}, callback);
        };break;
        default:{
            let match = {};
            match[field] = value;
            __queryFieldMetaWithValue__(contentDB, match, callback);
        };break;
    }
}

/**
 * query the number of contents that belongs to a field's each value (without a special value)
 * @param field A string
 * @param callback(err, {akia: 100, xxxx:34, ...})
*/
function __queryFieldMeta(field, callback){
    switch(field){
        case "genre":{
            __queryFieldMeta__(genreDB, 'name', callback);
        };break;
        case "starname":{
            __queryFieldMeta__(starDB, 'name', callback);
        };break;
        default:{
            __queryFieldMeta__(contentDB, field, callback);
        };break;
    }
}

/**
 * queryMeta
 * @param field A string 
 * @param value A string can be undefined.
 * @param callback ({success: false|true, reason:[], value:{ xx:10, yy:12}});
 * 
*/

function queryMeta(field, value, callback){
    if(valid_meta_fields.indexOf(field) === -1){
        callback({success: false, reasons:[`Invalid field ${field}\nPlease choose from ${valid_meta_fields}`]});
        return;
    }
    if(value !== undefined){
        __queryFieldMetaWithValue(field, value, (err, number)=>{
            if(err){
                callback({success: false, reasons:[err.message]});
            }else{
                let result = {};
                result[value] = number; 
                callback({success: true, value:result});
            }
        });
    }else{
        __queryFieldMeta(field, (err, result)=>{
            if(err){
                callback({success: false, reasons:[err.message]});
            }else{
                callback({success: true, value:result});
            }
        });
    }
}

module.exports.queryMeta = queryMeta;

///////////////////////////////////////////////////////////////////////////////
////////////////////// Retriving meta function starts /////////////////////////
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Creation function starts //////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * helper functions
*/

/**
 * merge results
*/
function __mergeResults(result_array){
    let success = true;
    let reasons = [];
    let values = [];
    result_array.forEach(ele=>{
        if(ele.success){
            if(ele.value){
                values.push(ele.value);
            }
        }else{
            success = false;
            reasons = reasons.concat(ele.reasons);
        }
    });
    if(values.length > 0){
        return {success: success, reasons: reasons, value: values};
    }else{
        return {success: success, reasons: reasons};
    }
}
module.exports.mergeResults = __mergeResults;

/**
 * convert a object (from http post body) to a contentDB compatible data.
 * if _id exist, then the id will be keep. This will disable the auto generate id
 * It may useful in case such as transferring database.
*/
function __convertData2Content(content){
    // verify required field exists
    let videoContent = new VideoContent();
    videoContent.setData(content);
    try{ 
        let domain = videoContent.getDomain();
        let indexUrl = videoContent.getIndexUrl();
        let title = videoContent.getTitle();
        let releaseDate = new Date(videoContent.getReleaseDate());
        if(releaseDate.getTime()){
            releaseDate =  videoContent.getReleaseDate();
        }else{
            releaseDate =  new Date();
        }
        videoContent.setReleaseDate(releaseDate);
        if(domain && indexUrl && title){
            let content = {
                domain: domain,
                index: videoContent.getIndex(),
                indexUrl: indexUrl,
                imgPreviewUrls: videoContent.getImgPreviewUrls(),
                imgSummaryUrl: videoContent.getImgSummaryUrl(),
                title: videoContent.getTitle(),
                starnames: videoContent.getStarnames(),
                genres: videoContent.getGenres(),
                studio: videoContent.getStudio(),
                director: videoContent.getDirector(),
                videoDomain: videoContent.getVideoDomain(),
                videoUrl: videoContent.getVideoUrl(),
                videoUrls: videoContent.getVideoUrls(),
                duration: videoContent.getDuration(),
                notes: videoContent.getNotes(),
                releaseDate: releaseDate,
                view: videoContent.getView(),
                favorite: videoContent.getFavorite(),
                rating: videoContent.getRating(),
                status: videoContent.getStatus()
            };
            if(videoContent.data._id){
                // used when transfer data between mongodb
                content['_id'] = videoContent.data._id;
            }
            return content;
        }
    }catch(err){
        return err;
    }
}
function __removeDuplicate(arr){
    let result = [];
    for(let ele of arr){
        if(result.indexOf(ele) === -1){
            result.push(ele);
        }
    }
    return result;
}
/**
 * Generate an array of starDB compatible document from a content.
*/
function __convertContent2Stars(content){
    let stars = [];
    let starnames = __removeDuplicate(content.starnames);
    starnames.forEach(name=>{
        stars.push({
            name:name, 
            contentId: content._id, 
            duration: content.duration,
            rating: content.rating, 
            favorite: content.favorite,
            view: content.view,
            releaseDate: content.releaseDate
        });
    })
    return stars;
}
/**
 * Generate an array of genreDB compatible document from a content.
*/
function __convertContent2Genres(content){
    let genres = [];
    let genres_ = __removeDuplicate(content.genres);
    genres_.forEach(name=>{
        genres.push({
            name:name, 
            contentId: content._id, 
            duration: content.duration,
            rating: content.rating, 
            favorite: content.favorite,
            view: content.view,
            releaseDate: content.releaseDate
        });
    })
    return genres;
}

/**
 * core functions 
*/

/**
 * Use aync to push a set of starnames to StarDB from a content.
 * callback({success: true| false, reason:[string]})
 * @param content db query's content
 * @param callback ({success: true|false, reasons: []})
*/
function __storeStarnames(content, callback){
    let reasons = [];
    let stars = __convertContent2Stars(content);
    async.each(stars, (star, __callback__)=>{
        starDB.create(star, (err, result)=>{
            if(err){
                reasons.push(err.message);
            }
            __callback__();
        })
    },()=>{
        callback({success: reasons.length === 0, reasons: reasons});
    });
}
/**
 * Use aync to push a set of genres to StarDB from a content.
 * callback({success: true| false, reason:[string]})
 * @param content db query's content
 * @param callback ({success: true|false, reasons: []})
*/
function __storeGenres(content, callback){
    let reasons = [];
    let genres = __convertContent2Genres(content);
    async.each(genres, (genre, __callback__)=>{
        genreDB.create(genre, (err, result)=>{
            if(err){
                reasons.push(err.message);
            }
            __callback__();
        })
    },()=>{
        callback({success: reasons.length === 0, reasons: reasons});
    });
}

/**
 * A all in one function that not only store content by also store genres and starsnames
 * 
 * @param content A object that directly from REST API http post body.
 * @param callback
*/
function storeContent(data, callback){
    content = __convertData2Content(data);
    if(!content){
        callback({success: false, reasons:['failed to convert data to a contentDB compatible data']});
        return;
    }
    contentDB.create(content, (err, result)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            async.parallel([
                (__callback__)=>{
                    __storeStarnames(result, (result)=>{
                        __callback__(null, result);
                    });
                },
                (__callback__)=>{
                    __storeGenres(result, (result)=>{
                        __callback__(null, result);
                    });
                }
            ],(err, results)=>{
                callback(__mergeResults(results));
            });
        }
    });
}


module.exports.storeContent = storeContent;
///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Creation function done //////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// remove function starts ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * remove all the star documents with {contentId:contentId}
 * @param contentId A string of the contentId
 * @param callback (err, result)
*/
function __removeStarsWithContentId(contentId, callback){
    starDB.remove({contentId:contentId},callback);
}
/**
 * remove all the genre documents with {contentId:contentId}
 * @param contentId A string of the contentId
 * @param callback (err, result)
*/
function __removeGenresWithContentId(contentId, callback){
    genreDB.remove({contentId: contentId}, callback);
}

/**
 * First remove stars with the contentId, if failed no genres or content will be removed.
 * Second remove genres with the contentid, if failed no content will be removed.
 * Third remove content with the id
*/
function removeContentById(id, callback){
    // 1. remove star reference
    // 2. remove genre reference
    // 3. remove content
    __removeStarsWithContentId(id, (remove_star_err, remove_star_results)=>{
        if(remove_star_err){
            callback({success: false, reasons:[remove_star_err.message]});
        }else{
            __removeGenresWithContentId(id, (remove_genre_err, remove_genre_results)=>{
                if(remove_genre_err){
                    callback({success: false, reasons:[remove_genre_err.message]});
                }else{
                    contentDB.findByIdAndRemove(id, (err, content)=>{
                        if(err){
                            callback({success: false, reasons:[err.message]});
                        }else if(!content){
                            callback({success: false, reasons: [`${id} is not found`]});
                        }else{
                           callback({success: true, value: content});
                        }
                    });
                }
            });
        }
    });
}
module.exports.removeContentById = removeContentById;

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// remove function done //////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// update function starts ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * helper function
*/
function array_difference(a, b){
    // a - b e.g. a = [1,2,3] b = [2,3,4], a - b = [1]
    let result = [];
    a.forEach(ele=>{
        if(b.indexOf(ele) === -1){
            result.push(ele);
        }
    }) 
    return result;
}

/**
 * remove each star/genre documents with starname/genre in the array and contentId
 * @param dbModel The target db model
 * @param names An array of starname/genre
 * @param contentId A string indicates the content id
 * @param callback ({success: false| true, reasons:[string]})
*/
function __removeGenreOrStarWithContentId(dbModel, names, contentId, callback){
    let conditions = [];
    let errMessage = [];
    names.forEach(name=>{
        conditions.push({name: name, contentId: contentId});
    });
    async.each(conditions, (remove_condition, __callback__)=>{
        dbModel.remove(remove_condition, (err, result)=>{
            if(err){
                errMessage.push(err.message);
            }
            __callback__();
        }); 
    },()=>{
        callback({success: errMessage.length === 0, reasons: errMessage});
    });
}
/**
 * add each star/genre documents with starname/genre in the array and contentId
 * @param dbModel The target db model
 * @param names An array of starname/genre
 * @param content A contentDB item
 * @param callback ({success: false| true, reasons:[string]})
*/
function __addOrUpdateGenreOrStarWithContentId(dbModel, names, content, callback){
    // view, duration, rating, releaseDate, favorite, contentId
    let documents = [];
    let errMessage = [];
    names.forEach(name=>{
        documents.push({
            name: name, 
            contentId: content._id, 
            duration: content.duration, 
            rating: content.rating, 
            view: content.view, 
            releaseDate: content.releaseDate, 
            favorite: content.favorite});
    });
    async.each(documents, (document, __callback__)=>{

        dbModel.findOneAndUpdate(
            {name: document.name, contentId: document.contentId},
            document,
            {new: true},
            (err, result)=>{
                if(err){
                    errMessage.push(err.message);
                }else if(result){
                    __callback__();
                }else{
                    dbModel.create(document, (err, result)=>{
                        if(err){
                            errMessage.push(err.message);
                        }
                        __callback__();
                    });
                }
            }
        );
    },()=>{
        callback({success: errMessage.length === 0, reasons: errMessage});
    });
}

    // starname, and genre
    // 1. find the old one, record its starnames, and genres
    // 2. update the new one, record its new starnames, and new genres
    // 3. record the difference , and applied the difference
/**
 * This function update the content document and also modified the starnamedb and genredb.
 * It first find the old content. If err or not exist, return success: false.
 * Otherwise, update the contentDB. Find the difference between the old and new content's starnames and genres
 * First removed genre or starname document. *** For all remaining genre and starname, call the updateOrAdd function
 * to refresh their (starDB and genreDB) documents, beacuse the view, favorite ... may change.
 * @param {*} id 
 * @param {*} newData 
 * @param {*} callback 
 */
function updateContentById(id, newData, callback){

    let old_starnames;
    let old_genres;
    let new_starnames;
    let new_genres;
    contentDB.findById(id, (err, content)=>{
        if(err){
            callback({success: false, reason: [err.message]});
        }else if(!content){
            callback({success: false, reason: [`${id} not existed`]});
        }else{
            old_starnames = content.starnames;
            old_genres = content.genres;
            contentDB.findByIdAndUpdate(id, {$set: newData}, {new: true}, (err, content)=>{
                if(err){
                    callback({success: false, reason: [err.message]});
                }else{
                    // starname and genre
                    new_starnames = content.starnames;
                    new_genres = content.genres;
                    //let added_starnames = array_difference(new_starnames, old_starnames);
                    let removed_starnames = array_difference(old_starnames, new_starnames);
                    //let added_genres = array_difference(new_genres, old_genres);
                    let removed_genres = array_difference(old_genres, new_genres);
                    async.parallel([
                        (__callback__)=>{
                            __removeGenreOrStarWithContentId(genreDB, removed_genres, id, (result)=>{
                                __callback__(null, result);
                            });
                        },
                        (__callback__)=>{
                            __removeGenreOrStarWithContentId(starDB, removed_starnames, id, (result)=>{
                                __callback__(null, result);
                            });
                        },
                        (__callback__)=>{
                            __addOrUpdateGenreOrStarWithContentId(genreDB, new_genres, content, (result)=>{
                                __callback__(null, result);
                            });
                        },
                        (__callback__)=>{
                            __addOrUpdateGenreOrStarWithContentId(starDB, new_starnames, content, (result)=>{
                                __callback__(null, result);
                            });
                        }

                    ],(err, result_arr)=>{
                        callback(__mergeResults(result_arr));
                    });
                }
            });
        }
    });
}

module.exports.updateContentById = updateContentById;

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// update function end ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
