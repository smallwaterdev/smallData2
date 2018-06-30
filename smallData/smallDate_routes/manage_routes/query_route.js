/**
 * smallData /manage/query/....
 */

const cors = require('../cors');
const express = require('express');
const queryRouter = express.Router();

const queryContents = require('../../db_operations/manage_db_ops').queryContents;

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

function queryHandler(req, res, next){
    let fields = req.params.fields;
    let values = req.params.values;
    let sort = req.params.sort;
    let from = req.params.from;
    let limit = req.params.limit;
    queryContents(fields, values, sort, from, limit, (result)=>{
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
}
queryRouter.route("/:fields/:values")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

queryRouter.route("/:fields/:values/:sort")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

queryRouter.route("/:fields/:values/:from/:limit")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

queryRouter.route("/:fields/:values/:sort/:from/:limit")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);



module.exports = queryRouter;