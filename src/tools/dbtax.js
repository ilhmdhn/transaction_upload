const { getDbTax } = require('../data/preferences');

module.exports = () => {
  const db = getDbTax();
  return {
    user: db.user,
    password: db.pass,
    database: db.db,
    server: db.ip,
    options: {
      encrypt: false, // for azure
      tdsVersion: '7_1',
      trustServerCertificate: false // change to true for local dev / self-signed certs
    }
  };
};
