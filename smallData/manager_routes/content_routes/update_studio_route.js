/**
 * smallData /contents/update/...
 */

const cors = require('../cors');
const express = require('express');
const updateContentStudioRouter = express.Router();

const updateContentStudio = require('../../db_operations/content_db_ops').updateContentStudio;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';


updateContentStudioRouter.route("/:studio")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    updateContentStudio(req.params.studio, req.body.studio, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result); 
    });
});
module.exports = updateContentStudioRouter;