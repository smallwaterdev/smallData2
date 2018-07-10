/**
 * The manage db operations define functions for creating, retriving, updating, and removing function.
*/
const async = require('async');
const contentDB = require('../db_models/content_db');
const reverseIndexDB = require('../db_models/reverse_index_db');
const scheduler = require('./metacache_db_ops').scheduler;
const string2NonNegative = require('./manage_db_ops').string2NonNegative;
const returned_fields = require('./user_db_ops').returned_fields;
const frequencyWords = [
    'the', 'a', 'an', 'he', 'she', 'is', 'are', 'they', 'it', 'i', 'am',
    'and', 'sex', 'jav', 'who', 'with', 
    // wife , sex 2000+
];
/**
 * helper
*/
function normalizeTitle(title){
    // remove (), [], 
    const ignore = ['(', ')', '[', ']', '*', '@', '!'];
    // replace - with space.
    const replaceWithSpace = ['-'];
    let result = "";
    for(let l of title){
        if(ignore.indexOf(l) !== -1){

        }else if(replaceWithSpace.indexOf(l) !== -1){
            result += ' ';
        }else{
            result += l;
        }
    }
    // remove the chars between ' and space
    let s_p = 0;
    do{
        s_p = result.indexOf("'");
        if(s_p !== -1){
            let e_p = result.indexOf(" ", s_p);
            if(e_p !== -1){
                result = result.substring(0, s_p) + result.substring(e_p, result.length);
            }else{
                result = result.substring(0, s_p);
            }
        }
    }while(s_p !== -1);
    return result.toLocaleLowerCase();
}
// input is an lower case words
function filterWords(word_arr){
    let results  =[];
    let num = word_arr.length;
    for(let i = 0; i < num; i++){
        if(word_arr[i].length <= 2){
            // ignore
        }else if(frequencyWords.indexOf(word_arr[i]) !== -1){
            // ignore
        }else{
            results.push(word_arr[i]);
        }
    }
    return results;
}

module.exports.normalizeTitle = normalizeTitle;
module.exports.filterWords = filterWords;

let __callback;
function __generalHandler(err, result){
    if(err){
        __callback({success: false, reasons:[err.message]});
    }else{
        __callback({success: true, reasons:[], value: result});
    }
}
/**
 * 1. word can be any language, but not "" or " ".
 * 2. id must be a valid content id.
*/
function __pushIntoIndexDB(word, id, callback){
    reverseIndexDB.findOne({keyword:word}, (err, item)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(item){
            // update a item
            if(item.contentids.indexOf(id) === -1){
                item.contentids.push(id);
                item.counter = item.counter + 1;
                __callback = callback;
                item.save(__generalHandler);
            }else{
                // already exist.
                // it is due to re-push a word, or the word appear in a title more than once.
                callback({success: true, reasons:[]});
            }
        }else{
            // create a new
            __callback = callback;
            reverseIndexDB.create({keyword: word, contentids:[id]}, __generalHandler);
        }
    });
}
function __pushTitle(title, id, callback){
    let title_words = filterWords(normalizeTitle(title).split(' '));
    let num = title_words.length;
    scheduler(title_words, 1, (title_word, __callback__)=>{
        __pushIntoIndexDB(title_word, id, __callback__);
    }, callback);
}

/**
 * if id's content return true.
 * @param callback ({success: boolean, reasons:[string], value: })
*/
function indexContent(id, callback){
    contentDB.findById(id, (err, content)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else if(content && content.title){
            __pushTitle(content.title, id, callback);
        }else{
            callback({success: true, reasons:[]});
        }
    });
}

function indexContentsByCreatedTime(after, callback){
    contentDB.find({createdAt: {$gte: new Date(after)}}, (err, contents)=>{
        
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            scheduler(contents, 1, (content, __callback__)=>{
                __pushTitle(content.title, content._id, __callback__);
            },callback);
        }
    });
}

function indexContents(options, callback){
    contentDB.find({},null, options, (err, contents)=>{
       
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            scheduler(contents, 1, (content, __callback__)=>{
                __pushTitle(content.title, content._id, __callback__);
            },callback);
        }
    });
}

module.exports.indexContent = indexContent;
module.exports.indexContentsByCreatedTime = indexContentsByCreatedTime;
module.exports.indexContents = indexContents;

function deleteByWord(word, callback){
    __callback = callback;
    reverseIndexDB.findOneAndRemove({keyword: word}, __generalHandler);
}

module.exports.deleteByWord = deleteByWord;



/**
 * 
 * @param {*} title a non empty string.
 * @param {*} callback ({success: boolean, reasons:[string], value:[contentids]})
 * an ordered search engine
 * 1. try the first word, and get [ids]
 * 2. try the second word, and get [ids] and filter the ids only in the first one.
 */

const MAX_RETURN_ITEM = 40;
const DEFAULT_RETURN_ITEM = 20;
function __weight(order, word_counter, title_length){
    if(title_length - order < 3){
        // intial words usually mark the series. 
        return 3000 * order/title_length + 30000 / word_counter;
    }else{
        return 6000 * order/title_length + 30000 / word_counter;
    }
}
function __search(title, callback){
    
    let title_words = filterWords(normalizeTitle(title).split(' '));
    let len = title_words.length;
    let order = title_words.length;
    let result_ids = new Map(); // [id] = weight
    if(len === 0){
        callback({success: true, reasons:[], value:[]});
    }else{
        order = order+1;
        scheduler(title_words, 1, (title_word, __callback__)=>{
            order--;
            reverseIndexDB.findOne({keyword: title_word}, (err, indexes)=>{
                if(err){
                    __callback__(err);
                }else{
                    if(indexes){
                        let l_ = indexes.contentids.length;
                        for(let i = 0; i < l_; i++){
                            let value = result_ids.get(indexes.contentids[i].toString());
                            if(value === undefined){
                                result_ids.set(indexes.contentids[i].toString(), __weight(order, indexes.counter, len));
                            }else{
                                result_ids.set(indexes.contentids[i].toString(), __weight(order, indexes.counter, len) + value);
                            }
                        }
                    }
                    __callback__();
                }
            });
        },
        (result)=>{
            callback({success: result.success, value: result_ids, reasons:result.reasons});
        });
    }
}
/**
 * 
 * @param {*} ids [{id: , no: }]
 * @param {*} callback 
 */
function __ids2Contents(ids, callback){
    
    let results = [];
    scheduler(ids, 20, (id, __callback)=>{
        contentDB.findById(id.id, returned_fields, (err, content)=>{
            if(err){
                __callback(err);
            }else{
                results[id.no] = content;
                __callback();
            }
        });
    },(result)=>{
        callback({success: result.success, reasons: result.reasons, value: results});
    });
}
function __verifySearchCriteria(title, from ,limit){

    if(title === ''){
        return null;
    }else{
        let from_n = string2NonNegative(from);
        
        let limit_n =  string2NonNegative(limit);
        if(from_n === -1){
            from_n = 0;
        }
        if(limit_n === -1){
            limit_n = DEFAULT_RETURN_ITEM;
        }else if(limit_n > MAX_RETURN_ITEM){
            limit_n = MAX_RETURN_ITEM;
        }
        return {
            title : title,
            from: from_n,
            limit: limit_n
        };
    }
}
function search(title, from, limit, callback){
    let args = __verifySearchCriteria(title, from ,limit);
    if(args){
        
        __search(args.title, result=>{
            if(result.success){
                result.value[Symbol.iterator] = function* () {
                    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
                }
                let ids = [];
                let counter = 0;
                let __temp = 0;
                for (let [key, value] of result.value) {     // get data sorted
                    if(counter < args.from){
                        // ignore
                    }else if(counter >= args.from && counter < args.from + args.limit){
                        ids.push({id: key, no:__temp });
                        __temp++;
                    }else{
                        break;
                    }
                    counter++;
                }
                //callback({success: false, reasons:[]});
                __ids2Contents(ids, callback);
            }else{
                callback(result);
            }
        });
    }else{
        callback({success: false, reasons: [`Invalid arguments ${title}, ${from}, ${limit}`]})
    }
}
module.exports.search = search;