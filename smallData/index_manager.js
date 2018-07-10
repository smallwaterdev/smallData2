/**
 * smallData
 * Listen at 3000 to serve user's request
 * Listen at 3001 to receive data (manage)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const https_private_key = require('./config').smallData_secure_store_private_key_path;
const https_certificate_path = require('./config').smallData_secure_store_certificate_path;

const express = require('express');
const createError = require('http-errors');
const manage_app = express();

const manage_token = require('./config').manage_token;
const smallData_ip = require('./config').smallData_ip;
const smallData_store_port = require('./config').smallData_store_port;
const smallData_secure_store_port = require('./config').smallData_secure_store_port;

// manager
const queryRoute = require('./smallDate_routes/manage_routes/query_route');
const querymetaRoute = require('./smallDate_routes/manage_routes/querymeta_route');
const deleteRoute = require('./smallDate_routes/manage_routes/delete_route');
const createRoute = require('./smallDate_routes/manage_routes/create_route');
const updateRoute = require('./smallDate_routes/manage_routes/update_route');

// normalize 
const normalizeRemoveRouter = require('./smallDate_routes/normalize_routes/normalize_removing_route');
const normalizeUpdateRouter = require('./smallDate_routes/normalize_routes/normalize_updating_route');
// meta cache
const metaCacheUpdateRoute = require('./smallDate_routes/metacache_routes/updatemeta_route');
const metaCacheRemoveRoute = require('./smallDate_routes/metacache_routes/removemeta_route');
const metaCacheALLRoute = require('./smallDate_routes/metacache_routes/allmeta_route');
const setProfileRoute = require('./smallDate_routes/metacache_routes/setprofile_route');
// reverse index route
const reverseIndexCreateRoute = require('./smallDate_routes/reverse_index_routes/create_route');
const reverseIndexRemoveRoute = require('./smallDate_routes/reverse_index_routes/delete_route');

// for chrome extension
const javseenRoute = require('./smallDate_routes/javseen_decrypt');


const mongodb_url = require('./config').mongodb_url;
const mongodb_option = require('./config').mongodb_option;
///////// Express configuration //////////
const logger = require('morgan');
const bodyParser = require('body-parser');

manage_app.use(logger('dev'));
manage_app.use(bodyParser.json());
manage_app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    limit: '50mb',
    extended: true
})); 
///////// Database configurations //////////
const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;

const connect = mongoose.connect(mongodb_url, {});
connect.then((db)=>{
        console.log("[mongodb] connected correctly to server");
    }, (err)=>{
        console.log("[mongodb] connection failed")
        console.log(err);
});


/////// storage services //////////
// redirect http to https
/*manage_app.all('*', (req, res, next)=>{
    if(req.secure){
      next();
    }else{
      res.redirect(307, 'https://' + req.hostname + ":" + smallData_secure_store_port + req.url);
    }
});*/

// no auth is needed 
manage_app.use('/openload/decrypt', javseenRoute);

// sample authenticate
function manage_authentication(req, res, next){
    // To support GET method, the token should be included in the header not body
    if(req.get("token") && req.get("token") === manage_token){
        next();
    }else{
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Invalid token');
    }
}
// assign root
manage_app.get('*', manage_authentication);
manage_app.post('*', manage_authentication);
manage_app.put('*', manage_authentication);
manage_app.delete('*', manage_authentication);
// manage.all('*', cors());
manage_app.use('/manage/query', queryRoute);
manage_app.use('/manage/query-meta', querymetaRoute);
manage_app.use('/manage/create', createRoute);
manage_app.use('/manage/update', updateRoute);
manage_app.use('/manage/remove', deleteRoute);

manage_app.use('/metacache/update', metaCacheUpdateRoute);
manage_app.use('/metacache/all', metaCacheALLRoute);
manage_app.use('/metacache/remove', metaCacheRemoveRoute);
manage_app.use('/metacache/setprofile', setProfileRoute);

manage_app.use('/normalize/remove', normalizeRemoveRouter);
manage_app.use('/normalize/update', normalizeUpdateRouter);

manage_app.use('/reverseindex/create', reverseIndexCreateRoute);
manage_app.use('/reverseindex/remove', reverseIndexRemoveRoute);
//manage_app.use('/normalize', normalizeRoute);
//////////// error ////////////////
// catch 404 and forward to error handler
manage_app.use(function(req, res, next) {
    next(createError(404));
});
  
// error handler
manage_app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.end(err.message);
});

///////////// create server with http and https //////////////
const options = {
    key: fs.readFileSync(__dirname + https_private_key),
    cert: fs.readFileSync(__dirname + https_certificate_path)
};

const server = http.createServer(manage_app);
const secureServer = https.createServer(options, manage_app);

server.listen(smallData_store_port, smallData_ip, ()=>{
    console.log(`Storage server is running at http://${smallData_ip}:${smallData_store_port}`);
});
secureServer.listen(smallData_secure_store_port, smallData_ip, ()=>{
    console.log(`Secure storage server is running at https://${smallData_ip}:${smallData_secure_store_port}`);
});










