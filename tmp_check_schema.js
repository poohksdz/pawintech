const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('--- tbl_category schema ---');
        const [categoryCols] = await connection.query('DESCRIBE tbl_category');
        console.table(categoryCols);

        console.log('\n--- tbl_subcategory schema ---');
        const [subcategoryCols] = await connection.query('DESCRIBE tbl_subcategory');
        console.table(subcategoryCols);

        console.log('\n--- tbl_product schema ---');
        const [productCols] = await connection.query('DESCRIBE tbl_product');
        console.table(productCols);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
