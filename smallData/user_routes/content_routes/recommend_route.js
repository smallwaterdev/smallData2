/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const recommendRouter = express.Router();

const recommendContents = require('../../db_operations_user/content_ops').recommendContents;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData user query';
const port = 'port:3000';
const errorTitle = '[Error] smallData user query';

///////////////// route handler /////////////


recommendRouter.route("/:id")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    recommendContents(req.params.id, req.body.limit, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = recommendRouter;