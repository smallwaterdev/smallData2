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
const queryContentRoute = require('./manager_routes/content_routes/query_route');
const deleteContentRoute = require('./manager_routes/content_routes/delete_route');
const createContentRoute = require('./manager_routes/content_routes/create_route');
const updateContentRoute = require('./manager_routes/content_routes/update_route');
const updateContentDirectorRoute = require('./manager_routes/content_routes/update_director_route');
const updateContentStudioRoute = require('./manager_routes/content_routes/update_studio_route');
const deleteContentDirectorRoute = require('./manager_routes/content_routes/delete_director_route');
const deleteContentStudioRoute = require('./manager_routes/content_routes/delete_studio_route');
// starname
const queryStarnameRoute = require('./manager_routes/starname_routes/query_route');
const deleteStarnameRoute = require('./manager_routes/starname_routes/delete_route');
const updateStarnameRoute = require('./manager_routes/starname_routes/update_route');
// genre
const queryGenreRoute = require('./manager_routes/genre_routes/query_route');
const deleteGenreRoute = require('./manager_routes/genre_routes/delete_route');
const updateGenreRoute = require('./manager_routes/genre_routes/update_route');
// meta
const queryMetaRoute = require('./manager_routes/meta_routes/query_route');
const deleteMetaRoute = require('./manager_routes/meta_routes/delete_route');
const refreshMetaRoute = require('./manager_routes/meta_routes/refresh_route');
// profile
const queryProfileRoute = require('./manager_routes/profile_routes/query_route');
const deleteProfileRoute = require('./manager_routes/profile_routes/delete_route');
const refreshProfileRoute = require('./manager_routes/profile_routes/refresh_route');
// reverse index
const createReverseIndexRoute = require('./manager_routes/reverse_index_routes/create_route');
const searchReverseIndexRouter = require('./manager_routes/reverse_index_routes/query_route');
// seo
const createSitemapRoute = require('./manager_routes/seo_routes/create_route');

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
// manage_app.use('/openload/decrypt', javseenRoute);

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
const url_prefix = "/manager/api";

// contents
manage_app.use(url_prefix + '/content/query', queryContentRoute);
manage_app.use(url_prefix + '/content/create', createContentRoute);
manage_app.use(url_prefix + '/content/update', updateContentRoute);
manage_app.use(url_prefix + '/content/delete', deleteContentRoute);
manage_app.use(url_prefix + '/contents/delete/director', deleteContentDirectorRoute);
manage_app.use(url_prefix + '/contents/delete/studio', deleteContentStudioRoute);
manage_app.use(url_prefix + '/contents/update/director', updateContentDirectorRoute);
manage_app.use(url_prefix + '/contents/update/studio', updateContentStudioRoute);
// stars
manage_app.use(url_prefix + '/starname/query', queryStarnameRoute);
manage_app.use(url_prefix + '/starname/update', updateStarnameRoute);
manage_app.use(url_prefix + '/starname/delete', deleteStarnameRoute);
// genres
manage_app.use(url_prefix + '/genre/query', queryGenreRoute);
manage_app.use(url_prefix + '/genre/update', updateGenreRoute);
manage_app.use(url_prefix + '/genre/delete', deleteGenreRoute);
// meta
manage_app.use(url_prefix + '/meta/query', queryMetaRoute);
manage_app.use(url_prefix + '/meta/refresh', refreshMetaRoute);
manage_app.use(url_prefix + '/meta/delete', deleteMetaRoute);
// profile
manage_app.use(url_prefix + '/profile/query', queryProfileRoute);
manage_app.use(url_prefix + '/profile/refresh', refreshProfileRoute);
manage_app.use(url_prefix + '/profile/delete', deleteProfileRoute);
// reverseindex
manage_app.use(url_prefix + '/reverseindex/create', createReverseIndexRoute);
manage_app.use(url_prefix + '/reverseindex/search', searchReverseIndexRouter);
// seo
manage_app.use(url_prefix + '/seo/create', createSitemapRoute);

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










