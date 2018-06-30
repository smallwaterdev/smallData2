const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;

// field + name is unique
// 1. genre tity-fuck 100, which means we have 100 tity fuck video
// 1. meta genre 10, which means we have 10 different genres.
// db.metas.createIndex({field: 1, name: 1}, {unique: true})
// db.metas.createIndex({field: 1, name: 1, counter, -1})
const Meta = new Schema({
    field: { // genre, meta,
        type:String,
        required: true
    },
    name:{ // titty-fuck, starname
        type:String,
        required: true
    },
    counter:{
        type:Number,
        default:0,
    },
    notes:{
        type: String, 
        default: ""
    },
    profile_url:{
        type: String,
        default:""
    },
    subscriber_count:{
        type:Number,
        default:0
    }
},{
    usePushEach:true
});

const Metas = mongoose.model("meta", Meta);
module.exports = Metas;