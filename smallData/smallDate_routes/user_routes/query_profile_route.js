/**
 * smallData /user/query-profile/...
 */

const cors = require('../cors');
const express = require('express');
const queryProfileRouter = express.Router();

const queryProfile = require('../../db_operations/user_db_ops').queryProfile;


const name = 'smallData user query-profile';
const port = 'port:3000';
const errorTitle = '[Error] smallData user query-profile';

queryProfileRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next)=>{
    queryProfile(req.params.field, req.params.value, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});

module.exports = queryProfileRouter;