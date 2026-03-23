const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawin-tech'
    });

    try {
        const [rows] = await connection.execute('DESCRIBE users');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("Error describing table:", err);
    } finally {
        await connection.end();
    }
}

checkUsersTable();
