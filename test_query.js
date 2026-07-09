require('dotenv').config();
const db = require('./config/db.js');
async function testQuery() {
  try {
    const userId = undefined;
    const [sigs] = await db.pool.query(
      "SELECT * FROM user_signatures WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    console.log("Sigs:", sigs);
    process.exit(0);
  } catch (err) {
    console.error("Query Error:", err);
    process.exit(1);
  }
}
testQuery();
