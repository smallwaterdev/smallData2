/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const logoutRouter = express.Router();

const logout = require('../../db_operations_user/user_db_ops').logout;


///////////////// route handler /////////////


logoutRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    logout(req, res,(result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});
module.exports = logoutRouter;