require('dotenv').config();
const db = require('./config/db.js');
async function checkCols() {
  try {
    const [rows] = await db.pool.query("SHOW COLUMNS FROM user_signatures");
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCols();
