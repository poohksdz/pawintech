const Jimp = require('jimp');
const path = require('path');
const mysql = require('mysql2/promise');

async function removeWatermarkAndUpdate() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\assembly_line_ultra_clear_1774344626334.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase3_no_watermark.png');

        console.log("Reading image...");
        const image = await Jimp.read(inputPath);

        // Crop 40 pixels off the bottom to remove the watermark
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        console.log(`Original size: ${width}x${height}`);

        // The watermark is at the bottom right. Let's crop the bottom 45 pixels.
        const cropHeight = Math.max(10, height - 45);

        console.log(`Cropping to: ${width}x${cropHeight}`);
        image.crop(0, 0, width, cropHeight);

        console.log("Saving cropped image...");
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
            ['/showcaseImages/showcase3_no_watermark.png']
        );
        console.log("Update result:", result.affectedRows > 0 ? "Success" : "No changes made");

        pool.end();
    } catch (error) {
        console.error("Error:", error);
    }
}

removeWatermarkAndUpdate();
