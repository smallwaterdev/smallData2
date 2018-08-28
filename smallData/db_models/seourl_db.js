const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;


const SEOUrl = new Schema({
    field: { // genre, content, star, studio ...
        type:String,
        required: true,
    },
    value:{ // big-tits, 24343d3e3.., aika, prestige ... 
        type:String,
        required:true,
    },
    status:{
        type: Number, 
        default: 99
    }
},{
    usePushEach:true
});
SEOUrl.index({field: 1, value: 1}, {unique: true});
SEOUrl.index({status: -1});
const SEOUrls = mongoose.model("SEOUrl", SEOUrl);
module.exports = SEOUrls;