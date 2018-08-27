/**
 * smallData /meta/profile
 */
const cors = require('../cors');
const express = require('express');
const deleteProfileRouter = express.Router();
// db operation
const deleteProfile = require('../../db_operations/profile_db_ops').deleteProfile;

///////////////// route handler /////////////
const name = 'smallData profile remove';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData profile remove';
// also create profile

deleteProfileRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    deleteProfile(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

deleteProfileRouter.route('/:field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.delete(cors.cors, (req, res, next) => {
    deleteProfile(req.params.field, undefined, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});


module.exports = deleteProfileRouter;
