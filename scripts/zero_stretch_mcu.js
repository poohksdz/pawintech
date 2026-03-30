const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function zeroStretchMCU() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774348504171.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu_zero_stretch.png');

        console.log("Preparing zero-stretch banner for Showcase 2...");

        // 1. Prepare the foreground: Crop watermark and sharpen (STILL AT 1024px)
        const foregroundBuffer = await sharp(inputPath)
            .extract({ left: 0, top: 0, width: 1024, height: 275 })
            .sharpen({ sigma: 0.5 }) // Just a tiny bit of sharpen for extra clarity
            .toBuffer();

        console.log("Creating 1920x800 canvas with black background...");
        // 2. Wrap it in a 1920x800 container to prevent browser CSS from stretching the pixels
        await sharp({
            create: {
                width: 1920,
                height: 800,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 } // Solid True Black background
            }
        })
            .composite([{
                input: foregroundBuffer,
                gravity: 'center'
            }])
            .toFile(outputPath);

        console.log("Perfectly scaled image saved to", outputPath);

        // 3. Update DB
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
                ["/showcaseImages/showcase2_mcu_zero_stretch.png", imageToUpdate._id]
            );
            console.log("Showcase 2 updated to zero-stretch version.");
        }

        pool.end();
    } catch (err) {
        console.error("Error creating zero-stretch banner:", err);
    }
}

zeroStretchMCU();
