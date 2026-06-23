const mysql = require('mysql2');
require('dotenv').config();

console.log("DB CONFIG:", {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
});

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("DB CONNECTION ERROR:", err.code, err.message);
  } else {
    console.log("DB CONNECTED SUCCESSFULLY");
    connection.release();
  }
});

module.exports = pool.promise();