const execute = require('./src/tools/query-executor');
const {getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcl, getOcd, getOcdPromo, getSul, getSud, getDetailPromo} = require('./src/data/data');


// execute('SELECT GETDATE()')

// getUser()
getDetailPromo('2023-12-29')