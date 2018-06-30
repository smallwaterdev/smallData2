
const cors = require('../cors');
const express = require('express');
const normalizeRemoveRouter = express.Router();

const removeName = require('../../db_operations/normalize_db_ops').removeName;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData normalize remove';

normalizeRemoveRouter.route('/:field/:name')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next)=>{
    removeName(req.params.field, req.params.name, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = normalizeRemoveRouter;