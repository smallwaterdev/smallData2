function convertContent2UserData(content){

    if(content.effective){
        let result = {
            title: content.title,
            index: content.index,
            videoDomain: content.videoDomain,
            videoUrl: content.videoUrl,
            director: content.director,
            starnames: content.starnames,
            genres: content.genres,
            studio: content.studio,
            duration: content.duration,
            imgSummaryUrl: content.imgSummaryUrl,
            favorite: content.favorite,
            rating: content.rating,
            view: content.view,
            id: content._id,
            releaseDate: content.releaseDate
        };
        return result;
    }else{
        return null;
    }
}
module.exports.convertContent2UserData = convertContent2UserData;