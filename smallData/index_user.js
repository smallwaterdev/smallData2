/**
 * smallData
 * Listen at 3000 to serve user's request
 * Listen at 3001 to receive data
 */

const express = require('express');
const createError = require('http-errors');
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

///////// Express configuration //////////
const logger = require('morgan');
const bodyParser = require('body-parser');

user_app.use(logger('dev'));
user_app.use(bodyParser.json());
user_app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    limit: '50mb',
    extended: true
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


user_app.use(url_prefix + '/content/query', queryContentRoute);
user_app.use(url_prefix + '/content/recommend', queryRecommendContentRoute);
user_app.use(url_prefix + '/content/search', searchContentRoute);

user_app.use(url_prefix + '/meta/query', queryMetaRoute);

user_app.use(function(req, res, next) {
    next(createError(404));
});
  
  // error handler
  user_app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.end(err.message);
});


user_app.listen(smallData_user_port, smallData_ip);
console.log(`SmallData user server is running at http://${smallData_ip}:${smallData_user_port}`);
