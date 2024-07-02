const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd} = require('./src/data/data');


// execute('SELECT GETDATE()')

// getUser()
getOkd('2024-06-26')