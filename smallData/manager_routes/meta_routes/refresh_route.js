/**
 * smallData /meta/update
 */
const cors = require('../cors');
const express = require('express');
const refreshMetaRouter = express.Router();
// db operation
const refreshMeta = require('../../db_operations/meta_db_ops').refreshMeta;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


refreshMetaRouter.route('/:field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    refreshMeta(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

refreshMetaRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    refreshMeta(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = refreshMetaRouter;
