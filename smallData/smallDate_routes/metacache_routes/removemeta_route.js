/**
 * smallData /meta/update
 */
const cors = require('../cors');
const express = require('express');
const metaCacheRemoveRouter = express.Router();
// db operation
const removeMetaCache = require('../../db_operations/metacache_db_ops').removeMetaCache;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


metaCacheRemoveRouter.route('/:field/:name')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    removeMetaCache(req.params.field, req.params.name, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});
metaCacheRemoveRouter.route('/:field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    removeMetaCache(req.params.field, undefined, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = metaCacheRemoveRouter;
