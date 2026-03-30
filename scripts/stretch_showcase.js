const Jimp = require('jimp');
const path = require('path');
const mysql = require('mysql2/promise');

async function resizeShowcase() {
    try {
        const inputPath = path.join(__dirname, '../showcaseImages/showcase3_no_watermark.png');
        const outputPath = path.join(__dirname, '../showcaseImages/showcase3_resized.png');

        console.log("Reading image:", inputPath);
        const image = await Jimp.read(inputPath);
        console.log(`Original size: ${image.bitmap.width}x${image.bitmap.height}`);

        // The user wants it to fit other showcases which are 1600x595.
        // 'cover' scales the image so the given width and height are covered, then crops the rest.
        console.log("Resizing and cropping to 1600x595 to fit perfectly...");
        image.cover(1600, 595);

        console.log("Saving resized image...");
        await image.writeAsync(outputPath);
        console.log("Image saved successfully to", outputPath);

        // Update DB
        console.log("Updating database...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [result] = await pool.query(
            "UPDATE showcase SET image = ? WHERE present = 'presentThree'",
            ['/showcaseImages/showcase3_resized.png']
        );
        console.log("Update result:", result.affectedRows > 0 ? "Success" : "No changes made");

        pool.end();
    } catch (error) {
        console.error("Error:", error);
    }
}

resizeShowcase();
