/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const unSubscribeCollectionRouter = express.Router();

const unSubscribeCollection = require('../../db_operations_user/collection_db_ops').unSubscribeCollection;



unSubscribeCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    unSubscribeCollection(req.body.collectionid, req.user._id.toString(), (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = unSubscribeCollectionRouter;