/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const deleteCollectionRouter = express.Router();

const deleteCollection = require('../../db_operations_user/collection_db_ops').deleteCollection;



deleteCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    deleteCollection(req.body.collectionid, req.user._id.toString(), (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = deleteCollectionRouter;