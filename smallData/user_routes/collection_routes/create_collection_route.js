/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const createCollectionRouter = express.Router();

const createCollection = require('../../db_operations_user/collection_db_ops').createCollection;



createCollectionRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    createCollection(req.body.title, req.body.description, req.user._id.toString(), (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    })
});
module.exports = createCollectionRouter;