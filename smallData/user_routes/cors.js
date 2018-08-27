const express = require('express');
const cors = require('cors');
const app = express();

const whitelist = [
    'http://javferry.com'
];

var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    if(whitelist.indexOf(req.header('Origin')) !== -1){
        corsOptions = {origin: true};
    }else{
        corsOptions = {origin: false};
    }
    callback(null, corsOptions);
};

module.exports.corsWithOptions = cors(corsOptionsDelegate);
module.exports.cors = cors();