const { pool } = require('./config/db.js')

const createTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS pcb_gerber_carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        projectname VARCHAR(255),
        pcb_qty INT,
        length_cm DECIMAL(10,2),
        width_cm DECIMAL(10,2),
        base_material VARCHAR(255),
        layers VARCHAR(255),
        thickness_mm DECIMAL(10,2),
        color VARCHAR(255),
        silkscreen_color VARCHAR(255),
        surface_finish VARCHAR(255),
        copper_weight_oz VARCHAR(255),
        gerberZip VARCHAR(255),
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        confirmed_price DECIMAL(10,2) DEFAULT 0.00,
        paymentComfirmID VARCHAR(255),
        remark TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `
    try {
        await pool.query(sql)
        console.log('Table pcb_gerber_carts verified/created successfully.')
        process.exit(0)
    } catch (err) {
        console.error('Error creating table:', err.message)
        process.exit(1)
    }
}

createTable()
