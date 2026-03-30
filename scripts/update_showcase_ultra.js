require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function updateDB() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "pawin_tech",
    });

    try {
        const [result] = await pool.query(
            "UPDATE showcase SET image = ? WHERE present = 'presentThree'",
            ['/showcaseImages/showcase3_ultra.png']
        );
        console.log("Update result:", result.affectedRows > 0 ? "Success" : "No changes made");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        pool.end();
    }
}

updateDB();
