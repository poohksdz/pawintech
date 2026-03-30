const Jimp = require('jimp');
const path = require('path');
const mysql = require('mysql2/promise');

async function processAndSetImage() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\assembly_line_native_wide_1774346385808.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase3_native_wide.png');

        console.log("Reading native wide image...");
        const image = await Jimp.read(inputPath);
        console.log(`Original size: ${image.bitmap.width}x${image.bitmap.height}`);

        // First, crop a bit of the bottom to remove the watermark (approx 45 pixels)
        const cropHeight = Math.max(10, image.bitmap.height - 45);
        image.crop(0, 0, image.bitmap.width, cropHeight);
        console.log(`Cropped size (no watermark): ${image.bitmap.width}x${image.bitmap.height}`);

        // Now cleanly scale to exactly 1600x595
        // Use high quality bicubic interpolation for the resize to preserve sharpness
        console.log("Resizing to 1600x595 with high quality interpolation...");
        image.cover(1600, 595, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);

        console.log("Saving ultra HD processed image...");
        await image.writeAsync(outputPath);
        console.log("Saved to", outputPath);

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
            ['/showcaseImages/showcase3_native_wide.png']
        );
        console.log("Update database result:", result.affectedRows > 0 ? "Success" : "No changes made");

        pool.end();
    } catch (error) {
        console.error("Error processing image:", error);
    }
}

processAndSetImage();
