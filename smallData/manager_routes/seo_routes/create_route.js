/**
 * smallData /manage/query/....
 */

const cors = require('../cors');
const express = require('express');
const createSitemapRouter = express.Router();

const refreshSEOUrlCollection = require('../../manager_operations/sitemap').refreshSEOUrlCollection;
const createSitemapFromSEOUrl = require('../../manager_operations/sitemap').createSitemapFromSEOUrl;
const createRootSitemap = require('../../manager_operations/sitemap').createRootSitemap;
//////////////////////////////////////////////////////////////

///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */

createSitemapRouter.route('/db')
.options(cors.cors, (req, res, next)=>{
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    refreshSEOUrlCollection(req.body.field, req.body.condition, req.body.option, (result)=>{
        res.statusCode = result.success?200:403;    
        res.json(result);
    });
});
createSitemapRouter.route('/xml')
.options(cors.cors, (req, res, next)=>{
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    createSitemapFromSEOUrl(req.body.filename, req.body.condition, req.body.option, (result)=>{
        res.statusCode = result.success?200:403;    
        res.json(result);
    });
});

createSitemapRouter.route('/rootxml')
.options(cors.cors, (req, res, next)=>{
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    createRootSitemap(req.body.filename, req.body.directory, (result)=>{
        res.statusCode = result.success?200:403;    
        res.json(result);
    });
});
module.exports = createSitemapRouter;