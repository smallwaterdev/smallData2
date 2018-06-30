/**
 * smallData /meta/all
 * refresh the total number of contents.
 */
const cors = require('../cors');
const express = require('express');
const metaCacheAllRouter = express.Router();
// db operation
const allMetaCache = require('../../db_operations/metacache_db_ops').allMetaCache;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


metaCacheAllRouter.route('')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    allMetaCache((result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = metaCacheAllRouter;
