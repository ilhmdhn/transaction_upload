const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcl, getOcd, getOcdPromo, getSul, getSud, getDetailPromo, getCashSummaryDetail, getRoom, getIvc} = require('./src/data/data');
const { uploadPos } = require('./src/data/generate_file');


// execute('SELECT GETDATE()')

// getUser()
// getIvc('2023-12-29')
// uploadPos('2023-11-04');
// getRoom('2024-07-01')