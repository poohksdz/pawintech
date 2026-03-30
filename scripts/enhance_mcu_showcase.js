const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function enhanceMCUImage() {
    try {
        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774348504171.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu_ultra_clear.png');

        console.log("Processing high-res MCU image...");

        // 1024x303. Watermark is at the bottom right.
        // Crop bottom 28 pixels to be safe.
        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: 1024, height: 275 }) // 303 - 28 = 275
            .resize({
                width: 1920,
                height: 800,
                kernel: sharp.kernel.lanczos3,
                fit: sharp.fit.fill
            })
            .sharpen({
                sigma: 1.2,
                m1: 1.0,
                m2: 2.0
            })
            .toFile(outputPath);

        console.log("Enhanced image saved to", outputPath);

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
                ["/showcaseImages/showcase2_mcu_ultra_clear.png", imageToUpdate._id]
            );
            console.log("Showcase 2 entry updated.");
        } else {
            await pool.query(`
            INSERT INTO showcase (name, image, category, nameThai, categoryThai, present, navigateLink, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
                "MCU Sourcing",
                "/showcaseImages/showcase2_mcu_ultra_clear.png",
                "Electronics",
                "จัดหา MCU",
                "อิเล็กทรอนิกส์",
                "presentTwo",
                ""
            ]);
            console.log("New Showcase 2 entry created.");
        }

        pool.end();
    } catch (err) {
        console.error("Error enhancing MCU image:", err);
    }
}

enhanceMCUImage();
