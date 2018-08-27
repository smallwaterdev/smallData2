const mongoose = require('mongoose');
const metaDB = require('../db_models/meta_db');
const profileDB = require('../db_models/profile_db');
const scheduler = require('../db_operations/helper_functions').scheduler;
const string2NonNegative = require('../db_operations/helper_functions').string2NonNegative;
const returned_fields = '_id field name counter';

const MAX_RETURN_ITEM_NUM = 60;
const DEFAULT_RETURN_ITEM_NUM = 30;


////////////////////////////////////////////////////////////////
//////////////////// query metas starts ///...//////////////////
////////////////////////////////////////////////////////////////

/**
 * Replace starnames ["aika", "honda"] with 
 * {
 *  "aiki":"image_url",
 *  "honda":"image_url"
 * }
*/
function attachProfiles(meta, callback){
    if(meta && meta.field && meta.name){
        profileDB.findOne({field:meta.field, value: meta.name}, (err, value)=>{
            if(value){
                meta.profile_url = value.profile_url;
                meta.intro = value.intro;
            }else{
                meta.profile_url ="";
                meta.intro = "";
            }
            callback({success: true, reasons:[], value: meta});
        });
    }else{
        callback({success: false, reasons:[], value: meta});
    }
}

function verifyCondition(condition){
    if(condition && typeof condition === 'object'){
        let support_field = ['meta', 'genre', 'studio', 'starname', 'director'];
        let valid_condition = {};
        if(support_field.indexOf(condition.field) === -1){
            return null;
        }else{
            valid_condition['field'] = condition.field;
        }
        if(condition.name){
            valid_condition['name'] = condition.name;
        }
        return valid_condition;
    }else{
        return null;
    }
}

function verifyOption(option){
    if(!option){
        option = {};
    }
    let valid_option = {};
    let support_sorts = ['counter', 'name'];
    let limit = string2NonNegative(option.limit);
    if(limit === -1){
        valid_option['limit'] = DEFAULT_RETURN_ITEM_NUM;
    }else if(limit > MAX_RETURN_ITEM_NUM){
        valid_option['limit'] = MAX_RETURN_ITEM_NUM;
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
 * Having a meta, manually populate its profile
 */
function queryMetas(condition, option, callback){
    let valid_condition = verifyCondition(condition);
    if(!valid_condition){
        callback({success: false, reasons:[`Invalid condition`]});
    }else{
        metaDB.find(
            valid_condition, 
            returned_fields, 
            verifyOption(option), 
            (err, metas)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else if(metas.length > 0){
                    let task_number_arr = new Array(metas.length);
                    let finalMetas = [];
                    for(let i = 0; i < metas.length; i++){
                        task_number_arr[i] = i;
                    }
                    scheduler(task_number_arr, 5, (no, __callback)=>{
                        let meta = metas[no].toObject();
                        attachProfiles(meta, (fM)=>{
                            if(fM.success){
                                finalMetas[no] = fM.value;
                            }else{
                                meta.profile_url = '';
                                meta.intro = '';
                                finalMetas[no] = meta;
                            }
                            __callback({success: true, reasons:[]});
                        });
                    }, (result)=>{
                        callback({success: true, reasons:[], value: finalMetas});
                    });
                }else{
                    callback({success: true, reasons:[], value:[]});
                }
            }
        );
    }
}
////////////////////////////////////////////////////////////////
//////////////////// query metas ends //////////////////////////
////////////////////////////////////////////////////////////////

module.exports.queryMetas = queryMetas;