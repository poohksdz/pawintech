const Jimp = require('jimp');
const path = require('path');
const mysql = require('mysql2/promise');

async function processUserImage() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774346578388.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase3_final.png');

        console.log("Reading user provided image...");
        const image = await Jimp.read(inputPath);
        console.log(`Original size: ${image.bitmap.width}x${image.bitmap.height}`);

        // 1. Crop the bottom to remove the watermark
        // Assuming the watermark takes about 25-30 pixels at the bottom right.
        const cropHeight = image.bitmap.height - 28;
        console.log(`Cropping to remove watermark: ${image.bitmap.width}x${cropHeight}`);
        image.crop(0, 0, image.bitmap.width, cropHeight);

        // 2. Resize to 1600x595 (stretching to the edges as requested) using high-quality bicubic interpolation
        console.log("Stretching/Resizing to exactly 1600x595...");
        image.resize(1600, 595, Jimp.RESIZE_BICUBIC);

        // Save image
        await image.writeAsync(outputPath);
        console.log("Successfully saved final image to", outputPath);

        // 3. Update Database
        console.log("Updating database to point to the final image...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [result] = await pool.query(
            "UPDATE showcase SET image = ? WHERE present = 'presentThree'",
            ['/showcaseImages/showcase3_final.png']
        );
        console.log("Database update result:", result.affectedRows > 0 ? "Success" : "No changes made");

        pool.end();
    } catch (error) {
        console.error("Error processing user image:", error);
    }
}

processUserImage();
