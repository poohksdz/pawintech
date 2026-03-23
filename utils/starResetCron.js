const cron = require('node-cron');
const { pool } = require('../config/db.js');

const initStarResetCron = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Star Rating Auto-Reset Job...');

        try {
            const now = new Date();

            // 1. Send Warnings (87-90 days old)
            const warningThreshold = new Date();
            warningThreshold.setDate(now.getDate() - 87);

            const [warningProducts] = await pool.query(
                `SELECT id, electotronixPN, description, lastStarredAt 
         FROM tbl_product 
         WHERE isStarred = 1 
         AND lastStarredAt <= ? 
         AND starExpirationAlertSent = FALSE`,
                [warningThreshold]
            );

            for (const product of warningProducts) {
                const daysLeft = 90 - Math.floor((now - new Date(product.lastStarredAt)) / (1000 * 60 * 60 * 24));
                const message = `Star rating for product ${product.electotronixPN} (${product.description}) will reset in ${daysLeft} days.`;

                // Add to tbl_notifications for all admins
                const [admins] = await pool.query('SELECT _id FROM tbl_user WHERE isAdmin = 1');
                for (const admin of admins) {
                    await pool.query(
                        `INSERT INTO tbl_notifications (user_id, message, type, related_id) 
             VALUES (?, ?, 'star_expiration_warning', ?)`,
                        [admin._id, message, product.id]
                    );
                }

                // Mark as alert sent
                await pool.query('UPDATE tbl_product SET starExpirationAlertSent = TRUE WHERE id = ?', [product.id]);
                console.log(`📡 Warning sent for product ID ${product.id}`);
            }

            // 2. Reset Stars ( > 90 days old)
            const resetThreshold = new Date();
            resetThreshold.setDate(now.getDate() - 90);

            const [productsToReset] = await pool.query(
                `SELECT id, electotronixPN, description FROM tbl_product 
         WHERE isStarred = 1 AND lastStarredAt <= ?`,
                [resetThreshold]
            );

            for (const product of productsToReset) {
                await pool.query(
                    `UPDATE tbl_product SET 
           isStarred = 0, 
           starRating = 0, 
           lastUnstarredAt = NOW(), 
           lastUnstarredBy = 'System Auto-Reset',
           starExpirationAlertSent = FALSE 
           WHERE id = ?`,
                    [product.id]
                );

                const message = `Star rating for product ${product.electotronixPN} has been automatically reset after 3 months.`;
                const [admins] = await pool.query('SELECT _id FROM tbl_user WHERE isAdmin = 1');
                for (const admin of admins) {
                    await pool.query(
                        `INSERT INTO tbl_notifications (user_id, message, type, related_id) 
             VALUES (?, ?, 'star_reset', ?)`,
                        [admin._id, message, product.id]
                    );
                }
                console.log(`♻️ Reset stars for product ID ${product.id}`);
            }

            console.log('✅ Star Rating Auto-Reset Job completed.');
        } catch (error) {
            console.error('❌ Error in Star Rating Auto-Reset Job:', error.message);
        }
    });
};

module.exports = initStarResetCron;
