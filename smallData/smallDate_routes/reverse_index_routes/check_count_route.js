/**
 * smallData /reverseindex/checkcount
 */
const cors = require('../cors');
const express = require('express');
const checkCountRouter = express.Router();
// db operation
const checkCount = require('../../db_operations/reverse_index_db_ops').checkCount;


checkCountRouter.route('/:from/:limit')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next) => {
    checkCount(req.params.from, req.params.limit, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    }); 
});


module.exports = checkCountRouter;
