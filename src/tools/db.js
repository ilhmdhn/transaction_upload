const {getDbNormal} = require('../data/preferences');

// const db = getDbNormal()
// module.exports = {
//         user: db.user,
//         password: db.pass,
//         database: db.db,
//         server: db.ip,
//         pool: {
//           max: 10,
//           min: 0,
//           idleTimeoutMillis: 30000
//         },
//         options: {
//           encrypt: false, // for azure
//           tdsVersion: '7_1',
//           trustServerCertificate: false // change to true for local dev / self-signed certs
//     }
// }


module.exports = {
        user: 'sa',
        password: '123',
        database: 'HP112',
        server: '192.168.1.136',
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
          encrypt: false, // for azure
          tdsVersion: '7_1',
          trustServerCertificate: false // change to true for local dev / self-signed certs
    }
}