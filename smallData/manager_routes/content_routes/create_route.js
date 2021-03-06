/**
 * smallData /manage/create
 */
const cors = require('../cors');
const express = require('express');
const createRouter = express.Router();
// db operation
const createContent = require('../../db_operations/content_db_ops').createContent;

///////////////// route handler /////////////
const name = 'smallData manage create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage create';


createRouter.route('/')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next) => {
    if(req.body){
        createContent(req.body, (result)=>{
            res.statusCode = result.success?200:403;
            res.json(result);
        });
    }else{
        res.statusCode = 403;
        res.json({success: false, reason:[`${JSON.stringify(req.body)} cannot be converted to Content document.`]});
    }
});


module.exports = createRouter;
