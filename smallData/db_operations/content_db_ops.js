/**
 * The manage db operations define functions for creating, retriving, updating, and removing function.
*/
const async = require('async');
const contentDB = require('../db_models/content_db');
const genreDB = require('../db_models/genre_db');
const starDB = require('../db_models/star_db');
const VideoContent = require('../../data_model/video_content');
const string2NonNegative = require('./helper_functions').string2NonNegative;
const scheduler = require('./helper_functions').scheduler;
///////////////////////////////////////////////////////////////////////////////
//////////////////////// Retriving function starts ////////////////////////////
///////////////////////////////////////////////////////////////////////////////


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
   
}
/**
 * The all in one function that takes care all fields.
 * Query all allowed across multiple fields. e.g. {domain:xxx, videoDomain:yyy}, 
 * @param value {indexUrl:...}
 * @param option e.g. {skip:10, limit:10, sorted:? }
 * callback({success: false| true, reasons:[string], value:[content])
 *  
*/
function queryContents(value, option, callback){
    if(option){
    
    }else{
        option = null;
    }
    contentDB.find(value, null, option, (err, response)=>{
        if(err){
            callback({success: false, value: null, reasons:[err.message]});
        }else{
            callback({success: true, value: response, reasons:[]});
        }
    });
}

module.exports.queryContents = queryContents;
///////////////////////////////////////////////////////////////////////////////
//////////////////////// Retriving function ends //////////////////////////////
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
function createContent(data, callback){
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


module.exports.createContent = createContent;
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
/////////////////////////// update function ends ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// normalize function starts /////////////////////////
///////////////////////////////////////////////////////////////////////////////

function __updateContentField(field, oldValue, newValue, callback){
    let condition = {};
    condition[field] = oldValue;
    contentDB.find(condition, (err, res)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            scheduler(res, 5, (content, __callback)=>{
                content[field] = newValue;
                content.save((err, response)=>{
                    if(err){
                        __callback({success: false, reasons:[err.message], value: null});
                    }else{
                        __callback({success: true, reasons:[], value: response});
                    }
                });
            }, callback);
        }
    });
}
function __deleteContentField(field, value, callback){
    let condition = {};
    condition[field] = value;
    contentDB.find(condition, (err, res)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            scheduler(res, 5, (content, __callback)=>{
                content[field] = "";
                content.save((err, response)=>{
                    if(err){
                        __callback({success: false, reasons:[err.message], value: null});
                    }else{
                        __callback({success: true, reasons:[], value: response});
                    }
                });
            }, callback);
        }
    });
}
function updateContentDirector(oldName, newName, callback){
    __updateContentField('director', oldName, newName, callback);
}
function updateContentStudio(oldName, newName, callback){
    __updateContentField('studio', oldName, newName, callback);
}
function deleteContentDirector(name, callback){
    __deleteContentField('director', name, callback);
}
function deleteContentStudio(name, callback){
    __deleteContentField('studio', name, callback);
}

module.exports.updateContentDirector = updateContentDirector;
module.exports.updateContentStudio = updateContentStudio;
module.exports.deleteContentDirector = deleteContentDirector;
module.exports.deleteContentStudio = deleteContentStudio;

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// normalize function ends ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
