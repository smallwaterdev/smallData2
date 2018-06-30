
const cors = require('../cors');
const express = require('express');
const normalizeRouter = express.Router();

const updateField = require('../storage_models/normalize_db_ops').updateField;
const updateFieldByAnother = require('../storage_models/normalize_db_ops').updateFieldByAnother;
const deleteFieldValue = require('../storage_models/normalize_db_ops').deleteFieldValue;

const checkStatus = require('../storage_models/normalize_db_ops').checkStatus;
const setStatus = require('../storage_models/normalize_db_ops').setStatus;
const normalizeMetaGenre = require('../storage_models/normalize_db_ops').normalizeMetaGenre;
const normalizeMetaField = require('../storage_models/normalize_db_ops').normalizeMetaField;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';

normalizeRouter.route('/field')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    if(req.body === undefined ||  req.body.field === undefined || req.body.oldValue === undefined || req.body.newValue === undefined){
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`${errorTitle} Invalid argument\nA correct example {"field":"starname", "oldValue":"abc", "newValue":"xyz"}`);
    }else{
        updateField(req.body.field, req.body.oldValue, req.body.newValue, req.body.limit, (err, result)=>{
            if(err){
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end(err.message);
            }else{
                res.statusCode = 200;
                res.json(result);
            }
        });
        
    }
});
normalizeRouter.route('/byanotherfield')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    if(req.body === undefined ||  req.body.field === undefined || req.body.value === undefined || req.body.target_field === undefined || req.body.target_value === undefined){
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`${errorTitle} Invalid argument\nA correct example {"field":"videoDomain", "value":"abc", "target_field":"effective", "target_value":false}`);
    }else{
        updateFieldByAnother(req.body.field, req.body.value, req.body.target_field, req.body.target_value, (err, result)=>{
            if(err){
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end(err.message);
            }else{
                res.statusCode = 200;
                res.json(result);
            }
        });
    }
});

normalizeRouter.route('/deletefield')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    if(req.body === undefined ||  req.body.field === undefined || req.body.value === undefined ){
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`${errorTitle} Invalid argument\nA correct example {"field":"genre", "value":"xxx"}`);
    }else{
        deleteFieldValue(req.body.field, req.body.value,  (err, result)=>{
            if(err){
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end(err.message);
            }else{
                res.statusCode = 200;
                res.json(result);
            }
        });
    }
});

normalizeRouter.route('/status')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.get(cors.cors, (req, res, next)=>{
   res.statusCode = 200;
   res.json(checkStatus());
});


normalizeRouter.route('/meta/:field/:value')
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    switch(req.params.field){
        case 'genre':{
            normalizeMetaGenre(req.params.value, (err, result)=>{
                res.statusCode = result.success?200:403;
                res.json(result);
            });
        };break;

        case 'director':
        case 'studio':{
            normalizeMetaField(req.params.field, (err)=>{
                if(err){
                    res.statusCode = 403;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(err.message);
                }else{
                    // start call back
                    res.statusCode = 200;
                    res.json(checkStatus());
                }
            },(err, result)=>{
                if(err){
                    setStatus({error: err.message});
                }else{
                    setStatus(result);
                }
            });
        };break;
        default: break;
    }
    
});

module.exports = normalizeRouter;