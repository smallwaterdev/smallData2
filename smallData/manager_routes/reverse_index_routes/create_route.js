/**
 * smallData /reverseindex/create
 */
const cors = require('../cors');
const express = require('express');
const createReverseIndexRouter = express.Router();
// db operation
const indexContent = require('../../db_operations/reverse_index_db_ops').indexContent;
const indexContents =  require('../../db_operations/reverse_index_db_ops').indexContents;
createReverseIndexRouter.route('/:id')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    indexContent(req.params.id, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});
createReverseIndexRouter.route('/')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next) => {
    indexContents(req.body.condition, req.body.option, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = createReverseIndexRouter;
