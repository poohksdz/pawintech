const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function applyRawImage() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774348504171.png";
        const targetFileName = 'showcase2_mcu_raw.png';
        const outputPath = path.join(__dirname, '../showcaseImages', targetFileName);

        console.log("Copying raw image exactly as requested...");

        // Copy file directly without any processing
        fs.copyFileSync(inputPath, outputPath);
        console.log("Image securely copied to", outputPath);

        console.log("Connecting to Database...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        // Find the blurry/composite image in Showcase 2 to replace
        const [existing] = await pool.query("SELECT * FROM showcase WHERE present = 'presentTwo'");
        const imageToReplace = existing.find(i => i.image && i.image.includes('showcase2_mcu'));

        if (imageToReplace) {
            console.log("Updating existing record ID:", imageToReplace._id);
            const [res] = await pool.query(
                "UPDATE showcase SET image = ? WHERE _id = ?",
                [`/showcaseImages/${targetFileName}`, imageToReplace._id]
            );
            console.log("Database update result:", res.affectedRows > 0 ? "Success" : "Failed");
        } else {
            console.log("Inserting new raw image as a fallback...");
            await pool.query(`
            INSERT INTO showcase (name, image, category, nameThai, categoryThai, present, navigateLink, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
                "MCU Sourcing",
                `/showcaseImages/${targetFileName}`,
                "Electronics",
                "จัดหา MCU",
                "อิเล็กทรอนิกส์",
                "presentTwo",
                ""
            ]);
            console.log("Inserted raw image successfully.");
        }

        pool.end();
    } catch (err) {
        console.error("Error applying raw image:", err);
    }
}

applyRawImage();
