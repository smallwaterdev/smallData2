/**
 * smallData /meta/update
 */
const cors = require('../cors');
const express = require('express');
const deleteMetaRouter = express.Router();
// db operation
const deleteMeta = require('../../db_operations/meta_db_ops').deleteMeta;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


deleteMetaRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    deleteMeta(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

deleteMetaRouter.route('/:field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    deleteMeta(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = deleteMetaRouter;
