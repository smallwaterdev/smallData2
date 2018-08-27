/**
 * This should host by others.
 */

const cors = require('./cors');
const express = require('express');
const javseenDecryptRoute = express.Router();
//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData javseen';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData javseen decrypt';

///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */

javseenDecryptRoute.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
})
.post(cors.cors, (req,res, next)=>{
    if(req.body && req.body.dataKey && req.body.decryptScript){
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        let html = `
            <!DOCTYPE html>
            <html lang="en-US">
            <head>
            <meta charset="UTF-8">
            <script src="https://openload.co/assets/js/jquery.min.js"></script>
            </head>
            <body>
            <div id="status" style="display:none;">
                <div id="nowrunning"></div>
            </div>

            <div class="" style="display:none;">
            <p style="" id="dataKey">${req.body.dataKey}</p>
            <p style="" class="" id="DtsBlkVFQx"></p>
            </div></body>
            <script type="text/javascript">${unescape(req.body.decryptScript)}</script>
            <script>
                window.ffff = 'dataKey';
                $(document).ready(function(){
                    const srclink = 'http://openload.co/stream/' + $('#DtsBlkVFQx').text() + '?mime=true';
                    $('#nowrunning').text(srclink);
                    
                });
                
            </script>
        
        </html>
        `;
        res.end(html);
        //res.end(`${req.body.dataKey} ${req.body.decryptScript}`);
    }else{
        next(new Error(`${errorTitle} Invalid argument`));
    }
});



module.exports = javseenDecryptRoute;