const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function enhanceImage() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774346578388.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase3_sharp.png');

        console.log("Loading user image with Sharp...");

        // 1. Crop out the watermark (1024x376 -> 1024x348)
        // 2. Resize using high quality Lanczos3
        // 3. Very mild sharp for natural clarity
        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: 1024, height: 348 })
            .resize({
                width: 1600,
                height: 595,
                kernel: sharp.kernel.lanczos3, // Highest quality resampling
                fit: sharp.fit.fill          // Stretch to exact dimensions
            })
            .sharpen({
                sigma: 0.3 // Extremely mild sharpening just to preserve natural edges
            })
            .toFile(outputPath);

        console.log("Successfully refined and saved to", outputPath);

        // Update Database
        console.log("Updating DB...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [result] = await pool.query(
            "UPDATE showcase SET image = ? WHERE present = 'presentThree'",
            ['/showcaseImages/showcase3_sharp.png']
        );
        console.log("Database update result:", result.affectedRows > 0 ? "Success" : "No changes made");

        pool.end();
    } catch (error) {
        console.error("Error enhancing image:", error);
    }
}

enhanceImage();
