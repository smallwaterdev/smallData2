const fs = require('fs');
const _ = require('lodash')
const queryMeta = require('../db_operations/meta_db_ops').queryMeta;
const scheduler = require('../db_operations/helper_functions').scheduler;
const refreshSEOUrl = require('../db_operations/seourl_db_ops').refreshSEOUrl;
const querySEOUrls = require('../db_operations/seourl_db_ops').querySEOUrls;
const queryContent = require('../db_operations/content_db_ops').queryContents;
const valid_meta = ['starname', 'genre', 'director', 'studio'];

function filenameGenerator(field, num){
    return `sitemap-${field}-${num}.xml`;
}
///////////////////////////////////////////////////////////////////////////////
/**
 * 1. query contents, refresh those id to querySEOUrl, and update those content's status to 79
 * 
*/
function refreshSEOUrlByMeta(field, callback){
    if(valid_meta.indexOf(field) !== -1){
        queryMeta(field, null, (result)=>{
            if(result.success){
                scheduler(result.value, 3, (meta, __callback)=>{
                    refreshSEOUrl(field, meta.name, 99, __callback);
                },callback);
            }else{
                callback(result);
            }
        });
    }else{
        callback({success: false, reasons:['Invalid condition']});
    }
}
function refreshSEOUrlByContent(condition, option, callback){
    queryContent(condition, option, (result)=>{
        if(result.success){
            scheduler(result.value, 5, (content, __callback)=>{
                refreshSEOUrl('content', content._id.toString(), 99, (res)=>{
                    if(res.success){
                        content.status = 79;
                        content.save((err, sR)=>{
                            if(err){
                                __callback({success: false, reasons:[err.message]})
                            }else{
                                __callback({success: true, reasons:[], value: sR});
                            }
                        });
                    }else{
                        __callback(res);
                    }
                });
            }, callback);
        }else{
            callback(result);
        }
    });
}

function refreshSEOUrlCollection(field, condition, option, callback){
    if(!condition){
        callback({success: false, reasons:[`Invalid field`]});
        return;
    }
    if(field && field === 'content'){
        refreshSEOUrlByContent(condition, option, callback);
    }else if(field){
        refreshSEOUrlByMeta(field, callback);
    }else{
        callback({success: false, reasons:[`Invalid field`]});
    }
}
/////////////////////////////////////////////////////////////////////////////////////////
function fieldNameConvert(name){
    switch(name){
        case "starname":{
            return 'pornstar';
        };
        case "genre":{
            return "category";
        };
        default:{
            return name;
        }
    }
}
function createSitemapFromSEOUrl(outputFilename, condition, option, callback){
    if(!outputFilename){
        callback({success: false, reasons:[`Invalid input`]});
        return;
    }
    querySEOUrls(condition, option, (result)=>{
        if(result.success){
            let urlList = []; //{url:, prority:}
            let seoUrls = result.value;
            for(let i = 0; i < seoUrls.length; i++){
                switch(seoUrls[i].field){
                    case "content":{
                        urlList.push({
                            url:`http://www.javferry.com/content/${seoUrls[i].value}`,
                            priority: 0.4
                        });
                    };break;
                    case "starname":
                    case "genre":
                    case "studio":
                    case "director":{
                        urlList.push({
                            url:`http://www.javferry.com/${fieldNameConvert(seoUrls[i].field)}/${seoUrls[i].value}`,
                            priority: 0.6
                        });
                    };break;
                    default:{

                    };break;
                }
            }
            /////////////////////////////////////////////////////////////////////////
            let text = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
            for(let i = 0; i< urlList.length; i++){
                text += ` <url>\n  <loc>${_.escape(urlList[i].url)}</loc>\n  <priority>${urlList[i].priority}</priority>\n </url>\n`
            }
            text += '</urlset>\n';
            fs.writeFile(outputFilename, text, (err)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[]});
                }
            });
        }else{
            callback(result);
        }
    });
}


function createRootSitemap(filename, directory, callback){
    if(!filename || !directory){
        callback({success: false, reasons:[`Invalid input`]});
        return;
    }
    fs.readdir(directory, (err, items)=>{
        if(err || items.length === 0){
            if(err){
                callback({success: false, reasons:[err.message]});
            }else{
                callback({success: false, reasons:[`No items`]});
            }
        }else{
            let date = new Date();
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
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
            let lastmod = year + '-' + month + '-' + day;
            let text = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
            for(let i = 0; i < items.length; i++){
                let filename = items[i];
                text += ` <sitemap>\n  <loc>http://www.javferry.com/sitemap/${filename}</loc>\n  <lastmod>${lastmod}</lastmod>\n </sitemap>\n`;
            }
            text += '</sitemapindex>';
            fs.writeFile(filename, text, (err)=>{
                if(err){
                    callback({success: false, reasons:[err.message]});
                }else{
                    callback({success: true, reasons:[]});
                }
            });
        }
        
        
                
    
    });
}
module.exports.createRootSitemap = createRootSitemap;
module.exports.refreshSEOUrlCollection = refreshSEOUrlCollection;
module.exports.createSitemapFromSEOUrl = createSitemapFromSEOUrl;