const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js"); //  เรียกใช้ pool

// @desc    Get user cart (ดึงตะกร้า + เช็คสต็อกจริงจากตาราง products)
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const userId = req.user._id;

  try {
    //  ทีเด็ด: ใช้ LEFT JOIN ดึงจำนวนสต็อกจริง (countInStock) และราคาปัจจุบัน มาจากตาราง products
    const sql = `
      SELECT c.*, p.countInStock as realStock, p.price as currentPrice, p.name as realName, p.image as realImage
      FROM product_carts c
      LEFT JOIN products p ON c.product_id = p._id
      WHERE c.user_id = ?
    `;
    const [results] = await pool.query(sql, [userId]);

    // จัดรูปแบบข้อมูลส่งกลับไปให้ Frontend
    const formattedCart = results.map((item) => ({
      _id: item.product_id,
      // ใช้ข้อมูลล่าสุดจากตารางสินค้า (ถ้าหาไม่เจอให้ใช้ของเดิมในตะกร้า)
      name: item.realName || item.name,
      image: item.realImage || item.image,
      price:
        item.currentPrice !== null
          ? Number(item.currentPrice)
          : Number(item.price),
      qty: item.qty,
      product: item.product_id,
      //  ใช้สต็อกจริง! ถ้าสินค้าถูกลบไปแล้วให้เป็น 0
      countInStock: item.realStock !== null ? item.realStock : 0,
    }));

    res.json({ cartItems: formattedCart });
  } catch (err) {
    console.error("❌ SQL Error (GetCart):", err.message);
    res.status(500).json({ message: "Database query failed" });
  }
});

// @desc    Update user cart (REPLACE mode - แทนที่ quantity ไม่ใช่บวกเพิ่ม)
// @route   PUT /api/cart
// @access  Private
const updateCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { cartItems } = req.body;

  try {
    if (!cartItems || cartItems.length === 0) {
      // ถ้าไม่มีสินค้าให้ลบตะกร้าทิ้ง
      await pool.query(`DELETE FROM product_carts WHERE user_id = ?`, [userId]);
      return res.json({ message: "Cart cleared", cartItems: [] });
    }

    // FIX BUG: ใช้ REPLACE mode แทน ACCUMULATE mode
    // ลบรายการเดิมทั้งหมดของ user แล้วเพิ่มใหม่ทั้งหมด (Source of Truth = Frontend state)

    // 1. ลบตะกร้าเดิมทั้งหมด
    await pool.query(`DELETE FROM product_carts WHERE user_id = ?`, [userId]);

    // 2. เพิ่มรายการใหม่ทั้งหมด (ใช้ค่า qty จาก Frontend โดยตรง)
    for (const item of cartItems) {
      const productId = item._id || item.product;
      const qty = item.qty;
      const name = item.name || "";
      const price = item.price || 0;
      const image = item.image || "";

      if (qty > 0) {
        // เพิ่มรายการใหม่ (ไม่บวกเพิ่ม)
        await pool.query(
          `INSERT INTO product_carts (user_id, product_id, name, price, qty, image) VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, productId, name, price, qty, image]
        );
      }
    }

    // ดึงตะกร้าที่อัพเดตแล้วกลับไปส่งให้ Frontend
    const [updatedCart] = await pool.query(
      `SELECT c.*, p.countInStock as realStock, p.price as currentPrice, p.name as realName, p.image as realImage
       FROM product_carts c
       LEFT JOIN products p ON c.product_id = p._id
       WHERE c.user_id = ?`,
      [userId]
    );

    const formattedCart = updatedCart.map((item) => ({
      _id: item.product_id,
      name: item.realName || item.name,
      image: item.realImage || item.image,
      price: item.currentPrice !== null ? Number(item.currentPrice) : Number(item.price),
      qty: item.qty,
      product: item.product_id,
      countInStock: item.realStock !== null ? item.realStock : 0,
    }));

    res.json({ message: "Cart updated", cartItems: formattedCart });
  } catch (err) {
    console.error("❌ SQL Error (UpdateCart):", err.message);
    res.status(500).json({ message: "Failed to save cart", error: err.message });
  }
});

module.exports = { getCart, updateCart };
