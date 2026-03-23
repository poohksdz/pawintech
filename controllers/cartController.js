const asyncHandler = require('../middleware/asyncHandler')
const { pool } = require('../config/db.js') // ✅ เรียกใช้ pool

// @desc    Get user cart (ดึงตะกร้า + เช็คสต็อกจริงจากตาราง products)
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
     return res.status(401).json({ message: 'Not authorized' })
  }

  const userId = req.user._id

  try {
    // 🔥 ทีเด็ด: ใช้ LEFT JOIN ดึงจำนวนสต็อกจริง (countInStock) และราคาปัจจุบัน มาจากตาราง products
    const sql = `
      SELECT c.*, p.countInStock as realStock, p.price as currentPrice, p.name as realName, p.image as realImage
      FROM product_carts c
      LEFT JOIN products p ON c.product_id = p._id
      WHERE c.user_id = ?
    `
    const [results] = await pool.query(sql, [userId])

    // จัดรูปแบบข้อมูลส่งกลับไปให้ Frontend
    const formattedCart = results.map(item => ({
        _id: item.product_id,
        // ใช้ข้อมูลล่าสุดจากตารางสินค้า (ถ้าหาไม่เจอให้ใช้ของเดิมในตะกร้า)
        name: item.realName || item.name,
        image: item.realImage || item.image,
        price: item.currentPrice !== null ? Number(item.currentPrice) : Number(item.price),
        qty: item.qty,
        product: item.product_id,
        // ✅ ใช้สต็อกจริง! ถ้าสินค้าถูกลบไปแล้วให้เป็น 0
        countInStock: item.realStock !== null ? item.realStock : 0 
    }))

    res.json({ cartItems: formattedCart })
  } catch (err) {
    console.error("❌ SQL Error (GetCart):", err.message)
    res.status(500).json({ message: 'Database query failed' })
  }
})

// @desc    Update user cart
// @route   PUT /api/cart
// @access  Private
const updateCart = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const { cartItems } = req.body

  try {
    // 1. ลบของเก่าออกให้หมดก่อน (Sync)
    await pool.query(`DELETE FROM product_carts WHERE user_id = ?`, [userId])

    if (!cartItems || cartItems.length === 0) {
        return res.json({ message: 'Cart cleared', cartItems: [] })
    }

    // 2. เตรียมข้อมูลสำหรับ Insert (บันทึกแค่ข้อมูลจำเป็น ไม่ต้องบันทึก countInStock)
    const cleanItems = cartItems.map(item => [
         userId, 
         item._id || item.product, 
         item.name,
         item.price,
         item.qty,
         item.image
    ])

    // 3. บันทึกข้อมูลลงตาราง (สังเกตว่าไม่ต้องมี countInStock)
    const insertSql = `
        INSERT INTO product_carts (user_id, product_id, name, price, qty, image) 
        VALUES ?
    `
    await pool.query(insertSql, [cleanItems])

    res.json({ message: 'Cart updated', cartItems })

  } catch (err) {
    console.error("❌ SQL Error (UpdateCart):", err.message)
    res.status(500).json({ message: 'Failed to save cart', error: err.message })
  }
})

module.exports = { getCart, updateCart }