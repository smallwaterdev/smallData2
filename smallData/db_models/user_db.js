const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;


const user = new Schema({
    username: { 
        type:String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type:String,
        required:true,
    },
    type:{
        type: Number, 
        default: 1
    }
},{
    usePushEach:true
});

const Users = mongoose.model("user", user);
module.exports = Users;