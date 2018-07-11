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

function updateProfileImage(field, value, url, callback){
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
function updateProfileIntro(field, value, intro, callback){
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
function removeProfile(field, value, callback){
    if(typeof field !== 'string' || typeof value !== 'string'){
        callback({success: false, reasons:["Invalid inputs"]});
    }else{
        __callback = callback;
        profileDB.findOneAndRemove({field: field, value: value}, __generalHandler);
    }
    
}


module.exports.updateProfileImage = updateProfileImage;
module.exports.updateProfileIntro = updateProfileIntro;
module.exports.removeProfile = removeProfile;
