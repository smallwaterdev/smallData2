class VideoIndices{
    constructor(){
        this.data = {
            status:"fail",
            urls:[]
        }
    }
    setData(data){
        this.data = data;
    }
    addVideoUrl(url){
        this.data.urls.push(url);
    }
    setStatus(value){
        this.data.status = value;
    }
}
module.exports = VideoIndices;