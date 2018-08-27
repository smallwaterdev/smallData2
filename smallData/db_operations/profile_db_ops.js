const async = require('async');
const profileDB = require('../db_models/profile_db');

// input can be non
let __callback;
function __generalHandler(err, result){
    if(err){
        __callback({success: false, reasons:[err.message]});
    }else{
        __callback({success: true, reasons:[], value: result});
    }
}

function refreshProfileImage(field, value, url, callback){
    if(typeof field !== 'string' || typeof value !== 'string' || typeof url !== 'string'){
        callback({success: false, reasons:["Invalid inputs"]});
    }else{
        //1 .find old one
        profileDB.findOne({field: field, value: value}, (err, result)=>{
            __callback = callback;
            if(err){
                __generalHandler(err, null);
            }else if(result){
                result.profile_url = url;
                result.save(__generalHandler);
            }else{
                profileDB.create({field: field, value: value, profile_url: url}, __generalHandler);
            }
        });
    }
}
function refreshProfileIntro(field, value, intro, callback){
    if(typeof field !== 'string' || typeof value !== 'string' || typeof intro !== 'string'){
        callback({success: false, reasons:["Invalid inputs"]});
    }else{
        //1 .find old one
        profileDB.findOne({field: field, value: value}, (err, result)=>{
            __callback = callback;
            if(err){
                __generalHandler(err, null);
            }else if(result){
                result.intro = intro;
                result.save(__generalHandler);
            }else{
                profileDB.create({field: field, value: value, intro: intro}, __generalHandler);
            }
        });
    }
}
function deleteProfile(field, value, callback){
    if(typeof field !== 'string'){
        callback({success: false, reasons:["Invalid inputs"]});
    }else if(value){
        profileDB.findOneAndRemove({field: field, value: value}, (err, response)=>{
            if(err){
                callback({success: false, reasons:[err.message], value: null});
            }else{
                callback({success: true, reasons:[], value: response});
            }
        });
    }else{
        profileDB.remove({field: field}, (err, response)=>{
            if(err){
                callback({success: false, reasons:[err.message], value: null});
            }else{
                callback({success: true, reasons:[], value: response});
            }
        });
    }
    
}
function queryProfile(field, value, callback){
    profileDB.findOne({field: field, value: value}, (err, response)=>{
        if(err){
            callback({success: false, reasons:[err.message], value: null});
        }else{
            callback({success: true, reasons:[], value: response});
        }
    });
}

module.exports.refreshProfileImage = refreshProfileImage;
module.exports.refreshProfileIntro = refreshProfileIntro;
module.exports.deleteProfile = deleteProfile;
module.exports.queryProfile = queryProfile;