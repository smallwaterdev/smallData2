const cors = require('cors');

const whitelist = [
    'http://javferry.com',
    "http://localhost:4200"
];

var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    if(whitelist.indexOf(req.header('Origin')) !== -1){
        corsOptions = {origin: req.header('Origin'), credentials: true};
    }else{
        corsOptions = {origin: false};
    }
    callback(null, corsOptions);
};

//module.exports.corsWithOptions = cors(corsOptionsDelegate);
//module.exports.cors = cors();
module.exports.cors = cors(corsOptionsDelegate);