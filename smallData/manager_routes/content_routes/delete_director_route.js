/**
 * smallData /contents/delete/director
 */

const cors = require('../cors');
const express = require('express');
const deleteContentDirectorRouter = express.Router();

const deleteContentDirector = require('../../db_operations/content_db_ops').deleteContentDirector;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';


deleteContentDirectorRouter.route("/:director")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next)=>{
    deleteContentDirector(req.params.director, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result); 
    });
});
module.exports = deleteContentDirectorRouter;