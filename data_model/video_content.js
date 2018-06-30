function generateDuration(duration){
    // e.g. 11:40 => 11 * 60 + 40 = 660 + 40 = 700,
    // 01:11:40 => 3600 + 700 = 4300
    try{
        let times = duration.split(':');
        let unit = times.length;
        let result = 0;
        for(let i = 0; i < times.length; i++){
            let temp = 1;
            for(let i_2 = 0; i_2 < unit - 1; i_2 ++){
                temp *= 60;
            }
            result += Number(times[i]) * temp;
            unit -= 1;
        }
        return result;
    }catch(err){
        return 0;
    }
}
function normalizeName(category){
    category = category.toLowerCase().replace(/ /g, '-');
    category = category.replace(/\//g, '-');
    category = category.replace('-&-', '-');
    return category;
}
const ignore = '**-**';
const genre_name_converter = {};
// javseen -> javfinder
genre_name_converter['3p'] = "threesome"; 
genre_name_converter['school-stuff'] = "teacher";
genre_name_converter['female-teacher'] = "teacher";
genre_name_converter['japan-sex']="japanese";
genre_name_converter['car-sex'] = 'car';
genre_name_converter['outdoors'] = 'outdoor';
genre_name_converter['school-uniform'] = 'schoolgirl';
genre_name_converter['school-girls'] = 'schoolgirl';
// genre_name_converter['school-stuff'] = 'schoolgirl';
//genre_name_converter['school-swimsuit'] = 'schoolgirl';
genre_name_converter['school-swimsuit'] = 'schoolgirl';
genre_name_converter['girl-cosplay'] = 'cosplay';
genre_name_converter['cosplay-costumes'] = 'cosplay';
genre_name_converter['mature-woman'] = 'mature'; 
genre_name_converter['facials'] = 'facial';
genre_name_converter['other-fetish'] = 'fetish';
genre_name_converter['blow']='blowjob';
genre_name_converter['toy'] = 'toys';
genre_name_converter['lesbians'] = 'lesbian';
genre_name_converter['lesbian-kiss'] = 'lesbian';
genre_name_converter['ol'] ='office-lady';
genre_name_converter['female-college-student'] = 'college';
genre_name_converter['other-students'] = 'college';
genre_name_converter['shaved'] = 'shaved-pussy';
genre_name_converter['avopen-2017-documentary-dept'] = 'documentary';
genre_name_converter['avopen-2017-drama-dept'] = 'drama';
genre_name_converter['virgin-man'] = 'cherry-boy';
genre_name_converter['girl'] = ignore;
genre_name_converter['gal'] = ignore;
genre_name_converter['jav-hd'] = ignore;
genre_name_converter['av-open-2015-maiden-dept.'] = ignore;
genre_name_converter['futanari'] = ignore;
genre_name_converter['model'] = ignore;
genre_name_converter['oversea-import'] = ignore;
genre_name_converter['cruel-expression'] = 'horror';
genre_name_converter['video-sample'] = ignore;
genre_name_converter['sex-conversion---feminized'] = ignore;
genre_name_converter['sf'] = 'science-fiction';
genre_name_converter['nude'] = ignore;
// javseen -> javseen
genre_name_converter['restraints'] = 'restraint'; 
genre_name_converter['girl'] = 'gal';
genre_name_converter['mob---heroism']='mob-heroism';
genre_name_converter['black-actor'] = 'black-man';
genre_name_converter['finger-fuck'] = 'fingering';
genre_name_converter['user-submission'] = ignore;
genre_name_converter['av-actress'] = ignore;
genre_name_converter['risky-mosaic'] = ignore;
genre_name_converter['other-asian'] = "asian";
genre_name_converter['pregnant-woman'] = 'pregnant';
genre_name_converter['other'] = ignore;
genre_name_converter['how-to'] = ignore;
genre_name_converter['image-video'] = ignore;
genre_name_converter['medical'] = 'nurse';
// genre_name_converter['childhood-friend'] = ignore;
// genre_name_converter['busty-fetish'] = 'big-tits';

// javfinder -> javseen
genre_name_converter['solo-girl'] = "solowork";
genre_name_converter['69-style']="69";
genre_name_converter['tit-fuck'] = 'titty-fuck'; //
genre_name_converter['foot-job-ashifechi'] = 'footjob';
genre_name_converter['maid-meido'] = 'maid';
genre_name_converter['us-eu-porn'] = 'white-actress';
// javfinder -> javfinder
genre_name_converter['older-younger-sist']="older-sister";
genre_name_converter['masturbate'] = 'masturbation';
genre_name_converter['bus-guide']='bus';

const studio_name_convert = {};
studio_name_convert["prestige-av"] = "prestige";


const lastnames = [
    'hamasaki', 
    'sasaki',
    'mizuno',
    'shinoda'
];
function firstname_lastname_converter(starname){
    let starname_ = starname.split('-');
    if(starname_.length === 2){
        if(lastnames.indexOf(starname_[0]) !== -1){
            return starname_[1] + '-' + starname_[0];
        }else{
            return starname;
        }
    }else{
        return starname;
    }
}

class VideoContent{
    constructor(domain){
        this.data = {
            domain:domain, // porn site domain, e.g. javseen, ...
            status:0,
            index: "", // e.g. ABC-123
            indexUrl: "",  // the indexUrl (pageurl)
            imgSummaryUrl:"",
            imgPreviewUrls:[],
            title:"",
            starnames:[],
            genres:[], // big tits, blowjob, deep throat
            studio:"",
            director:"",
            videoDomain:"", // openload, fembed
            videoUrl:"",
            videoUrls:[], // [{field:'240p', videoUrl:'https://xxxx'}]
            duration:0, // 02:10:02 => 2* 3600 + 10 * 60 + 2 = 7802
            notes:"", // '{}'
            view: 0,
            releaseDate: new Date(),
            favorite:0,
            rating:0
        }
    }
    setDomain(value){
        this.data.domain = value;
    }
    getDomain(){
        return this.data.domain;
    }
    setData(data){
        if(data){
            this.data = data;
        }
    }
    getData(){
        return this.data;
    }
    setStatus(value){
        if(typeof value === 'number'){
            this.data.status = value;
        }else if(value === 'success' || value === true){
            this.data.status = 99;
        }else if(value === 'fail'){
            this.data.status = 0;
        }else{
            this.data.status = 44;
        }
    }
    getStatus(){
        if(this.data.status === undefined){
            this.data.status = 99;
        }
        return this.data.status
        
    }
    setEffective(value){
        console.log('setEffective is deprecated. Please use setStatus instead.')
        this.setStatus(value);
    }
    getEffective(){
        console.log('getEffective is deprecated. Please use getStatus instead.');
        return this.data.status;
    }
    setIndex(index){
        this.data.index = index;
    }
    getIndex(){
        if(this.data.index === ""){
            this.data.index = "unknown";
        }
        return this.data.index;
    }
    setIndexUrl(url){
        this.data.indexUrl = url;
    }
    getIndexUrl(){
        return this.data.indexUrl;
    }
    setImgPreviewUrls(value){
        this.data.imgPreviewUrls = value;
    }  
    addImgPreviewUrl(url){
        if(this.data.imgPreviewUrls){
            this.data.imgPreviewUrls.push(url);
        }else{
            this.data.imgPreviewUrls = [url];
        }
    }
    getImgPreviewUrls(){
        if(this.data.imgPreviewUrls){
            return this.data.imgPreviewUrls;
        }else{
            return [];
        }
    }
    setImgSummaryUrl(url){
        this.data.imgSummaryUrl = url;
    }
    getImgSummaryUrl(){
        return this.data.imgSummaryUrl;
    }
    setTitle(title){
        this.data.title = title;
    }
    getTitle(){
        return this.data.title;
    }
    setGenres(genres){
        genres.forEach(element => {
            this.addGenre(normalizeName(element)); 
        });
    }
    addGenre(genre){
        if(this.data.genres){
            this.data.genres.push(normalizeName(genre));
        }else{
            this.data.genres = [normalizeName(genre)];
        }   
    }
    getGenres(){
        if(this.data.genres){
            let i = 0; 
            let result = [];
            while(i < this.data.genres.length){
                let genre = genre_name_converter[this.data.genres[i]];
                if(genre && genre !== ignore && result.indexOf(genre) === -1){
                    // the last one guarantees no duplicated genre
                    result.push(genre);
                }else if(!genre && result.indexOf(this.data.genres[i]) === -1){
                    // the last one guarantees no duplicated genre
                    result.push(this.data.genres[i]);
                }
                i++;
            }
            this.data.genres = result;
            return this.data.genres;
        }else{
            this.data.genres = [];
            return this.data.genres;
        }
        
    }
    setStarnames(starnames){
        if(starnames){
            starnames.forEach(element =>{
                this.addStarname(normalizeName(element));
            });
        }
    }
    addStarname(starname){
        if(this.data.starnames){
            this.data.starnames.push(normalizeName(starname));
        }else{
            this.data.starnames = [normalizeName(starname)];
        }
    }
    getStarnames(){
        if(this.data.starnames){
            let i = 0; 
            let result = [];
            while(i < this.data.starnames.length){
                let starname = firstname_lastname_converter(this.data.starnames[i]);
                if(result.indexOf(starname) === -1){
                    result.push(starname);
                }
                i++;
            }
            this.data.starnames = result;
            return this.data.starnames;
        }else{
            this.data.starnames = [];
            return this.data.starnames;
        }
    }
    setStudio(value){
        this.data.studio = normalizeName(value);
    }
    getStudio(){
        if(this.data.studio === ''){
            this.data.studio = 'unknown';
        }
        let temp = studio_name_convert[this.data.studio];
        if(temp){
            this.data.studio = temp;
            return temp;
        }else{
            return this.data.studio;
        }
    }
    setDirector(value){
        this.data.director = normalizeName(value);
    }
    getDirector(){
        if(this.data.director === ''){
            this.data.director = 'unknown';
        }
        return this.data.director;
    }
    setVideoUrl(value){
        this.data.videoUrl = value;
    }
    getVideoUrl(){
        return this.data.videoUrl;
    }
    getVideoUrls(){
        return this.data.videoUrls;
    }
    setVideoUrls(value){
        this.data.videoUrls = value;
    }
    addVideoUrl(rs, value){
        this.data.videoUrls.push({resolution:rs, videoUrl: value});
    }
    setVideoDomain(value){
        this.data.videoDomain = value;
    }
    getVideoDomain(){
        return this.data.videoDomain;
    }
    setDuration(value){
        if(typeof value === 'number'){
            this.data.duration = value;
        }else if(typeof value === 'string'){
            this.data.duration = generateDuration(value);
        }
    }
    getDuration(){
        return this.data.duration;
    }
    setNotes(value){
        this.data.notes = value;
    }
    getNotes(){
        return this.data.notes;
    }
    setReleaseDate(value){
        this.data.releaseDate = value;
    }
    setView(value){
        this.data.view = value;
    }
    setFavorite(value){
        this.data.favorite = value;
    }
    setRating(value){
        this.data.rating = value;
    }
    getReleaseDate(value){
        return this.data.releaseDate;
    }
    getView(value){
        return this.data.view;
    }
    getFavorite(value){
        return this.data.favorite;
    }
    getRating(value){
        return Math.floor(this.data.rating * 100) / 100;
    }
}

module.exports = VideoContent;