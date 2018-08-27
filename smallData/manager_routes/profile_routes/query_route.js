/**
 * smallData /profile/query/...
 */

const cors = require('../cors');
const express = require('express');
const queryProfileRouter = express.Router();

const queryProfile = require('../../db_operations/profile_db_ops').queryProfile;


const name = 'smallData manage query-meta';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage query-meta';


queryProfileRouter.route('/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next)=>{
    queryProfile(req.params.field, req.params.value, (result)=>{
        if(result.success){
            if(result.value){
                res.statusCode = 200;
                res.json(result);
            }else{
                res.statusCode = 404;
                res.json(result);
            }
        }else{
            res.statusCode = 403;
            res.json(result);
        }
    });
});

module.exports = queryProfileRouter;