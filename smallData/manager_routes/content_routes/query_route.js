/**
 * smallData /manage/query/....
 */

const cors = require('../cors');
const express = require('express');
const queryContentRouter = express.Router();

const queryContents = require('../../db_operations/content_db_ops').queryContents;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData manage query';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage query';

///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */

queryContentRouter.route('/')
.options(cors.cors, (req, res, next)=>{
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    queryContents(req.body.value, req.body.option, (result)=>{
        if(result.success){
            if(result.value.length === 0){
                res.statusCode = 404;
            }else{
                res.statusCode = 200;
            }
        }else{
            res.statusCode = 403;
        }
        res.json(result);
    });
});


module.exports = queryContentRouter;