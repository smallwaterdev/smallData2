/**
 * smallData_user /quickquery/....
 */

const cors = require('../cors');
const express = require('express');
const quickQueryRouter = express.Router();

const quickQueryContents = require('../../db_operations/user_db_ops').quickQueryContents;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData manage quickquery';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage quickquery';

///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */

function queryHandler(req, res, next){
    let sort = req.params.sort;
    let from = req.params.from;
    let limit = req.params.limit;
    quickQueryContents(sort, from, limit, (result)=>{
        if(result.success){
            res.statusCode = result.value.length === 0?404:200;
        }else{
            res.statusCode = 403;
        }
        res.json(result);
    });
}

quickQueryRouter.route("")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

quickQueryRouter.route("/:sort")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

quickQueryRouter.route("/:from/:limit")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

quickQueryRouter.route("/:sort/:from/:limit")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, queryHandler);

module.exports = quickQueryRouter;