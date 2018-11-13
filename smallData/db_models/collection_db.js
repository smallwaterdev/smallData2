const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;

/**
 * db.contents.createIndex({view:-1})
 * db.contents.createIndex({duration:-1})
 * db.contents.createIndex({rating:-1})
 * db.contents.createIndex({favorite:-1})
 * db.contents.createIndex({releaseDate:-1})
 */
const collection = new Schema({
    title: { // "e.g. best-big-tits"
        type:String,
        required: true
    },
    description:{
        type: String, 
        default: ""
    },
    userid:{ //owner
        type:mongoose.Schema.Types.ObjectId,
        required: true,
    },
    contents:{ // content_id
        type:[mongoose.Schema.Types.ObjectId],
        default:[]
    },
    status:{ //1, private, 2, public, 3
        type: Number, 
        required: true,
        default: 1,
    },
    profile:{ // profile.
        type: String, 
    },
    
    tags:{ //keywords
        type: [String],
        default: []
    },
    subscribers:{ //how many people is following
        type:[mongoose.Schema.Types.ObjectId],
        default:[]
    }
},{
    timestamps: true,
    // timestamps will insert two field, updatedAt and createdAt:
    // the values are ISODate object
    usePushEach:true
});

collection.index({title: 1, userid: 1}, {unique: true});


const Collections = mongoose.model("collection", collection); // Dish => Dishes automatically.
module.exports = Collections;