const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcl, getOcd, getOcdPromo, getSul, getSud, getDetailPromo, getCashSummaryDetail, getRoom, getIvc} = require('./src/data/data');


// execute('SELECT GETDATE()')

// getUser()
getIvc('2023-12-29')

// getRoom('2024-07-01')