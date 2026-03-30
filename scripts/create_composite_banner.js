const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function createCompositeBanner() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774347841160.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu_sharp.png');

        console.log("Loading native small image...");
        const inputMeta = await sharp(inputPath).metadata();

        // 1. Crop to remove watermark (bottom 28 pixels)
        const cropHeight = Math.max(10, inputMeta.height - 28);
        const foregroundBuffer = await sharp(inputPath)
            .extract({ left: 0, top: 0, width: inputMeta.width, height: cropHeight })
            .toBuffer();

        console.log("Generating immersive blurred background...");
        // 2. Generate a 1920x800 blurred background from the same image
        const backgroundBuffer = await sharp(inputPath)
            .resize({
                width: 1920,
                height: 800,
                kernel: sharp.kernel.lanczos3,
                fit: sharp.fit.cover
            })
            .blur(25) // Heavy cinematic blur
            .modulate({ brightness: 0.4, saturation: 0.8 }) // Darken and desaturate so the center pops
            .toBuffer();

        console.log("Compositing the native image over the background...");
        // 3. Composite them together: background under, native 1:1 image perfectly centered
        await sharp(backgroundBuffer)
            .composite([{
                input: foregroundBuffer,
                gravity: 'center'
            }])
            .toFile(outputPath);

        console.log("Successfully generated premium composite banner to", outputPath);

        // 4. Update the DB for the blurry one to make sure it loads this (wait, it's overwriting the same path!)
        // I am overwriting 'showcase2_mcu_sharp.png' directly, so no DB update is strictly necessary, 
        // but I'll touch the timestamp just in case caching dictates otherwise, or just let it be.
        // Let's do a fast DB ping to force 'updatedAt' changes.
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [res] = await pool.query(
            "UPDATE showcase SET updatedAt = NOW() WHERE image LIKE '%showcase2_mcu_sharp.png%'"
        );
        console.log("Database touched for cache invalidation:", res.affectedRows > 0);
        pool.end();

    } catch (error) {
        console.error("Error building composite banner:", error);
    }
}

createCompositeBanner();
