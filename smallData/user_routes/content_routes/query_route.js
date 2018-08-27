/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const queryRouter = express.Router();

const queryContents = require('../../db_operations_user/content_ops').queryContents;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData user query';
const port = 'port:3000';
const errorTitle = '[Error] smallData user query';

///////////////// route handler /////////////


queryRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    queryContents(req.body.condition, req.body.option, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = queryRouter;