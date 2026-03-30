const sharp = require('sharp');
const path = require('path');
const mysql = require('mysql2/promise');

async function replaceShowcaseTwo() {
    try {
        console.log("Connecting to Database...");
        require('dotenv').config({ path: '../.env' });
        const pool = mysql.createPool({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "pawin_tech",
        });

        const [existing] = await pool.query("SELECT * FROM showcase WHERE present = 'presentTwo'");
        const originalImage = existing.find(i => i.image && !i.image.includes('showcase2_mcu'));
        const blurryImageToReplace = existing.find(i => i.image && i.image.includes('showcase2_mcu'));

        let targetWidth = 1920;
        let targetHeight = 800;

        if (originalImage) {
            console.log("Found original image for dimensions:", originalImage.image);
            const localOriginal = originalImage.image.startsWith('/')
                ? path.join(__dirname, '..', originalImage.image)
                : originalImage.image;

            try {
                const meta = await sharp(localOriginal).metadata();
                targetWidth = meta.width;
                targetHeight = meta.height;
                console.log(`Target Dimensions: ${targetWidth}x${targetHeight}`);
            } catch (e) {
                console.log("Could not read original image perfectly, using 1920x800 fallback.");
            }
        }

        const inputPath = "C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\f4e962cd-55e9-4361-97de-40378ba2090c\\media__1774347841160.png";
        const outputPath = path.join(__dirname, '../showcaseImages/showcase2_mcu_sharp.png');

        console.log("Reading newly uploaded image...");
        const inputMeta = await sharp(inputPath).metadata();
        console.log(`Uploaded Size: ${inputMeta.width}x${inputMeta.height}`);

        // Crop bottom ~28 pixels for watermark
        const cropHeight = Math.max(10, inputMeta.height - 28);

        console.log("Cropping and resizing using Lanczos3...");
        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: inputMeta.width, height: cropHeight })
            .resize({
                width: targetWidth,
                height: targetHeight,
                kernel: sharp.kernel.lanczos3,
                fit: sharp.fit.fill
            })
            .toFile(outputPath);

        console.log("Successfully processed and saved to", outputPath);

        if (blurryImageToReplace) {
            console.log("Replacing blurry image ID:", blurryImageToReplace._id);
            const [res] = await pool.query("UPDATE showcase SET image = '/showcaseImages/showcase2_mcu_sharp.png' WHERE _id = ?", [blurryImageToReplace._id]);
            console.log("Update Success:", res.affectedRows > 0);
        } else {
            console.log("No blurry image found to replace. Inserting a new one...");
            await pool.query(`
          INSERT INTO showcase (name, image, category, nameThai, categoryThai, present, navigateLink, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
                "MCU Sourcing",
                "/showcaseImages/showcase2_mcu_sharp.png",
                "Electronics",
                "จัดหา MCU",
                "อิเล็กทรอนิกส์",
                "presentTwo",
                ""
            ]);
        }

        pool.end();
    } catch (err) {
        console.error("Error:", err);
    }
}

replaceShowcaseTwo();
