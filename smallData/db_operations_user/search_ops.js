/**
 * The manage db operations define functions for creating, retriving, updating, and removing function.
*/
const contentDB = require('../db_models/content_db');
const reverseIndexDB = require('../db_models/reverse_index_db');
const scheduler = require('../db_operations/helper_functions').scheduler;
const string2NonNegative = require('../db_operations/helper_functions').string2NonNegative;
const returned_fields = require('./content_ops').returned_fields;
const attachStarProfiles = require('./content_ops').attachStarProfiles;
const MAX_RETURN_ITEM = 40;
const DEFAULT_RETURN_ITEM = 20;

const frequencyWords = [
    'the', 'a', 'an', 'he', 'she', 'is', 'are', 'they', 'it', 'i', 'am',
    'and', 'sex', 'jav', 'who', 'with', 'that', 'you', 'for', 'can'
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
    console.log(title, from, limit);
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
            let length = resultIds.size;
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
            scheduler(ids, 10, (id, __callback)=>{
                contentDB.findById(id.id, null, (err, content)=>{
                    if(err){
                        __callback({success: false, reasons:[err.message]});
                    }else if(content){
                        let oC = content.toObject();
                        attachStarProfiles(oC, (soC)=>{
                            if(soC.success){
                                contents[id.no] = soC.value;
                            }else{
                                oC.starnames = {};
                                contents[id.no] = oC;
                            }
                            __callback({success: true, reasons:[]});
                        });
                    }else{
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

module.exports.search = search;
