const normalizeTitle = require('./db_operations/reverse_index_db_ops').normalizeTitle;
const filterWords = require('./db_operations/reverse_index_db_ops').filterWords;
//console.log(filterWords(normalizeTitle("[Personal Photo Session] Taiwan Half's Underground Idol Rui Lan (Ruuran) Gangbang Friends' S Party").split(' ')));
const __search = require('./db_operations/reverse_index_db_ops').__search;
__search("[Personal Photo Session] Taiwan Half's Underground Idol Rui Lan (Ruuran) Gangbang Friends' S Party", console.log);