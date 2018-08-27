/**
 * smallData /contents/update/...
 */

const cors = require('../cors');
const express = require('express');
const updateContentDirectorRouter = express.Router();

const updateContentDirector = require('../../db_operations/content_db_ops').updateContentDirector;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';


updateContentDirectorRouter.route("/:director")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    updateContentDirector(req.params.director, req.body.director, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result); 
    });
});
module.exports = updateContentDirectorRouter;