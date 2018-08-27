/**
 * The manage db operations define functions for creating, retriving, updating, and removing function.
*/
const contentDB = require('../db_models/content_db');
const reverseIndexDB = require('../db_models/reverse_index_db');
const scheduler = require('./helper_functions').scheduler;
const string2NonNegative = require('./helper_functions').string2NonNegative;

const MAX_RETURN_ITEM = 40;
const DEFAULT_RETURN_ITEM = 20;

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// helper functions starts /////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
const frequencyWords = [
    'the', 'a', 'an', 'he', 'she', 'is', 'are', 'they', 'it', 'i', 'am',
    'and', 'sex', 'jav', 'who', 'with', 'that', 'you', 'for', 'can'
    // wife , sex 2000+
];

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

// input is an lower case words array
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
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// helper functions starts /////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// create functions starts /////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

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
                item.save((err, res)=>{
                    if(err){
                        callback({success: false, reasons:[err.message]});
                    }else{
                        callback({success: true, reasons:[], value: res});
                    }
                });
            }else{
                // already exist.
                // it is due to re-push a word, or the word appear in a title more than once.
                callback({success: true, reasons:[]});
            }
        }else{
            // create a new
            __callback = callback;
            reverseIndexDB.create({keyword: word, contentids:[id]}, (err, res)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[], value: res});
                }
            });
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
            __pushTitle(content.title, id, (result)=>{
                if(result.success){
                    content.status = 89;
                    content.save((err, res)=>{
                        if(err){
                            callback({success: false, reasons:[err.message]});
                        }else{
                            callback({success: true, reasons:[], value: res});
                        }
                    });
                }else{
                    callback(result);
                }
            });
        }else{
            callback({success: true, reasons:[]});
        }
    });
}

function indexContents(condition, option, callback){
    contentDB.find(condition, null, option, (err, contents)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            scheduler(contents, 1, (content, __callback)=>{
                if(content.title){
                    __pushTitle(content.title, content._id, (result)=>{
                        if(result.success){
                            content.status = 89;
                            content.save((err, res)=>{
                                if(err){
                                    __callback({success: false, reasons:[err.message]});
                                }else{
                                    __callback({success: true, reasons:[], value: res});
                                }
                            });
                        }else{
                            __callback(result);
                        }
                    });
                }else{
                    __callback({success: true, reasons:[]});
                }
            }, callback);
        }
    });
}


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// create functions ends ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// delete functions starts /////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// delete functions ends ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// query (search) functions starts /////////////////////
///////////////////////////////////////////////////////////////////////////////////////

function __verifySearchCriteria(title, from ,limit){

    if(title === '' || typeof title !== 'string'){
        return null;
    }else{
        let from_n = string2NonNegative(from);
        let limit_n =  string2NonNegative(limit);
        if(from_n === -1){
            from_n = 0;
        }
        if(limit_n === -1){
            limit_n = DEFAULT_RETURN_ITEM;
        }
        return {
            title : title,
            from: from_n,
            limit: limit_n
        };
    }
}
/**
 * 
 * @param {*} order order in the title.
 * @param {*} word_counter how common is the word.
 * @param {*} title_length scale of the title.
 */
function __weight(order, word_counter, title_length){
    if(title_length - order < 3){
        // intial words usually mark the series. 
        return 3000 * order/title_length + 30000 / word_counter;
    }else{
        return 6000 * order/title_length + 30000 / word_counter;
    }
}

function search(title, from, limit, callback){
    let option = __verifySearchCriteria(title, from ,limit);
    if(option){
        let title_words = filterWords(normalizeTitle(title).split(' '));
        let len = title_words.length;
        let order = title_words.length;
        let resultIds = new Map(); // [id] = weight
        if(len === 0){
            callback({success: true, reasons:[], value:[]});
        }else{
            order = order+1;
            scheduler(title_words, 1, (title_word, __callback)=>{
                order--;
                reverseIndexDB.findOne({keyword: title_word}, (err, indexes)=>{
                if(err){
                    __callback({success: false, reasons:[err.message]});
                }else if(indexes){
                    let l_ = indexes.contentids.length;
                    for(let i = 0; i < l_; i++){
                        let value = resultIds.get(indexes.contentids[i].toString());
                        if(value === undefined){
                            resultIds.set(indexes.contentids[i].toString(), __weight(order, indexes.counter, len));
                        }else{
                            resultIds.set(indexes.contentids[i].toString(), __weight(order, indexes.counter, len) + value);
                        }
                    }
                    __callback({success: true});
                }else{
                    __callback({success: true});
                }
            });
        },
        (result)=>{
            ////// sort ids by weigth ///////
            resultIds[Symbol.iterator] = function* () {
                yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
            }
            let ids = [];
            let counter = 0;
            let position_index = 0;
            for (let [key, value] of resultIds) {     // get data sorted
                if(counter < option.from){
                    // ignore
                }else if(counter >= option.from && counter < option.from + option.limit){
                    ids.push({no: position_index, id: key});
                    position_index++;
                }else{
                    break;
                }
                counter++;
            }
            /////// obtain contents from ids /////////
            let contents = [];
            scheduler(ids, 20, (id, __callback)=>{
                contentDB.findById(id.id, null, (err, content)=>{
                    if(err){
                        __callback({success: false, reasons:[err.message]});
                    }else{
                        contents[id.no] = content;
                        __callback({success: true, reasons:[]});
                    }
                });
            },(finalR)=>{
                callback({success: finalR.success, reasons: finalR.reasons, value: contents});
            });
        });
    }
    }else{
        callback({success: false, reasons:[], value:null});
    }
}


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// query (search) starts /////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

module.exports.indexContent = indexContent;
module.exports.indexContents = indexContents;
module.exports.search = search;
