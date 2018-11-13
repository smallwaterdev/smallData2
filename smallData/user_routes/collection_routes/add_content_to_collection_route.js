/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const addContentToCollectionRouter = express.Router();

const addContentToCollection = require('../../db_operations_user/collection_db_ops').addContentToCollection;



addContentToCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    addContentToCollection(req.body.collectionid, req.user._id.toString(), req.body.contentid, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = addContentToCollectionRouter;