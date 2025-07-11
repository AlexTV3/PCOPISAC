const sql = require('mssql');
const dbConfig = {
    user: 'sa',
    password: 'UCSUR123+',
    server: 'dbpcopisac.cvcoqacm4r23.sa-east-1.rds.amazonaws.com',
    port: 1433,
    database: 'PCOPISAC',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Conexión exitosa a SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Error en la conexión a SQL Server:', err);
  });

module.exports = {
  sql,
  query: async (text) => {
    const pool = await poolPromise;
    return pool.request().query(text);
  },
  getPool: () => poolPromise
};