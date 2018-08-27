/**
 * smallData routes/content_route
 * handle the post request on :3001
 */
const cors = require('../cors');
const express = require('express');
const deleteStarnameRouter = express.Router();

const deleteStarname = require('../../db_operations/star_db_ops').deleteStarname;


///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */


deleteStarnameRouter.route("/:name")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next)=>{
    deleteStarname(req.params.name, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = deleteStarnameRouter;