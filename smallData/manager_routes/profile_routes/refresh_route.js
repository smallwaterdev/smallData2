/**
 * smallData /profile/refresh/image
 *          /profile/refresh/intro
 */
const cors = require('../cors');
const express = require('express');
const refreshProfileRouter = express.Router();
// db operation
const refreshProfileImage = require('../../db_operations/profile_db_ops').refreshProfileImage;
const refreshProfileIntro = require('../../db_operations/profile_db_ops').refreshProfileIntro;
///////////////// route handler /////////////
const name = 'smallData profile update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData profile update';
// also create profile

refreshProfileRouter.route('/image/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    refreshProfileImage(req.params.field, req.params.value, req.body.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

refreshProfileRouter.route('/intro/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next) => {
    refreshProfileIntro(req.params.field, req.params.value, req.body.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = refreshProfileRouter;
