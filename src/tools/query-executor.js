const sql = require('mssql');
const config = require('./db');

module.exports = (query) => {    
    return new Promise(async (resolve, reject) => {
        try {
            const dbConfig = config();
            const pool = new sql.ConnectionPool(dbConfig);
            const poolConnect = pool.connect();
            await poolConnect;
            const request = new sql.Request(pool);
            const result = await request.query(query);
            resolve(result.recordset);
        } catch (err) {
            reject(err);
        } finally {
            sql.close(); // Close the connection explicitly
        }
    });
};
