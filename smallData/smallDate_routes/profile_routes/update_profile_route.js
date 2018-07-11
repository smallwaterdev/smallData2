/**
 * smallData /meta/profile
 */
const cors = require('../cors');
const express = require('express');
const updateProfileRouter = express.Router();
// db operation
const updateProfileImage = require('../../db_operations/profile_db_ops').updateProfileImage;
const updateProfileIntro = require('../../db_operations/profile_db_ops').updateProfileIntro;
///////////////// route handler /////////////
const name = 'smallData profile update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData profile update';
// also create profile

updateProfileRouter.route('/image')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    updateProfileImage(req.body.field, req.body.value, req.body.url, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

updateProfileRouter.route('/intro')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    updateProfileIntro(req.body.field, req.body.value, req.body.intro, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = updateProfileRouter;
