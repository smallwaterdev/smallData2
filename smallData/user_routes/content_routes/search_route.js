/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const searchRouter = express.Router();

const search = require('../../db_operations_user/search_ops').search;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData user query';
const port = 'port:3000';
const errorTitle = '[Error] smallData user query';

///////////////// route handler /////////////


searchRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    search(req.body.title, req.body.skip, req.body.limit, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = searchRouter;