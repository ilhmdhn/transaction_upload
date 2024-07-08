const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcl, getOcd, getOcdPromo, getSul, getSud, getDetailPromo, getCashSummaryDetail, getRoom, getIvc, search} = require('./src/data/data');
const { uploadPos } = require('./src/data/generate_file');
const encrypt = require('./src/tools/encrypt');
const decrypt = require('./src/tools/decrypt');


const xorCrypt = require('xor-crypt');
const xor = require('xor-crypt');

// execute('SELECT GETDATE()')

// getUser()
// getIvc('2023-12-29')
// uploadPos('2023-11-04');
// getRoom('2024-07-01')

// console.log(encrypt("­œ”ŸŠ’–"))
// console.log(decrypt("Talitha"))
search()