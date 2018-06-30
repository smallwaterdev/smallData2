/**
 * smallData /meta/profile
 */
const cors = require('../cors');
const express = require('express');
const setProfileRouter = express.Router();
// db operation
const setProfileUrl = require('../../db_operations/metacache_db_ops').setProfileUrl;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


setProfileRouter.route('/:field/:name')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    if(typeof req.body.profile_url !== 'string'){
        res.statusCode = 403;
        res.json({success: false, reasons:[`Not profile url is found`]});
        return;
    }
    setProfileUrl(req.params.field, req.params.name, req.body.profile_url, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});




module.exports = setProfileRouter;
