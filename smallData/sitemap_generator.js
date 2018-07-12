const fs = require('fs');
const _ = require('lodash')
const contentDB = require('./db_models/content_db');
const metaDB = require('./db_models/meta_db');
const mongodb_url = require('./config').mongodb_url;
const mongodb_option = require('./config').mongodb_option;
const mongoose = require('mongoose');

const connect = mongoose.connect(mongodb_url, {});
//const filename = "sitemap.xml";
// const filename = "./seo/sitemap/sitemap.xml";
const url_origin = "http://www.javferry.com"
function initSiteMap(filename, callback){
    fs.writeFile(filename, `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" 
      xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`, callback);
}

function addInitPage(filename, callback){
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
    let day = content.releaseDate.getDate();
    let month =content.releaseDate.getMonth() + 1;
    let year = content.releaseDate.getFullYear();
    if(day < 10){
        day = '0'+day;
    }else{
        day = day.toString();
    }
    if(month< 10){
        month = '0' + month;
    }else{
        month = month.toString();
    }
    let publication_date = year + '-' + month + '-' + day;
    let basic = `
    <url> 
        <loc>${url_origin + '/content/' + content._id}</loc> 
        <video:video>
        <video:thumbnail_loc>${_.escape(content.imgSummaryUrl)}</video:thumbnail_loc>
        <video:title>${_.escape(content.title)}</video:title>
        <video:player_loc allow_embed="yes" autoplay="ap=1">${content.videoUrl}</video:player_loc>
        <video:description>${_.escape(content.title)}</video:description>
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

function sitemap(callback){
    let filename = "./seo/sitemap/sitemap.xml";
    let text = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_meta.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_meta_genre.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_meta_director.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_meta_starname.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_meta_studio.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
       <loc>${url_origin}/sitemap/sitemap_content_5000_1.xml</loc>
       <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_content_5000_2.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_content_5000_3.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    <sitemap>
        <loc>${url_origin}/sitemap/sitemap_content_5000_4.xml</loc>
        <lastmod>2018-07-12</lastmod>
    </sitemap>
    </sitemapindex>`;
    fs.writeFile(filename, text, callback);
}
/**
 * 1. meta
 * 2. starname 1.page
 * 3. category
 * 4. director
 * 5. studio
 * 6. content 5000
 * 7. content 5000
*/

function sitemap_content_5000_1(callback){
    let filename = "./seo/sitemap/sitemap_content_5000_1.xml";
    initSiteMap(filename, ()=>{
        addContents(filename, 0, 5000, ()=>{
            doneSiteMap(filename, callback);
        });
    });
}
function sitemap_content_5000_2(callback){
    let filename = "./seo/sitemap/sitemap_content_5000_2.xml";
    initSiteMap(filename, ()=>{
        addContents(filename, 5000, 5000, ()=>{
            doneSiteMap(filename, callback);
        });
    });
}
function sitemap_content_5000_3(callback){
    let filename = "./seo/sitemap/sitemap_content_5000_3.xml";
    initSiteMap(filename, ()=>{
        addContents(filename, 10000, 5000, ()=>{
            doneSiteMap(filename, callback);
        });
    });
}
function sitemap_content_5000_4(callback){
    let filename = "./seo/sitemap/sitemap_content_5000_4.xml";
    initSiteMap(filename, ()=>{
        addContents(filename, 15000, 5000, ()=>{
            doneSiteMap(filename, callback);
        });
    });
}
function sitemap_meta(callback){
    let filename = "./seo/sitemap/sitemap_meta.xml";
    initSiteMap(filename, ()=>{
        addInitPage(filename, ()=>{
            addMetas(filename, ()=>{
                doneSiteMap(filename, callback);
            });
        });
    });
}
// genre, starname, studio, director
function sitemap_meta_sub(type, callback){
    let filename = "./seo/sitemap/sitemap_meta_" + type +".xml";
    initSiteMap(filename, ()=>{
        addByMeta(filename, type, 0, 10000, ()=>{
            doneSiteMap(filename, callback);
        });
    });
}

connect.then((db)=>{
    console.log("[mongodb] connected correctly to server");
    sitemap(()=>{
        console.log('done');
        mongoose.connection.close();
    });
}, (err)=>{
    console.log("[mongodb] connection failed")
    console.log(err);
});