/**
 * smallData_user /recommend/....
 */

const cors = require('../cors');
const express = require('express');
const recommendRouter = express.Router();

const recommendContents = require('../../db_operations/user_db_ops').recommendContents;

//////////////////////////////////////////////////////////////
/**
 * public module data
 */

const name = 'smallData manage quickquery';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage quickquery';

///////////////// route handler /////////////
/**
 * Get, Create, Update, Delete
 * Interfaces for smallPump and an admin management page.
 */

function recommendHandler(req, res, next){
    let field = req.params.field;
    let value = req.params.value;
    let limit = req.params.limit;
    recommendContents(field, value, limit, (results)=>{
        if(results.success){
            if(results.value && results.value.length === 0){
                res.statusCode = 404;
            }else{
                res.statusCode = 200;
            }
        }else{
            res.statusCode = 403;
        }
        res.json(results);
    });
}

recommendRouter.route("/:field/:value")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, recommendHandler);

recommendRouter.route("/:field/:value/:limit")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, recommendHandler);



module.exports = recommendRouter;