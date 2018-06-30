/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const queryRouter = express.Router();

const queryContents = require('../../db_operations/user_db_ops').queryContents;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData user query';
const port = 'port:3000';
const errorTitle = '[Error] smallData user query';

///////////////// route handler /////////////

function queryHandler(req, res, next){
    let fields = req.params.fields;
    let values = req.params.values;
    let sort = req.params.sort;
    let from = req.params.from;
    let limit = req.params.limit;
    queryContents(fields, values, sort, from, limit, (result)=>{
        if(result.success){
            res.statusCode = result.value.length === 0?404:200;
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