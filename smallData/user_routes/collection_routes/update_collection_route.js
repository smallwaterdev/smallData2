/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const updateCollectionRouter = express.Router();

const modifyCollection = require('../../db_operations_user/collection_db_ops').modifyCollection;



updateCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    modifyCollection(req.body.collectionid, req.user._id.toString(), req.body.modification, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = updateCollectionRouter;