const config = require('./db');
const sql = require('mssql');

module.exports = (query) =>{    
    return new Promise(async(resolve, reject)=>{
        try {
            await sql.connect(config)
            const result = await sql.query(query);
            resolve(result.recordset)
        } catch (err) {
            reject(err);
        }
    });
}