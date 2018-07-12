 
///////// Database configurations //////////
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const EventEmitter = require('events');

const contentDB = require('./db_models/content_db');
const genreDB = require('./db_models/genre_db');
const starDB = require('./db_models/star_db');
const metaDB = require('./db_models/meta_db');
const updateNewValueByOldValue = require('./db_operations/normalize_db_ops').updateNewValueByOldValue;
const launcher = new EventEmitter();
mongoose.Promise = bluebird;
const mongodb_url = require('./config').mongodb_url;
const mongodb_option = require('./config').mongodb_option;
const connect = mongoose.connect(mongodb_url, {});
connect.then((db)=>{
        console.log("[mongodb] connected correctly to server");
        launcher.emit('db ready');
    }, (err)=>{
        console.log("[mongodb] connection failed")
        console.log(err);
});

const starnameValidEvent = new EventEmitter();
let counter = 0;

const abort_chars = '()01234567890 ,';
const lastnames = [
    'hamasaki', 
    'sasaki',
    'mizuno',
    'mizuki',
    'shinoda',
    'hatano',
    'hoshina',
    'nikaidou',
    'kimijima',
    'nagai',
    'sazanami',
    'abe',
    'kimura',
    "yuzuki"
];
const firstnames = [
    'ayuri',
    'erika',
    'shuri',
    'aki',
    'aya',
    'yu',
    'nao',
    'yuki',
    'airi',
    'mao',
    'mio',
    'ai',
    'asahi',
    'aya',
    'yuu',
    'rika',
    'sora',
    'yukari',
    'honoka',
    'yukine',
    'yuuri',
    'ikumi'
];
function starname_validate(name){
    for(let i of name){
        if(abort_chars.indexOf(i) !== -1){
            return null;
        }
    }
    if(name.indexOf('-') === -1){
        return null;
    }
    let first_last = name.split('-');
    if(first_last.length !== 2){
        return null;
    }
    return name;
}
let map_ = new Map();
function addstat(name){
    let counter = map_.get(name);
    if(typeof counter === 'number'){
        map_.set(name, counter + 1);
    }else{
        map_.set(name, 1);
    } 
}
function showStat(){
    map_[Symbol.iterator] = function* () {
        yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
    }
    for (let [key, value] of map_) {     // get data sorted
        console.log(key + ' ' + value);
    }
}
function check_reverse(name, callback){
    let first_last = name.split('-');
    let new_name =  first_last[1] + '-' + first_last[0];
    addstat(first_last[1]);
    addstat(first_last[0]);
    metaDB.find({field:"starname", name: new_name}, callback);
}
function check_right_order(name){
    let first_last = name.split('-');
    if(firstnames.indexOf(first_last[0]) !== -1 || lastnames.indexOf(first_last[1]) !== -1){
        return 1; // "OK";
    }else if(firstnames.indexOf(first_last[1]) !== -1 || lastnames.indexOf(first_last[0]) !== -1){
        return 2; // 'wrong order'
    }else{
        return 3; // "Unknown"
    }
}
starnameValidEvent.on('next', (i)=>{
    /*if(i > 100){
        starnameValidEvent.emit('done');
        return;
    }*/
    metaDB.find({field:"starname"}, null, {skip: i, limit:1, sort:{name:1}}, (err, stars)=>{
        if(err){
            starnameValidEvent.emit('err', (err));
        }else if(stars.length > 0){
            console.log(`====== Current star ${i} ${stars[0].name} ======`);
            let name = starname_validate(stars[0].name);
            if(name === null){
                console.log('Invalid name: ' + stars[0].name);
                starnameValidEvent.emit('next', (i + 1));
            }else{
                check_reverse(name, (err, result)=>{
                    if(err){
                        starnameValidEvent.emit('err', (err));
                    }else if(result.length > 0){
                        let r = check_right_order(name);
                        switch(r){
                            case 1:{
                                console.log('Good name: ' + name);
                                starnameValidEvent.emit('next', (i + 1));
                            };break;
                            case 2:{
                                let last_first = name.split('-');
                                let new_n = last_first[1] + '-' + last_first[0];
                                console.log('Reverse name: ' + name + ' to ' + new_n);
                               
                                updateNewValueByOldValue('starname', name,new_n, (result)=>{
                                    if(result.success){
                                        console.log('Reverse name done');
                                        starnameValidEvent.emit('next', (i + 1));
                                    }else{
                                        console.log('Reverse name error');
                                        starnameValidEvent.emit('err', (new Error(result.reasons[0])));
                                    }
                                });
                            };break;
                            default:{
                                console.log('Not sure name: ' + stars[0].name);
                                starnameValidEvent.emit('next', (i + 1));
                            };break;
                        }
                    }else{
                        console.log('Good name: ' + name);
                        starnameValidEvent.emit('next', (i + 1));
                    }
                });
            }
        }else{
            starnameValidEvent.emit('done');
        }
    });
});
starnameValidEvent.on('done', ()=>{
    console.log('finished');
    showStat();
})
starnameValidEvent.on('err', (err)=>{
    console.log('**** error ******');
    console.log(err.message);
})
function clear_starname_task(){
    starnameValidEvent.emit('next', 0);
}
launcher.once('db ready', ()=>{
    clear_starname_task();
});