const asyncHandler = require('../middleware/asyncHandler')
const { pool } = require('../config/db.js')
const { automateQuotation } = require('../utils/quotationAutomation')

// Auto-create table if not exists
const initDB = async () => {
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
            price DECIMAL(10,2) DEFAULT 0.00,
            confirmed_price DECIMAL(10,2) DEFAULT 0.00,
            paymentComfirmID VARCHAR(255),
            remark TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `
  try {
    await pool.query(sql)
    // Add price column if it doesn't exist for existing tables
    try {
      await pool.query('ALTER TABLE pcb_gerber_carts ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00 AFTER status')
    } catch (e) { /* ignore */ }
    console.log('pcb_gerber_carts table verified.')
  } catch (err) {
    console.error('Migration error:', err.message)
  }
}
initDB()

// Utility: Generate timestamp string
const getTimestamp = () => {
  const now = new Date()
  const YYYY = now.getFullYear()
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  const DD = String(now.getDate()).padStart(2, '0')
  const HH = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`
}

// Utility: Generate Unique Payment ID
const generateUniquePaymentConfirmID = async () => {
  const base = getTimestamp()
  let counter = 1
  let uniqueID
  let isUnique = false

  while (!isUnique) {
    const suffix = String(counter).padStart(3, '0')
    uniqueID = `PIDG-${base}${suffix}`
    const [rows] = await pool.query('SELECT id FROM pcb_gerber_carts WHERE paymentComfirmID = ?', [uniqueID])
    if (rows.length === 0) isUnique = true
    else counter++
  }
  return uniqueID
}

// @desc    Fetch all Gerber PCB Cart Orders (Admin)
// @route   GET /api/orderpcbcarts
const getOrderPCBCarts = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pcb_gerber_carts ORDER BY created_at DESC')
    res.status(200).json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Fetch single Gerber PCB Cart by ID
// @route   GET /api/orderpcbcarts/:id
const getOrderPCBCartById = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pcb_gerber_carts WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Cart item not found' })
    res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Fetch Gerber PCB Cart orders by User ID
// @route   GET /api/orderpcbcarts/user/:userId
const getOrderPCBCartByUserId = asyncHandler(async (req, res) => {
  const user_id = req.params.userId || req.user?._id

  try {
    const [rows] = await pool.query('SELECT * FROM pcb_gerber_carts WHERE user_id = ? ORDER BY created_at DESC', [user_id])
    res.status(200).json({ success: true, count: rows.length, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Create Gerber PCB Cart record
// @route   POST /api/orderpcbcarts
const createOrderPCBCart = asyncHandler(async (req, res) => {
  const {
    user_id,
    projectname,
    pcb_qty,
    length_cm,
    width_cm,
    base_material,
    layers,
    thickness_mm,
    color,
    silkscreen_color,
    surface_finish,
    copper_weight_oz,
    gerberZip,
    price,
    remark
  } = req.body

  const paymentComfirmID = await generateUniquePaymentConfirmID()

  const sql = `
        INSERT INTO pcb_gerber_carts (
            user_id, projectname, pcb_qty, length_cm, width_cm,
            base_material, layers, thickness_mm, color, silkscreen_color,
            surface_finish, copper_weight_oz, gerberZip, status, price, paymentComfirmID, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `

  const values = [
    user_id, projectname, pcb_qty, length_cm, width_cm,
    base_material, layers, thickness_mm, color, silkscreen_color,
    surface_finish, copper_weight_oz, gerberZip, price || 0, paymentComfirmID, remark || ''
  ]

  try {
    const [result] = await pool.query(sql, values)
    res.status(201).json({ success: true, message: 'Added to cart for review', id: result.insertId })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update Gerber PCB Cart Status (Admin Approve/Reject)
// @route   PUT /api/orderpcbcarts/:id/status
const updateOrderPCBCartStatus = asyncHandler(async (req, res) => {
  const { status, confirmed_price, remark } = req.body
  const { id } = req.params

  try {
    const [result] = await pool.query(
      'UPDATE pcb_gerber_carts SET status = ?, confirmed_price = ?, remark = ?, updated_at = NOW() WHERE id = ?',
      [status, confirmed_price, remark || '', id]
    )

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Cart item not found' })

    // Automation: Send quotation if status is accepted
    if (status === "accepted") {
      automateQuotation("gerber", id).catch(err => console.error("Gerber automation error:", err));
    }

    res.status(200).json({ success: true, message: 'Status updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Delete Gerber PCB Cart item
// @route   DELETE /api/orderpcbcarts/:id
const deleteOrderPCBCart = asyncHandler(async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM pcb_gerber_carts WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Cart item not found' })
    res.status(200).json({ success: true, message: 'Item removed from cart' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

module.exports = {
  getOrderPCBCarts,
  getOrderPCBCartById,
  getOrderPCBCartByUserId,
  createOrderPCBCart,
  updateOrderPCBCartStatus,
  deleteOrderPCBCart
}
