
const contentBufferDB = require('../db_models/content_buffer_db');
const VideoContent = require('../../data_model/video_content');



function __convertData2Content(content){
    // verify required field exists
    let videoContent = new VideoContent();
    videoContent.setData(content);
    try{ 
        let domain = videoContent.getDomain();
        let indexUrl = videoContent.getIndexUrl();
        let title = videoContent.getTitle();
        let releaseDate = new Date(videoContent.getReleaseDate());
        if(releaseDate.getTime()){
            releaseDate =  videoContent.getReleaseDate();
        }else{
            releaseDate =  new Date();
        }
        videoContent.setReleaseDate(releaseDate);
        if(domain && indexUrl && title){
            let content = {
                domain: domain,
                index: videoContent.getIndex(),
                indexUrl: indexUrl,
                imgPreviewUrls: videoContent.getImgPreviewUrls(),
                imgSummaryUrl: videoContent.getImgSummaryUrl(),
                title: videoContent.getTitle(),
                starnames: videoContent.getStarnames(),
                genres: videoContent.getGenres(),
                studio: videoContent.getStudio(),
                director: videoContent.getDirector(),
                videoDomain: videoContent.getVideoDomain(),
                videoUrl: videoContent.getVideoUrl(),
                videoUrls: videoContent.getVideoUrls(),
                duration: videoContent.getDuration(),
                notes: videoContent.getNotes(),
                releaseDate: releaseDate,
                view: videoContent.getView(),
                favorite: videoContent.getFavorite(),
                rating: videoContent.getRating(),
                status: videoContent.getStatus()
            };
            if(videoContent.data._id){
                // used when transfer data between mongodb
                content['_id'] = videoContent.data._id;
            }
            return content;
        }
    }catch(err){
        return err;
    }
}

function storeContentBuffer(data, callback){
    let content = __convertData2Content(data);
    if(!content){
        callback({success: false, reasons:['failed to convert data to a contentDB compatible data']});
        return;
    }
    contentBufferDB.create(content, (err, result)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            callback({success: true, reasons:[], value: result});
        }
    });
}
function removeAll(callback){
    contentBufferDB.remove({}, (err, result)=>{
        if(err){
            callback({success: false, reasons:[err.message]});
        }else{
            callback({success: true, reasons:[], value: result});
        }
    });
}

module.exports.storeContentBuffer = storeContentBuffer;
module.exports.removeAll = removeAll;