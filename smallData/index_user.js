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

const user_query_route = require('./smallDate_routes/user_routes/query_route');
const user_query_meta_route = require('./smallDate_routes/user_routes/querymeta_route');
const user_quick_query_route = require('./smallDate_routes/user_routes/quickquery_route');
const user_recommended_route = require('./smallDate_routes/user_routes/recommend_route');
const user_search_route = require('./smallDate_routes/user_routes/search_route');
///////// Express configuration //////////
const logger = require('morgan');
const bodyParser = require('body-parser');

user_app.use(logger('dev'));
user_app.use(bodyParser.json());

///////// Database configurations //////////
const mongoose = require('mongoose');
const bluebird = require('bluebird');
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


user_app.use('/query', user_query_route);
user_app.use('/querymeta', user_query_meta_route);
user_app.use('/quickquery', user_quick_query_route);
user_app.use('/recommendlist', user_recommended_route)
user_app.use('/search',user_search_route );
user_app.use(function(req, res, next) {
    next(createError(404));
});
  
  // error handler
  user_app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.end(err.message);
});


user_app.listen(smallData_user_port, smallData_ip);
console.log(`SmallData user server is running at http://${smallData_ip}:${smallData_user_port}`);
