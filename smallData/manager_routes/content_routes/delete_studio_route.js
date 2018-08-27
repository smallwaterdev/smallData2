/**
 * smallData /contents/delete/studio
 */

const cors = require('../cors');
const express = require('express');
const deleteContentRouter = express.Router();

const deleteContentStudio = require('../../db_operations/content_db_ops').deleteContentStudio;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';


deleteContentRouter.route("/:director")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next)=>{
    deleteContentStudio(req.params.director, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result); 
    });
});
module.exports = deleteContentRouter;