/**
 * smallData /manage/query-meta/...
 */

const cors = require('../cors');
const express = require('express');
const queryMetaRouter = express.Router();

const queryMeta = require('../../db_operations/meta_db_ops').queryMeta;


const name = 'smallData manage query-meta';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage query-meta';


queryMetaRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next)=>{
    queryMeta(req.params.field, req.params.value, (result)=>{
        if(result.success){
            if(result.value.length !== 0){
                res.statusCode = 200;
                res.json(result);
            }else{
                res.statusCode = 404;
                res.json(result);
            }
        }else{
            res.statusCode = 403;
            res.json(result);
        }
    });
});
queryMetaRouter.route('/:field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next)=>{
    queryMeta(req.params.field, req.params.value, (result)=>{
        if(result.success){
            if(result.value.length !== 0){
                res.statusCode = 200;
                res.json(result);
            }else{
                res.statusCode = 404;
                res.json(result);
            }
        }else{
            res.statusCode = 403;
            res.json(result);
        }
    });
});
module.exports = queryMetaRouter;