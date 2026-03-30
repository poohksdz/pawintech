const mysql = require("mysql2/promise");

// console.log(" กำลังเชื่อมต่อ MySQL (โหมด localhost)...")

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pawin_tech",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 60000, // Close idle connections after 60s
  connectTimeout: 10000, // 10s connection timeout
});

const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    // console.log(` MySQL Connected Successfully! ID: ${conn.threadId}`)
    conn.release();
  } catch (error) {
    console.error(`❌ Connect Failed: ${error.message}`);
  }
};

module.exports = { pool, connectDB };
// Triggering nodemon restart
