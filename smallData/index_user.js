/**
 * smallData
 * Listen at 3000 to serve user's request
 * Listen at 3001 to receive data
 */

const express = require('express');

const user_app = express();

const smallData_ip = require('./config').smallData_ip;
const smallData_user_port = require('./config').smallData_user_port;
const mongodb_url = require('./config').mongodb_url;


// content
const queryContentRoute = require('./user_routes/content_routes/query_route');
const queryRecommendContentRoute = require('./user_routes/content_routes/recommend_route');
const searchContentRoute = require('./user_routes/content_routes/search_route');
// meta
const queryMetaRoute = require('./user_routes/meta_routes/query_route');
// user
const signupRoute = require('./user_routes/user_routes/signup_route');
const loginRoute = require('./user_routes/user_routes/login_route');
const logoutRoute = require('./user_routes/user_routes/logout_route');
// cors
const cors = require('./user_routes/cors');
///////// Express middleware //////////
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookie_key = require('./config').cookie_key;
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const session_key = require('./config').session_key;
const session_id = require('./config').session_id;

user_app.use(logger('dev'));
user_app.use(bodyParser.json());
user_app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    limit: '50mb',
    extended: true
}));
// user_app.use(cookieParser(cookie_key));
user_app.use(session({
    name: session_id,
    secret: session_key,
    saveUninitialized: false,
    resave: false,
    store: new FileStore(),
}));

///////// Database configurations //////////
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const url_prefix = "/user/api";

mongoose.Promise = bluebird;
//mongoose.set('debug', true);
const connect = mongoose.connect(mongodb_url, {
});
connect.then((db)=>{
        console.log("[mongodb] connected correctly to server");
    }, (err)=>{
        console.log("[mongodb] connection failed")
        console.log(err);
});

/////////// Authentication //////////////////
function cookie_authentication(req, res, next){
    //console.log(req.signedCookies);
    if(typeof req.signedCookies.user === "boolean" && !req.signedCookies.user){
        res.statusCode = 403;
        res.end("Not auth");
        return;
    }else if(typeof req.signedCookies.user === "string" && req.signedCookies.user !== "admin"){
        res.statusCode = 403;
        res.end("Not auth");
        return;
    }else if(req.signedCookies.user === undefined){
        res.cookie("user", "admin", {signed: true});
    }
    next();
}
function session_authentication(req, res, next){
    // console.log(req.session); 
    // this session is loaded from the file system with a key "file name" as the cookie
    // but using cookie is hidden from the developer.
    if(req.session.username === undefined){
        res.statusCode = 403;
        res.json({
            success: false,
            reasons:["Please login or signup first"],
            value: null
        });
    }else{
        next();
    }
}

////////////// Setup route /////////////////////////
user_app.use(url_prefix + '/user/signup', signupRoute);
user_app.use(url_prefix + '/user/login', loginRoute);
user_app.use(cors.cors, session_authentication);
user_app.use(url_prefix + '/user/logout', logoutRoute);
user_app.use(url_prefix + '/content/query', queryContentRoute);
user_app.use(url_prefix + '/content/recommend', queryRecommendContentRoute);
user_app.use(url_prefix + '/content/search', searchContentRoute);
user_app.use(url_prefix + '/meta/query', queryMetaRoute);



user_app.use(function(req, res, next) {
    res.statusCode = 400;
    res.json({
        success: false,
        reasons: [`Invalid request on ${req.url}`],
        value: null
    });
});



user_app.listen(smallData_user_port, smallData_ip);
console.log(`SmallData user server is running at http://${smallData_ip}:${smallData_user_port}`);
