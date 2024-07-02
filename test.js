const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo} = require('./src/data/data');


// execute('SELECT GETDATE()')

// getUser()
getOkdPromo('2024-06-26')