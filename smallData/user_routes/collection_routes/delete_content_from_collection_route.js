/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const deleteContentFromCollectionRouter = express.Router();

const deleteContentFromCollection = require('../../db_operations_user/collection_db_ops').deleteContentFromCollection;



deleteContentFromCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    deleteContentFromCollection(req.body.collectionid, req.user._id.toString(), req.body.contentid, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = deleteContentFromCollectionRouter;