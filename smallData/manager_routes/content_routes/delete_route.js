/**
 * smallData routes/content_route
 * handle the post request on :3001
 */
const cors = require('../cors');
const express = require('express');
const removeRouter = express.Router();
// video content

const removeContentById = require('../../db_operations/content_db_ops').removeContentById;
//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData manage delete';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage delete';


///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */


removeRouter.route("/:id")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next)=>{
    removeContentById(req.params.id, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = removeRouter;