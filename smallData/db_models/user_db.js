const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const user = new Schema({
    // username is provided by passport plugin
    /*username: { 
        type:String,
        required: true,
        unique: true,
    },*/
    // password is provided by passport plugin
    /*password:{
        type:String,
        required:true,
    },*/
    email:{
        type: String,
        required: true,
        unique: true,
    },
    type:{
        type: Number, 
        default: 1
    },
    profile:{
        type: String,
        required: false,
    },
    collections:{
        type:[mongoose.Schema.Types.ObjectId],
        default:[]
    }
},{
    usePushEach:true
});
user.plugin(passportLocalMongoose);

const Users = mongoose.model("user", user);
module.exports = Users;