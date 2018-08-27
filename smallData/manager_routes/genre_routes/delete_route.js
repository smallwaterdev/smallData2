/**
 * smallData routes/content_route
 * handle the post request on :3001
 */
const cors = require('../cors');
const express = require('express');
const deleteGenreRouter = express.Router();

const deleteGenre = require('../../db_operations/genre_db_ops').deleteGenre;


///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */


deleteGenreRouter.route("/:name")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next)=>{
    deleteGenre(req.params.name, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = deleteGenreRouter;