/**
 * smallData routes/content_route
 * handle the post request on :3001
 */
const cors = require('../cors');
const express = require('express');
const queryStarnameRouter = express.Router();

const queryContentsByStarname = require('../../db_operations/star_db_ops').queryContentsByStarname;


///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */


queryStarnameRouter.route("/:name")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    if(req.body.option === undefined){
        req.body.option = null;
    }
    queryContentsByStarname(req.params.name, req.body.option, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = queryStarnameRouter;