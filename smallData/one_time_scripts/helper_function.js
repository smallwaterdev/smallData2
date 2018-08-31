const mongodb_url = require('../config').mongodb_url;
const mongodb_option = require('../config').mongodb_option;

///////// Database configurations //////////
const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;

function connectDB(callback){
    const connect = mongoose.connect(mongodb_url, {});
    connect.then((db)=>{
            callback({success: true, reasons:[], value:db});
        }, (err)=>{
            callback({success: true, reasons:[err.message], value:null});
    });
}
function disconnectDB(){
    mongoose.connection.close();
}
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;