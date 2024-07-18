const sql = require('mssql');

module.exports = (query) =>{    
    return new Promise(async(resolve, reject)=>{
        try {
            const config = require('./dbtax');
            await sql.connect(config())
            const result = await sql.query(query);
            resolve(result.recordset)
        } catch (err) {
            reject(err);
        }
    });
}