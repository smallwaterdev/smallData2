/**
 * smallData /manage/query-meta/...
 */

const cors = require('../cors');
const express = require('express');
const querymetaRouter = express.Router();

const queryMeta = require('../../db_operations/manage_db_ops').queryMeta;


const name = 'smallData manage query-meta';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage query-meta';

function requestHandler(req, res){
    queryMeta(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
}
querymetaRouter.route("/:field")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, requestHandler);

querymetaRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, requestHandler);
module.exports = querymetaRouter;