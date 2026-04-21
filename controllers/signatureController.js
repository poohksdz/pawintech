const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db");
const path = require("path");
const fs = require("fs");

// @desc    Get all signatures for current user
// @route   GET /api/signatures
// @access  Private
const getSignatures = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const [sigs] = await pool.query(
      "SELECT * FROM user_signatures WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
    res.status(200).json(sigs);
  } catch (error) {
    console.error(`Error fetching signatures: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลลายเซ็น" });
  }
});

// @desc    Create a new signature
// @route   POST /api/signatures
// @access  Private
const createSignature = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, image_path } = req.body;

    if (!name || !image_path) {
      res.status(400);
      throw new Error("กรุณาระบุชื่อและอัพโหลดรูปsignature");
    }

    const [result] = await pool.query(
      "INSERT INTO user_signatures (user_id, name, image_path) VALUES (?, ?, ?)",
      [userId, name, image_path],
    );

    const [newSig] = await pool.query(
      "SELECT * FROM user_signatures WHERE _id = ?",
      [result.insertId],
    );

    res.status(201).json(newSig[0]);
  } catch (error) {
    console.error(`Error creating signature: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกลายเซ็น" });
  }
});

// @desc    Update a signature
// @route   PUT /api/signatures/:id
// @access  Private
const updateSignature = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, image_path } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM user_signatures WHERE _id = ? AND user_id = ?",
      [req.params.id, userId],
    );

    if (existing.length === 0) {
      res.status(404);
      throw new Error("ไม่พบลายเซ็นนี้ หรือไม่มีสิทธิ์แก้ไข");
    }

    const updateName = name || existing[0].name;
    const updateImg = image_path || existing[0].image_path;

    await pool.query(
      "UPDATE user_signatures SET name = ?, image_path = ? WHERE _id = ? AND user_id = ?",
      [updateName, updateImg, req.params.id, userId],
    );

    const [updated] = await pool.query(
      "SELECT * FROM user_signatures WHERE _id = ?",
      [req.params.id],
    );

    res.status(200).json(updated[0]);
  } catch (error) {
    console.error(`Error updating signature: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพเดตรายเซ็น" });
  }
});

// @desc    Delete a signature
// @route   DELETE /api/signatures/:id
// @access  Private
const deleteSignature = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const [existing] = await pool.query(
      "SELECT * FROM user_signatures WHERE _id = ? AND user_id = ?",
      [req.params.id, userId],
    );

    if (existing.length === 0) {
      res.status(404);
      throw new Error("ไม่พบลายเซ็นนี้ หรือไม่มีสิทธิ์ลบ");
    }

    // Delete image files (original + processed versions)
    const imgPath = existing[0].image_path;
    const dir = path.join(__dirname, "..", "uploads", "signatures");
    const basename = path.basename(imgPath);
    const nameWithoutExt = basename.replace(/\.[^.]+$/, "");
    const ext = path.extname(basename);

    // Delete all variants: sig_123.png, sig_123_crop.png, sig_123_clean.png, etc.
    try {
      const files = fs.readdirSync(dir);
      files.forEach((f) => {
        if (f.startsWith(nameWithoutExt)) {
          fs.unlinkSync(path.join(dir, f));
        }
      });
    } catch (fileErr) {
      console.log("Signature file cleanup error:", fileErr.message);
    }

    await pool.query(
      "DELETE FROM user_signatures WHERE _id = ? AND user_id = ?",
      [req.params.id, userId],
    );

    res.status(200).json({ message: "ลบลายเซ็นสำเร็จ" });
  } catch (error) {
    console.error(`Error deleting signature: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบลายเซ็น" });
  }
});

module.exports = {
  getSignatures,
  createSignature,
  updateSignature,
  deleteSignature,
};
