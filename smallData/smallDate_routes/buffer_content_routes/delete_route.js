/**
 * smallData /buffer/remove
 */
const cors = require('../cors');
const express = require('express');
const removeRouter = express.Router();
// db operation
const removeAll = require('../../db_operations/buffer_db_ops').removeAll;

///////////////// route handler /////////////
const name = 'smallData buffer remove';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData buffer remove';


removeRouter.route('/')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    removeAll((result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = removeRouter;
