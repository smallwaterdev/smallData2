/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const signupRouter = express.Router();

const signup = require('../../db_operations_user/user_db_ops').signup;


///////////////// route handler /////////////


signupRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    signup(req, res, (result)=>{
        res.statusCode = result.success?200:403;
        res.json(result);
    });
});
module.exports = signupRouter;