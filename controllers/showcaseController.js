const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js"); //  เรียกใช้ pool
const deleteFile = require("../utils/fileUtils");

// @desc    Fetch all Showcases
// @route   GET /api/showcases
// @access  Public
const getShowcases = asyncHandler(async (req, res) => {
  try {
    //  เลือกจากตาราง 'showcase' (เอกพจน์)
    // ไม่ต้อง alias id as _id แล้ว เพราะใน DB ชื่อ _id อยู่แล้ว
    const [rows] = await pool.query("SELECT * FROM showcase");
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching showcases: ${error.message}`);
    res.status(500).json({ message: "Unable to fetch showcases" });
  }
});

// @desc    Fetch single Showcase
// @route   GET /api/showcases/:id
// @access  Public
const getShowcaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    //  แก้ WHERE id เป็น WHERE _id (ให้ตรงกับ Database)
    const [rows] = await pool.query("SELECT * FROM showcase WHERE _id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ message: `Showcase with ID ${id} not found` });
    } else {
      res.status(200).json(rows[0]);
    }
  } catch (error) {
    console.error(`Error fetching showcase by ID: ${error.message}`);
    res.status(500).json({ message: "Unable to fetch showcase" });
  }
});

// @desc    Create a showcase
// @route   POST /api/showcases
// @access  Private/Admin
const createShowcase = asyncHandler(async (req, res) => {
  const {
    name,
    image,
    category,
    nameThai,
    categoryThai,
    present,
    navigateLink,
  } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error("Name and category are required");
  }

  try {
    const query = `
      INSERT INTO showcase (name, image, category, nameThai, categoryThai, present, navigateLink, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
    `;

    const [result] = await pool.query(query, [
      name,
      image,
      category,
      nameThai,
      categoryThai,
      present,
      navigateLink,
    ]);

    res.status(201).json({
      message: "Showcase created successfully",
      showcase: {
        _id: result.insertId, //  ส่งคืน _id
        name,
        image,
        category,
        nameThai,
        categoryThai,
        present,
        navigateLink,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error creating showcase: ${error.message}`);
    res.status(500);
    throw new Error("Error creating showcase");
  }
});

// @desc    Update a showcase
// @route   PUT /api/showcases/:id
// @access  Private/Admin
const updateShowcase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    image,
    category,
    nameThai,
    categoryThai,
    present,
    navigateLink,
  } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error("Name and category are required");
  }

  try {
    //  แก้ WHERE _id
    const [existingShowcase] = await pool.query(
      "SELECT * FROM showcase WHERE _id = ?",
      [id],
    );

    if (existingShowcase.length === 0) {
      res.status(404);
      throw new Error(`Showcase not found`);
    }

    //  แก้ WHERE _id
    const query = `
      UPDATE showcase
      SET name = ?, image = ?, category = ?, nameThai = ?, categoryThai = ?, present = ?, navigateLink = ?, updatedAt = NOW()
      WHERE _id = ?;
    `;

    const [result] = await pool.query(query, [
      name,
      image,
      category,
      nameThai,
      categoryThai,
      present,
      navigateLink,
      id,
    ]);

    res.status(200).json({
      message: "Showcase updated successfully",
      showcase: {
        _id: id, //  ส่งคืน _id
        name,
        image,
        category,
        nameThai,
        categoryThai,
        present,
        navigateLink,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error updating showcase: ${error.message}`);
    res.status(500);
    throw new Error("Error updating showcase");
  }
});

// @desc    Delete a showcase
// @route   DELETE /api/showcases/:id
// @access  Private/Admin
const deleteShowcase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    //  แก้ WHERE _id
    const [existingShowcase] = await pool.query(
      "SELECT * FROM showcase WHERE _id = ?",
      [id],
    );

    if (existingShowcase.length === 0) {
      res.status(404);
      throw new Error(`Showcase with ID ${id} not found`);
    }

    //  ลบไฟล์ภาพออกจากเครื่อง
    if (existingShowcase[0].image) {
      deleteFile(existingShowcase[0].image);
    }

    //  แก้ WHERE _id
    const query = "DELETE FROM showcase WHERE _id = ?";
    await pool.query(query, [id]);

    res.status(200).json({ message: `Showcase deleted successfully` });
  } catch (error) {
    console.error(`Error deleting showcase: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting showcase");
  }
});

// @desc    Update a showcase Order
// @route   PUT /api/showcases/orderpresent/:id
// @access  Private/Admin
const updateOrderPresentShowcase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { present, displayOrder } = req.body;

  if (present == null) {
    displayOrder = 0;
  }

  try {
    //  แก้ WHERE _id
    const [existingShowcase] = await pool.query(
      "SELECT * FROM showcase WHERE _id = ?",
      [id],
    );

    if (existingShowcase.length === 0) {
      res.status(404);
      throw new Error(`Showcase not found`);
    }

    //  แก้ WHERE _id
    const query = `
      UPDATE showcase
      SET present = ?, displayOrder = ?, updatedAt = NOW()
      WHERE _id = ?;
    `;

    await pool.query(query, [present, displayOrder, id]);

    res.status(200).json({
      message: "Showcase updated successfully",
      showcase: {
        _id: id,
        present,
        displayOrder,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error updating showcase: ${error.message}`);
    res.status(500);
    throw new Error("Error updating showcase");
  }
});

module.exports = {
  getShowcases,
  getShowcaseById,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  updateOrderPresentShowcase,
};
