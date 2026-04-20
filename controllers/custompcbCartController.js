const asyncHandler = require('../middleware/asyncHandler')
const { pool } = require('../config/db.js')
const { automateQuotation } = require('../utils/quotationAutomation')

// Helper: Fix image paths for diagram images
// DB stores paths like "/images-xxx.jpg" or "image-xxx.jpg" but files live under /custompcbImages/
const fixCartImagePaths = (row) => {
  const fixed = { ...row };
  for (let i = 1; i <= 10; i++) {
    const key = `dirgram_image_${i}`;
    const val = fixed[key];
    if (val && typeof val === 'string' && !val.startsWith('/custompcbImages') && !val.startsWith('http')) {
      fixed[key] = val.startsWith('/') ? `/custompcbImages${val}` : `/custompcbImages/${val}`;
    }
  }
  // Also fix zip path
  if (fixed.dirgram_zip && typeof fixed.dirgram_zip === 'string' && !fixed.dirgram_zip.startsWith('/custompcbImages') && !fixed.dirgram_zip.startsWith('http')) {
    fixed.dirgram_zip = fixed.dirgram_zip.startsWith('/') ? `/custompcbImages${fixed.dirgram_zip}` : `/custompcbImages/${fixed.dirgram_zip}`;
  }
  return fixed;
};

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
    uniqueID = `PIDP-${base}${suffix}`
    const [rows] = await pool.query('SELECT id FROM pcb_custom_carts WHERE paymentComfirmID = ?', [uniqueID])
    if (rows.length === 0) isUnique = true
    else counter++
  }
  return uniqueID
}

// @desc    Fetch all PCB Custom Cart Orders
const getCustomCartPCBs = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pcb_custom_carts ORDER BY created_at DESC')
    res.status(200).json({ success: true, data: rows.map(fixCartImagePaths) })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Fetch single PCB Custom Cart by ID
const getCustomCartPCBById = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pcb_custom_carts WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' })
    res.status(200).json({ success: true, data: fixCartImagePaths(rows[0]) })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Fetch PCB Custom Cart orders by User ID
const getCustomCartPCBByUserId = asyncHandler(async (req, res) => {
  const user_id = req.params.userId || req.user?._id

  try {
    const [rows] = await pool.query('SELECT * FROM pcb_custom_carts WHERE user_id = ? ORDER BY created_at DESC', [user_id])
    res.status(200).json({ success: true, count: rows.length, data: rows.map(fixCartImagePaths) })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Fetch PCB Custom Cart orders by accepted status
const getCustomCartPCBByaccepted = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pcb_custom_carts WHERE status = ? ORDER BY created_at DESC', ['accepted'])
    res.status(200).json({ success: true, count: rows.length, data: rows.map(fixCartImagePaths) })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Create a new PCB Custom Cart Order
const createCustomCartPCB = asyncHandler(async (req, res) => {
  // 🔥 จุดสำคัญ: ดักจับตัวแปรทุกรูปแบบที่ Frontend อาจจะส่งมา
  const projectname = req.body.projectname || req.body.projectName || 'Untitled Project';
  const user_id = req.body.user_id || req.body.userId;
  const pcb_qty = req.body.pcb_qty || req.body.pcbQty || req.body.qty || 1; // 👈 ป้องกันค่าเป็น 0
  const notes = req.body.notes || '';
  const dirgram_zip = req.body.dirgram_zip || req.body.diagram_zip || null;
  const diagramImages = req.body.diagramImages || [];

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'Missing User ID' })
  }

  try {
    const images = Array.isArray(diagramImages) ? diagramImages : []
    while (images.length < 10) images.push(null)

    const sql = `
      INSERT INTO pcb_custom_carts
      (
        projectname, user_id, pcb_qty, notes, dirgram_zip,
        dirgram_image_1, dirgram_image_2, dirgram_image_3, dirgram_image_4, dirgram_image_5,
        dirgram_image_6, dirgram_image_7, dirgram_image_8, dirgram_image_9, dirgram_image_10,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `

    const values = [
      projectname, user_id, pcb_qty, notes, dirgram_zip,
      ...images.slice(0, 10)
    ]

    const [result] = await pool.query(sql, values)

    res.status(201).json({
      success: true,
      message: 'PCB custom cart order created',
      insertedId: result.insertId,
    })
  } catch (error) {
    console.error('Create Error:', error)
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update a PCB Custom Cart Order by ID
const updateCustomCartPCB = asyncHandler(async (req, res) => {
  const id = req.params.id
  const data = req.body

  try {
    // 🔥 ระบบอัปเดตแบบ Dynamic: อัปเดตเฉพาะค่าที่มีส่งมา ป้องกันการเอา 0 ไปทับค่าเดิม
    let fields = []
    let params = []

    const allowedFields = {
      projectname: data.projectname || data.projectName,
      pcb_qty: data.pcb_qty || data.pcbQty || data.qty,
      notes: data.notes,
      dirgram_zip: data.dirgram_zip || data.diagram_zip,
      dirgram_image_1: data.dirgram_image_1 || data.diagram_image_1,
      dirgram_image_2: data.dirgram_image_2 || data.diagram_image_2,
      dirgram_image_3: data.dirgram_image_3 || data.diagram_image_3,
      dirgram_image_4: data.dirgram_image_4 || data.diagram_image_4,
      dirgram_image_5: data.dirgram_image_5 || data.diagram_image_5,
      dirgram_image_6: data.dirgram_image_6 || data.diagram_image_6,
      dirgram_image_7: data.dirgram_image_7 || data.diagram_image_7,
      dirgram_image_8: data.dirgram_image_8 || data.diagram_image_8,
      dirgram_image_9: data.dirgram_image_9 || data.diagram_image_9,
      dirgram_image_10: data.dirgram_image_10 || data.diagram_image_10,
    }

    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined && value !== null) {
        fields.push(`${key}=?`)
        params.push(value)
      }
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' })

    fields.push('updated_at=NOW()')
    params.push(id)

    const sql = `UPDATE pcb_custom_carts SET ${fields.join(', ')} WHERE id=?`
    await pool.query(sql, params)

    res.status(200).json({ success: true, message: 'Order updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update Amount (Set qty to 0 - ใช้ตอนจะยกเลิกหรือล้างตะกร้า)
const updateAmountCustomCartPCBById = asyncHandler(async (req, res) => {
  try {
    await pool.query('UPDATE pcb_custom_carts SET pcb_qty = 0 WHERE id = ?', [req.params.id])
    res.status(200).json({ success: true, message: 'Quantity set to 0' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update Status
const updateStatusCustomCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params
  let bodyData = req.body.data || req.body

  const { status, confirmed_price, confirmed_reason } = bodyData

  try {
    let updateFields = []
    let values = []

    if (status !== undefined) { updateFields.push('status=?'); values.push(status); }
    if (confirmed_price !== undefined) { updateFields.push('confirmed_price=?'); values.push(confirmed_price); }
    if (confirmed_reason !== undefined) { updateFields.push('confirmed_reason=?'); values.push(confirmed_reason); }

    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' })

    values.push(id)
    const sql = `UPDATE pcb_custom_carts SET ${updateFields.join(', ')}, updated_at=NOW() WHERE id = ?`

    await pool.query(sql, values)

    if (status === "accepted") {
      automateQuotation("custom", id).catch(err => console.error("Custom automation error:", err));
    }

    res.status(200).json({ success: true, message: 'Status updated' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update Delivery Info
const updateDeliveryCustomCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { transferedNumber } = req.body

  try {
    const sql = `UPDATE pcb_custom_carts SET isDelivered=1, deliveryOn=NOW(), deliveryID=?, transferedNumber=? WHERE id=?`
    await pool.query(sql, [transferedNumber, transferedNumber, id])
    res.json({ message: 'Order marked as delivered' })
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update Shipping Info
const updateShippingCustomCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userName, userEmail, shippingaddress = {}, billingaddress = {} } = req.body

  try {
    const sql = `
      UPDATE pcb_custom_carts SET
        shippingName=?, shippingAddress=?, shippingCity=?, shippingPostalCode=?, shippingCountry=?, shippingPhone=?, receivePlace=?,
        billingName=?, billinggAddress=?, billingCity=?, billingPostalCode=?, billingCountry=?, billingPhone=?, billingTax=?,
        userName=?, userEmail=?
      WHERE id=?
    `
    const values = [
      shippingaddress.shippingname, shippingaddress.address, shippingaddress.city, shippingaddress.postalCode, shippingaddress.country, shippingaddress.phone, shippingaddress.receivePlace,
      billingaddress.billingName, billingaddress.billinggAddress, billingaddress.billingCity, billingaddress.billingPostalCode, billingaddress.billingCountry, billingaddress.billingPhone, billingaddress.tax,
      userName, userEmail, id
    ]

    await pool.query(sql, values)
    res.status(200).json({ success: true, message: 'Shipping info updated' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Update Payment Info
const updatePaymentCustomCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { transferedAmount, transferedName, paymentSlip, transferedDate } = req.body

  try {
    const paymentComfirmID = await generateUniquePaymentConfirmID()
    const sql = `
      UPDATE pcb_custom_carts SET 
        transferedAmount=?, transferedName=?, paymentSlip=?, transferedDate=?, paymentComfirmID=?
      WHERE id=?
    `
    await pool.query(sql, [transferedAmount, transferedName, paymentSlip, transferedDate, paymentComfirmID, id])
    res.status(200).json({ success: true, message: 'Payment updated', paymentComfirmID })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

// @desc    Delete Order
const deleteCustomCartPCB = asyncHandler(async (req, res) => {
  try {
    await pool.query('DELETE FROM pcb_custom_carts WHERE id = ?', [req.params.id])
    res.status(200).json({ success: true, message: 'Order deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" })
  }
})

module.exports = {
  getCustomCartPCBs,
  getCustomCartPCBById,
  createCustomCartPCB,
  updateCustomCartPCB,
  deleteCustomCartPCB,
  getCustomCartPCBByUserId,
  updateAmountCustomCartPCBById,
  updateStatusCustomCartPCBById,
  updateShippingCustomCartPCBById,
  updatePaymentCustomCartPCBById,
  updateDeliveryCustomCartPCBById,
  getCustomCartPCBByaccepted,
}