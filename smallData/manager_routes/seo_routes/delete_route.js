/**
 * smallData /manage/query/....
 */

const cors = require('../cors');
const express = require('express');
const deleteSitemapRouter = express.Router();

const deleteSEOUrls = require('../../db_operations/seourl_db_ops').deleteSEOUrls;
//////////////////////////////////////////////////////////////

///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */

deleteSitemapRouter.route('/db')
.options(cors.cors, (req, res, next)=>{
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    deleteSEOUrls(req.body.condition, (result)=>{
        res.statusCode = result.success?200:403;    
        res.json(result);
    });
});
module.exports = deleteSitemapRouter;