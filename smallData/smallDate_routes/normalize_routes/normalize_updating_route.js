
const cors = require('../cors');
const express = require('express');
const normalizeUpdateRouter = express.Router();

const updateNewValueByOldValue = require('../../db_operations/normalize_db_ops').updateNewValueByOldValue;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';

normalizeUpdateRouter.route('/:field/:oldValue/:newValue')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    updateNewValueByOldValue(req.params.field, req.params.oldValue, req.params.newValue, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});
module.exports = normalizeUpdateRouter;