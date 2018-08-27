/**
 * smallData /reverseindex/create
 */
const cors = require('../cors');
const express = require('express');
const searchReverseIndexRouter = express.Router();
// db operation
const search = require('../../db_operations/reverse_index_db_ops').search;


searchReverseIndexRouter.route('/')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next) => {
    search(req.body.title, req.body.from, req.body.limit, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    }); 
});


module.exports = searchReverseIndexRouter;
