/**
 * smallData /manage/create
 */
const cors = require('../cors');
const express = require('express');
const createRouter = express.Router();
// db operation
const storeContentBuffer = require('../../db_operations/buffer_db_ops').storeContentBuffer;

///////////////// route handler /////////////
const name = 'smallData buffer create';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData buffer create';


createRouter.route('/')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next) => {
    if(req.body){
        storeContentBuffer(req.body, (result)=>{
            res.statusCode = result.success?200:403;
            res.json(result);
        });
    }else{
        res.statusCode = 403;
        res.json({success: false, reason:[`${JSON.stringify(req.body)} cannot be converted to Content document.`]});
    }
});


module.exports = createRouter;
