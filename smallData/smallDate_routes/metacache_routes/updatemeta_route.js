/**
 * smallData /meta/update
 */
const cors = require('../cors');
const express = require('express');
const metaCacheUpdateRouter = express.Router();
// db operation
const updateMetaCache = require('../../db_operations/metacache_db_ops').updateMetaCache;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


metaCacheUpdateRouter.route('/:field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    updateMetaCache(req.params.field, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});




module.exports = metaCacheUpdateRouter;
