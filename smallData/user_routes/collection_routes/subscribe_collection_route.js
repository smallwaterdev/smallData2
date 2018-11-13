/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const subscribeCollectionRouter = express.Router();

const subscribeCollection = require('../../db_operations_user/collection_db_ops').subscribeCollection;



subscribeCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    subscribeCollection(req.body.collectionid, req.user._id.toString(), (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = subscribeCollectionRouter;