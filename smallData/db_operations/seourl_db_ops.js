
const SEOUrlDB = require('../db_models/seourl_db');

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// refresh SEOUrl starts /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function refreshSEOUrl(field, value, status, callback){
    if(typeof field !== 'string' || typeof value !== 'string' || typeof status !== 'number'){
        callback({success: false, reasons:["Invalid inputs"]});
    }else{
        //1 .find old one
        SEOUrlDB.findOne({field: field, value: value}, (err, result)=>{
            if(err){
                callback({success: false, reasons:[err.message]});
            }else if(result){
                result.status = status;
                result.save((err, res)=>{
                    if(err){
                        callback({success: false, reasons:[err.message]});
                    }else{
                        callback({success: true, reasons:[], value: res});
                    }
                })
            }else{
                SEOUrlDB.create({field: field, value: value, status: status}, (err, res)=>{
                    if(err){
                        callback({success: false, reasons:[err.message]});
                    }else{
                        callback({success: true, reasons:[], value: res});
                    }
                });
            }
        });
    }
}
////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// refresh SEOUrl ends ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// query SEOUrl starts ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function querySEOUrl(field, value, callback){
    SEOUrlDB.findOne({field: field, value: value}, (err, response)=>{
        if(err){
            callback({success: false, reasons:[err.message], value: null});
        }else{
            callback({success: true, reasons:[], value: response});
        }
    });
}
function querySEOUrls(condition, option, callback){
    SEOUrlDB.find(condition, null, option, (err, response)=>{
        if(err){
            callback({success: false, reasons:[err.message], value: null});
        }else{
            callback({success: true, reasons:[], value: response});
        }
    });
}
////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// query SEOUrl ends /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// delete SEOUrl starts /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function deleteSEOUrls(condition, callback){
    SEOUrlDB.remove(condition, (err, response)=>{
        if(err){
            callback({success: false, reasons:[err.message], value: null});
        }else{
            callback({success: true, reasons:[], value: response});
        }
    });
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// delete SEOUrl ends /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

module.exports.refreshSEOUrl = refreshSEOUrl;
module.exports.querySEOUrl = querySEOUrl;
module.exports.querySEOUrls = querySEOUrls;
module.exports.deleteSEOUrls = deleteSEOUrls;