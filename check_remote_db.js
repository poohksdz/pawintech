require('dotenv').config();
const db = require('./config/db.js');
async function checkTable() {
  try {
    const [rows] = await db.pool.query("SHOW TABLES LIKE 'user_signatures'");
    console.log("Tables:", rows);
    const [rows2] = await db.pool.query("SHOW TABLES LIKE 'tbl_notifications'");
    console.log("Notifications Tables:", rows2);
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
}
checkTable();
