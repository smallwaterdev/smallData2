/**
 * smallData routes/content_route
 * handle the post request on :3001
 */
const cors = require('../cors');
const express = require('express');
const updateGenreRouter = express.Router();

const updateGenre = require('../../db_operations/genre_db_ops').updateGenre;


///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */


updateGenreRouter.route("/:oldName")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    if(req.body.name){
        updateGenre(req.params.oldName, req.body.name ,(result)=>{
            res.statusCode = result.success?200:403;
            res.json(result);
        });
    }else{
        res.statusCode = 403;
        res.json({success: false, reasons:[`Invalid input`]});
    }
    
});

module.exports = updateGenreRouter;