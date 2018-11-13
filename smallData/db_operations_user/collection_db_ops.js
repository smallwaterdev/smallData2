const mongoose = require('mongoose');
const collectionDB = require('../db_models/collection_db');
const userDB = require('../db_models/user_db');
const scheduler = require('../db_operations/helper_functions').scheduler;
const string2NonNegative = require('../db_operations/helper_functions').string2NonNegative;


const MAX_SUBSCRIBER = 2000;
const MAX_COLLECTION = 200;
const MAX_CONTENTS_IN_A_COLLECTION = 2000;

/**
 * collection operation involves two collection: collection and user.
 */


////////////////////////////////////////////////////////////////
//////////////////// create collections starts /////////////////
////////////////////////////////////////////////////////////////
function createCollection(title, description, userid, callback){
    /**
     * 1. check user current collection's number
     * 2. create check duplicate name,
     * 3. success and add the collection to userDB
     */
    console.log(title, description);
    userDB.findById(userid, (err, user)=>{
        if(err){
            callback({
                success: false,
                reasons:[err.message],
                value: null
            });
        }else{
            if(user.collections.length >= MAX_COLLECTION){
                callback({
                    success: false,
                    reasons:[`You can only create at most ${MAX_COLLECTION} collections`],
                    value: null
                });
            }else{
                collectionDB.create({
                    title: title, 
                    description: description, 
                    userid: userid},
                    (err, collection)=>{
                        if(err){
                            callback({
                                success: false,
                                reasons:[err.message],
                                value: null
                            });
                        }else{
                            user.collections.push(collection._id);
                            user.save((err, user)=>{
                                if(err){
                                    callback({
                                        success: false,
                                        reasons:[err.message],
                                        value: null
                                    });
                                }else{
                                    callback({
                                        success: true,
                                        reasons:[],
                                        value: collection
                                    });
                                }
                            });
                        }
                    }
                );
            }
        }
    });
}
////////////////////////////////////////////////////////////////
//////////////////// delete collections starts /////////////////
////////////////////////////////////////////////////////////////
function deleteCollection(collectionid, userid, callback){
    // 1. find this collection
    // 2. check ownership
    // *** 3. loop subscriber and their subscription, lazy update.
    // 4. remove from the user's collection
    // 5. delete this collection
    collectionDB.findById(collectionid, (err, coll)=>{
        if(err){
            callback({
                success: false,
                reasons:[err.message],
                value: null
            });
        }else if(!coll || coll.userid.toString() !== userid){
            callback({
                success: false,
                reasons:[`You don't have this collection`],
                value: null
            });
        }else{
            userDB.findById(userid, (err, user)=>{
                if(err){
                    callback({
                        success: false,
                        reasons:[err.message],
                        value: null
                    });
                }else if(!user){
                    callback({
                        success: false,
                        reasons:[`Invalid user`],
                        value: null
                    });
                }else{
                    let index = user.collections.indexOf(collectionid);
                    if (index > -1) {
                        user.collections.splice(index, 1);
                    }
                    user.save((err, user)=>{
                        if(err){
                            callback({
                                success: false,
                                reasons:[err.message],
                                value: null
                            });
                        }else{
                            collectionDB.remove({_id: collectionid}, (err, result)=>{
                                if(err){
                                    callback({
                                        success: false,
                                        reasons:[err.message],
                                        value: null
                                    });
                                }else{
                                    callback({
                                        success: true,
                                        reasons:[],
                                        value: result
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}
////////////////////////////////////////////////////////////////
//////////////////// modify collections starts /////////////////
////////////////////////////////////////////////////////////////
/**
 * 
 * @param {*} modification {
 *  status: 1,
 *  description: text,
 *  profile: string,
 *  
 * }
 * @param {*} callback 
 */
function checkModification(){

}
function modifyCollection(collectionid, userid, modification, callback){
    collectionDB.findOneAndUpdate(
        {_id: collectionid, userid: userid}, 
        {$set: modification}, 
        {new: true},
        (err, coll)=>{
            if(err){
                callback({
                    success: false,
                    reasons:[err.message],
                    value: null
                });
            }else if(!coll){
                callback({
                    success: false,
                    reasons:[`Not exist`],
                    value: null
                });
            }else{
                callback({
                    success: true,
                    reasons:[],
                    value: coll
                });
            }
    });
}
////////////////////////////////////////////////////////////////
//////////////////// add content to collections starts /////////
////////////////////////////////////////////////////////////////
function addContentToCollection(collectionid, userid, contentid, callback){
    callback({
        success: false,
        reasons:["Not implemented"],
        value:null
    });
}
////////////////////////////////////////////////////////////////
//////////////////// delete content from collections starts ////
////////////////////////////////////////////////////////////////
function deleteContentFromCollection(collectionid, userid, contentid, callback){
    callback({
        success: false,
        reasons:["Not implemented"],
        value:null
    });
}

////////////////////////////////////////////////////////////////
//////////////////// subscribe  collections starts /////////////
////////////////////////////////////////////////////////////////
function subscribeCollection(collectionid, userid, callback){
    callback({
        success: false,
        reasons:["Not implemented"],
        value:null
    });
}
////////////////////////////////////////////////////////////////
//////////////////// unsubscribe  collections starts ///////////
////////////////////////////////////////////////////////////////
function unSubscribeCollection(collectionid, userid, callback){
    callback({
        success: false,
        reasons:["Not implemented"],
        value:null
    });
}
module.exports.createCollection = createCollection;
module.exports.deleteCollection = deleteCollection;
module.exports.modifyCollection = modifyCollection;

module.exports.addContentToCollection = addContentToCollection;
module.exports.deleteContentFromCollection = deleteContentFromCollection;
module.exports.subscribeCollection = subscribeCollection;
module.exports.unSubscribeCollection = unSubscribeCollection;