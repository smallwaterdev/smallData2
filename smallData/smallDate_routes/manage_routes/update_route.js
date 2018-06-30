/**
 * smallData /manage/update/...
 */

const cors = require('../cors');
const express = require('express');
const updateRouter = express.Router();

const updateContentById = require('../../db_operations/manage_db_ops').updateContentById;

const name = 'smallData manage update';
const port = 'port:3001/port:3444';
const errorTitle = '[Error] smallData manage update';

///////////////// route handler /////////////

/** update example
{
	"field":"indexUrl",
	"value":"https://javfinder.is/movie/wc/10musum-82313-01-hioi-mizushima-japanese-adult-videos.html",
	"content":{
		"effective":true,
		"like":1000
	}
}*/
updateRouter.route("/:id")
.options(cors.cors, (req, res, next) => {
    res.sendStatus(200);
})
.put(cors.cors, (req, res, next)=>{
    
    let id = req.params.id;
    let newData = req.body;
    updateContentById(id, newData, (result)=>{

        res.statusCode = result.success?200:403;
        res.json(result);
        
    });
});
module.exports = updateRouter;