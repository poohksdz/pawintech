const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db");
const deleteFile = require("../utils/fileUtils");

// @desc    Get all folios
// @route   GET /api/folios
// @access  Public
const getFolios = asyncHandler(async (req, res) => {
  try {
    // ดึงข้อมูลทั้งหมด และแปลง ID ตัวใหญ่ ให้มี _id เพื่อให้ Frontend (ที่เคยเป็น Mongo) ใช้งานต่อได้
    const [rows] = await pool.query(
      "SELECT *, ID as _id FROM folios ORDER BY ID DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error getFolios:", error);
    res.status(500).json({ message: "Error fetching folios" });
  }
});

// @desc    Get folio by ID
// @route   GET /api/folios/:id
// @access  Public
const getFolioById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT *, ID as _id FROM folios WHERE ID = ?",
      [id],
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "Folio not found" });
    }
  } catch (error) {
    console.error("Error getFolioById:", error);
    res.status(500).json({ message: "Error fetching folio" });
  }
});

// @desc    Create folio (สร้างข้อมูลตั้งต้นเปล่าๆ เพื่อให้แอดมินเข้าไปแก้ต่อ)
// @route   POST /api/folios
// @access  Private/Admin
const createFolio = asyncHandler(async (req, res) => {
  try {
    // สร้าง row เปล่าๆ โดยใส่ค่าเริ่มต้นให้แค่บางฟิลด์ที่จำเป็น
    const sql = `INSERT INTO folios (headerThaiOne, headerTextOne, imageOne, showFront) VALUES ('ผลงานใหม่', 'New Folio', '/images/sample.jpg', 0)`;
    const [result] = await pool.query(sql);

    // ดึงข้อมูลที่เพิ่งสร้างส่งกลับไปให้ Frontend ไปหน้า Edit ต่อ
    const [newFolio] = await pool.query(
      "SELECT *, ID as _id FROM folios WHERE ID = ?",
      [result.insertId],
    );
    res.status(201).json(newFolio[0]);
  } catch (error) {
    console.error("Error createFolio:", error);
    res.status(500).json({ message: "Error creating folio" });
  }
});

// @desc    Update folio (อัปเดตแบบ Dynamic รองรับคอลัมน์เยอะๆ)
// @route   PUT /api/folios/:id
// @access  Private/Admin
const updateFolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // รับข้อมูลทั้งหมดที่ Frontend ส่งมา

  // ลบ _id และ ID ออกจาก object updates เพื่อป้องกันไม่ให้ไปเผลออัปเดต Primary Key
  delete updates._id;
  delete updates.ID;
  // ถ้ามี timestamps หลุดมาก็ลบออก เพราะตารางนี้ไม่มี
  delete updates.createdAt;
  delete updates.updatedAt;

  if (Object.keys(updates).length === 0) {
    return res.json({ message: "No fields to update" });
  }

  // สร้างคำสั่ง SQL แบบอัตโนมัติตามข้อมูลที่ส่งมา (เช่น headerThaiOne = ?, imageOne = ?)
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id); // ใส่ id สำหรับ WHERE ID = ? ไว้ท้ายสุด

  try {
    const sql = `UPDATE folios SET ${fields.join(", ")} WHERE ID = ?`;
    await pool.query(sql, values);
    res.json({ message: "Folio updated successfully" });
  } catch (error) {
    console.error("Error updateFolio:", error);
    res.status(500).json({ message: "Error updating folio: " + error.message });
  }
});

// @desc    Delete folio
// @route   DELETE /api/folios/:id
// @access  Private/Admin
const deleteFolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM folios WHERE ID = ?", [id]);
    if (rows.length > 0) {
      const folio = rows[0];
      for (let i = 1; i <= 10; i++) {
        const imageKey =
          i === 1
            ? "imageOne"
            : `image${["Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][i - 2]}`;
        if (folio[imageKey]) deleteFile(folio[imageKey]);
      }
    }
    await pool.query("DELETE FROM folios WHERE ID = ?", [id]);
    res.json({ message: "Folio removed" });
  } catch (error) {
    console.error("Error deleteFolio:", error);
    res.status(500).json({ message: "Error deleting folio" });
  }
});

module.exports = {
  getFolios,
  getFolioById,
  createFolio,
  updateFolio,
  deleteFolio,
};
