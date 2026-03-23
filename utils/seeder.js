const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

/**
 * Ensures all required test users exist in the database with known credentials.
 */
const seedDatabase = async () => {
    if (process.env.NODE_ENV !== 'development') {
        console.log('⚠️ Skipping seeder: Not in development mode.');
        return;
    }

    console.log('🌱 Seeding database with test users...');

    const users = [
        { name: 'Admin User', email: 'electotronix@gmail.com', isAdmin: 1, isStaff: 1, isStore: 1, isPCBAdmin: 1 },
        { name: 'Store User', email: 'store@email.com', isAdmin: 0, isStaff: 0, isStore: 1, isPCBAdmin: 0 },
        { name: 'Staff User', email: 'staff@email.com', isAdmin: 0, isStaff: 1, isStore: 0, isPCBAdmin: 0 },
        { name: 'Customer User', email: 'customer@email.com', isAdmin: 0, isStaff: 0, isStore: 0, isPCBAdmin: 0 }
    ];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('1234', salt);

    for (const user of users) {
        try {
            // Use _id if that's the primary key, but according to db_check_output it's 'id'
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);

            if (existing.length > 0) {
                // Update existing user to ensure password and roles are correct
                await pool.query(
                    'UPDATE users SET name = ?, password = ?, isAdmin = ?, isStaff = ?, isStore = ?, isPCBAdmin = ? WHERE email = ?',
                    [user.name, hashedPassword, user.isAdmin, user.isStaff, user.isStore, user.isPCBAdmin, user.email]
                );
            } else {
                // Insert new user
                await pool.query(
                    'INSERT INTO users (name, email, password, isAdmin, isStaff, isStore, isPCBAdmin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                    [user.name, user.email, hashedPassword, user.isAdmin, user.isStaff, user.isStore, user.isPCBAdmin]
                );
            }
        } catch (error) {
            console.error(`❌ Error seeding user ${user.email}:`, error.message);
        }
    }

    console.log('✅ Database seeding complete.');
};

module.exports = { seedDatabase };
