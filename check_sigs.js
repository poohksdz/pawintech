require('dotenv').config();
const db = require('./config/db.js');
async function run() {
  try {
    const [sigs] = await db.pool.query("SELECT * FROM user_signatures");
    console.log("Signatures in DB:", sigs);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
