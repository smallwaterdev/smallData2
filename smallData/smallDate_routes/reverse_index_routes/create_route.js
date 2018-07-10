/**
 * smallData /reverseindex/create
 */
const cors = require('../cors');
const express = require('express');
const createReverseIndexRouter = express.Router();
// db operation
const indexContent = require('../../db_operations/reverse_index_db_ops').indexContent;
const indexContentsByCreatedTime = require('../../db_operations/reverse_index_db_ops').indexContentsByCreatedTime;
const indexContents =  require('../../db_operations/reverse_index_db_ops').indexContents;
createReverseIndexRouter.route('/')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next) => {
    if(req.body && req.body.field !== undefined && req.body.value !== undefined){
        switch(req.body.field){
            case "id":{
                indexContent(req.body.value, (result)=>{
                    res.statusCode = result.success?200:403;
                    res.json(result);
                }); 
            };break;
            case "createdTime":{
                indexContentsByCreatedTime(req.body.value, (result)=>{
                    res.statusCode = result.success?200:403;
                    res.json(result);
                });
            };break;
            case "option":{
                indexContents(req.body.value, (result)=>{
                    res.statusCode = result.success?200:403;
                    res.json(result);
                });
            };break;

            default:{
                res.statusCode = 403;
                res.json({success: false, reasons: [`Invalid argument ${JSON.stringify(req.body)}`]});
            };break;
        }
    }else{
        res.statusCode = 403;
        res.json({success: false, reasons: [`Invalid argument ${JSON.stringify(req.body)}`]});
    }
});


module.exports = createReverseIndexRouter;
