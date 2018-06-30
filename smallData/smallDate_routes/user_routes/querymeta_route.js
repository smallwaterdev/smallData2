/**
 * smallData /manage/query-meta/...
 */

const cors = require('../cors');
const express = require('express');
const querymetaRouter = express.Router();

const queryMeta = require('../../db_operations/user_db_ops').queryMeta;


const name = 'smallData manage query-meta';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage query-meta';



function handler(req, res, next){
    queryMeta(req.params.field, req.params.value, req.params.from, req.params.limit,
        (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
    
}
querymetaRouter.route("/:field/:from/:limit")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, handler);

querymetaRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, handler);

module.exports = querymetaRouter;