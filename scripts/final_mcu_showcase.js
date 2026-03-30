const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function finalShowcaseTwo() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774349572388.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu_final_v2.png');

        console.log("Processing final Showcase 2 image (1024x419) to fill 1920x800...");

        // 1. Crop watermark from bottom (303 -> 275 was for the other one, this is 419)
        // 1024x419. Crop bottom ~30 pixels. 
        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: 1024, height: 389 }) // 419 - 30 = 389
            .resize({
                width: 1920,
                height: 800,
                kernel: sharp.kernel.lanczos3,
                fit: sharp.fit.cover // Fill the space naturally
            })
            .sharpen({ sigma: 0.5 })
            .toFile(outputPath);

        console.log("Final processed image saved to", outputPath);

        // 2. Update DB
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
                ["/showcaseImages/showcase2_mcu_final_v2.png", imageToUpdate._id]
            );
            console.log("Showcase 2 updated.");
        }

        pool.end();
    } catch (err) {
        console.error("Error processing final Showcase 2 image:", err);
    }
}

finalShowcaseTwo();
