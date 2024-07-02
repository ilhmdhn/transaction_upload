const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcl, getOcd} = require('./src/data/data');


// execute('SELECT GETDATE()')

// getUser()
getOcd('2023-12-31')