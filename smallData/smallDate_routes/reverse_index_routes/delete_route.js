/**
 * smallData /reverseindex/create
 */
const cors = require('../cors');
const express = require('express');
const deleteReverseIndexRouter = express.Router();
// db operation
const deleteByWord = require('../../db_operations/reverse_index_db_ops').deleteByWord;


deleteReverseIndexRouter.route('/word/:word')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    deleteByWord(req.params.word, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    }); 
});


module.exports = deleteReverseIndexRouter;
