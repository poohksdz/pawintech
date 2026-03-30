const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function processShowcaseTwo() {
    try {
        console.log("Connecting to DB...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [existing] = await pool.query("SELECT * FROM showcase WHERE present = 'presentTwo'");
        if (existing.length === 0) {
            console.log("No presentTwo image found.");
            return;
        }

        const currentImageUri = existing[0].image;
        console.log("Existing Showcase 2 image:", currentImageUri);
        // currentImageUri likely starts with / or is a URL

        // Check if it's a URL or a local path
        let existingWidth, existingHeight;
        let localExistingPath = currentImageUri;

        // Let's assume the local existing path is in the project folder
        if (currentImageUri.startsWith('/')) {
            localExistingPath = path.join(__dirname, '..', currentImageUri);
        }

        try {
            const metadata = await sharp(localExistingPath).metadata();
            existingWidth = metadata.width;
            existingHeight = metadata.height;
            console.log(`Original image dimensions: ${existingWidth}x${existingHeight}`);
        } catch (e) {
            console.log("Existing image is a URL or unavailable locally, defaulting to 1920x800", e.message);
            existingWidth = 1920;
            existingHeight = 800;
        }

        // Process new user image
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774347215403.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu.png');

        const inputMeta = await sharp(inputPath).metadata();

        // Crop bottom ~28 pixels for watermark (1024x376 -> 1024x348)
        const cropHeight = Math.max(10, inputMeta.height - 28);

        console.log(`New image loaded. Cropping to ${inputMeta.width}x${cropHeight} and resizing to match ${existingWidth}x${existingHeight}`);

        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: inputMeta.width, height: cropHeight })
            .resize({
                width: existingWidth,
                height: existingHeight,
                kernel: sharp.kernel.lanczos3,
                fit: sharp.fit.fill
            })
            .sharpen({ sigma: 0.3 }) // very mild sharpening
            .toFile(outputPath);

        console.log("New image processed and saved to", outputPath);

        // INSERT a new record so there are exactly 2 images
        console.log("Inserting new Showcase 2 record...");
        const [insertResult] = await pool.query(`
      INSERT INTO showcase (name, image, category, nameThai, categoryThai, present, navigateLink, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
            "MCU Sourcing",
            "/showcaseImages/showcase2_mcu.png",
            "Electronics",
            "จัดหา MCU",
            "อิเล็กทรอนิกส์",
            "presentTwo",
            ""
        ]);

        console.log("Insert Success, new ID:", insertResult.insertId);
        pool.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

processShowcaseTwo();
