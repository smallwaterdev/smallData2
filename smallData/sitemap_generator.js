const fs = require('fs');
const contentDB = require('./db_models/content_db');
const metaDB = require('./db_models/meta_db');
const mongodb_url = require('./config').mongodb_url;
const mongodb_option = require('./config').mongodb_option;
const mongoose = require('mongoose');

const connect = mongoose.connect(mongodb_url, {});



const filename = "sitemap.xml";
const url_origin = "http://www.javferry.com"
function initSiteMap(filename, callback){
    fs.writeFile(filename, `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`, callback);
}

function addInitPage(filenmae, callback){
    fs.appendFile(filename, `
    <url>
        <loc>${url_origin + '/'}</loc>
        <priority>1.00</priority>
    </url>`, callback);
}
function doneSiteMap(filename, callback){
    fs.appendFile(filename, `
</urlset>`, callback);
}
function __generateContentSiteMap(content){
    let publication_date = content.releaseDate.toString().substring(0, 10);
    let basic = `
    <url> 
        <loc>${url_origin + '/content/' + content._id}</loc> 
        <video:video>
        <video:thumbnail_loc>${content.imgSummaryUrl}</video:thumbnail_loc>
        <video:title>${content.title}</video:title>
        <video:player_loc allow_embed="yes" autoplay="ap=1">${content.videoUrl}</video:player_loc>
        <video:description>${content.title}</video:description>
        <video:publication_date>${publication_date}</video:publication_date>`;
    if(content.duration > 0 && content.duration < 28800) {
        basic += `
        <video:duration>${content.duration}</video:duration>`;
    }
    if(content.view > 0){
        basic += `
        <video:view_count>${content.view}</video:view_count>`;
    }
    if(content.rating > 0){
        basic += `
        <video:rating>${content.rating}</video:rating>`;
    }
    basic += `
        </video:video>
    </url>`;
    return basic;
}
function addContents(filename, from, limit, callback){
    let text = "";
    contentDB.find({}, null, {skip: from, limit: limit, sort:{releaseDate:-1}}, (err, results)=>{
        for(let r of results){
            text += __generateContentSiteMap(r);
        }
        fs.appendFile(filename, text, callback);
    }); 
}
function addMetas(filename, callback){
    const urls = ['/meta/category', '/meta/pornstar', '/meta/director'];
    let text = "";
    for(let i of urls){
        text += `
    <url>
        <loc>${url_origin + i}</loc>
        <priority>0.80</priority>
    </url>`;
    }
    fs.appendFile(filename, text, callback);
}
function addByMeta(filename, meta, from, limit, callback){
    //meta can be
    let text =""; 
    const name_converter = {
        'genre':'category',
        'starname':'pornstar',
        'director':'director',
        'studio':'studio'
    }
    metaDB.find({field: meta}, null, {skip:from, limit: limit, sort:{"field":1, "name":1}}, (err, results)=>{
        for(let r of results){
            text+= `
    <url>
        <loc>${url_origin + '/' + name_converter[meta] + '/' + r.name}</loc>
        <priority>0.80</priority>
    </url>`
        }
        fs.appendFile(filename, text, callback);
    });
}

connect.then((db)=>{
    console.log("[mongodb] connected correctly to server");
    initSiteMap(filename, ()=>{
        addInitPage(filename, ()=>{
            addMetas(filename, ()=>{
                addByMeta(filename, "genre", 0, 10, ()=>{
                    addContents(filename, 0, 10, ()=>{
                        doneSiteMap(filename, ()=>{
                            console.log('done');
                            mongoose.connection.close();
                        });
                    });
                });
            });
        });
    });
}, (err)=>{
    console.log("[mongodb] connection failed")
    console.log(err);
});