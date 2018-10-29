/**
 * smallData_user /query/....
 */

const cors = require('../cors');
const express = require('express');
const loginRouter = express.Router();

const login = require('../../db_operations_user/user_db_ops').login;
const queryUser = require('../../db_operations_user/user_db_ops').queryUser;

///////////////// route handler /////////////


loginRouter.route("/")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    login(req, req.body.id, req.body.password, (result)=>{
        res.statusCode = 200;
        res.json(result);
    });
});

loginRouter.route("/query")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.post(cors.cors, (req, res, next)=>{
    if(req.session && req.session.username){
        queryUser(req.session.username, (data)=>{
            res.statusCode = 200;
            res.json(data);
        });
    }else{
        res.statusCode = 200;
        res.json({
            success: true,
            value: null,
            reasons:[]
        });
    }
});
module.exports = loginRouter;