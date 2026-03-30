const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function naturalMCUImage() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774348504171.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu_natural.png');

        console.log("Processing MCU image for natural look...");

        // 1024x303. 
        // Target 1920x800.
        // Use 'cover' to preserve aspect ratio (it will crop a bit of the wide sides since 1024/303 is wider than 1920/800).
        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: 1024, height: 275 }) // Watermark removal
            .resize({
                width: 1920,
                height: 800,
                kernel: sharp.kernel.lanczos3,
                fit: sharp.fit.cover, // <--- Key change for natural look
                position: sharp.strategy.attention // Try to keep the most interesting parts
            })
            .sharpen({
                sigma: 0.8 // Mildly sharp
            })
            .toFile(outputPath);

        console.log("Natural image saved to", outputPath);

        // Update DB
        console.log("Updating Database...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [existing] = await pool.query("SELECT * FROM showcase WHERE present = 'presentTwo'");
        const imageToUpdate = existing.find(i => i.image && i.image.includes('showcase2_mcu'));

        if (imageToUpdate) {
            await pool.query(
                "UPDATE showcase SET image = ? WHERE _id = ?",
                ["/showcaseImages/showcase2_mcu_natural.png", imageToUpdate._id]
            );
            console.log("Showcase 2 entry updated.");
        }

        pool.end();
    } catch (err) {
        console.error("Error processing natural image:", err);
    }
}

naturalMCUImage();
