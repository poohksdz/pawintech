const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js"); //  เรียกใช้ Pool ที่สร้างไว้แล้ว

// @desc    Get all subcategory
// @route   GET /api/Stocksubcategory
// @access  Private/Admin
const getStockSubcategory = asyncHandler(async (req, res) => {
  try {
    //  ใช้ db.query ได้เลย
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_subcategory ORDER BY `subcategory` ASC",
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching subcategory: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching subcategory");
  }
});

// @desc    Get subcategory by ID
// @route   GET /api/Stocksubcategory/:id
// @access  Private/Admin
const getStockSubcategoryDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_subcategory WHERE ID = ?",
      [id],
    );

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Subcategory not found");
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching subcategory: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching subcategory");
  }
});

// @desc    Get subcategory by category
// @route   GET /api/Stocksubcategory?category=category
// @access  Private/Admin
const getStockSubcategoryByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;

  try {
    const query = "SELECT * FROM tbl_subcategory WHERE category = ?";
    const [rows] = await db.pool.query(query, [category]);

    if (rows.length === 0) {
      // res.status(404) // อาจจะไม่ต้อง throw error ถ้าไม่เจอ แค่ส่ง array ว่างกลับไป
      // throw new Error('No subcategories found for this category')
      return res.status(200).json([]);
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching subcategory: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching subcategory");
  }
});

// @desc    Create a new subcategory
// @route   POST /api/Stocksubcategory
// @access  Public
const createStockSubcategory = asyncHandler(async (req, res) => {
  const { category, subcategory, createuser } = req.body;

  if (!category || !subcategory) {
    res.status(400);
    throw new Error("Category and Subcategory are required");
  }

  try {
    const query = `
      INSERT INTO tbl_subcategory (category, subcategory, createuser)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.pool.query(query, [
      category,
      subcategory,
      createuser,
    ]);

    const subcategoryID = String(result.insertId).padStart(4, "0");

    await db.pool.query(
      `UPDATE tbl_subcategory SET subcategoryID = ? WHERE id = ?`,
      [subcategoryID, result.insertId],
    );

    res.status(201).json({
      message: "Subcategory created successfully",
      subcategory: {
        id: result.insertId,
        subcategoryID,
        category,
        subcategory,
        createuser,
      },
    });
  } catch (error) {
    console.error(`Error creating subcategory: ${error.message}`);
    res.status(500);
    throw new Error("Error creating subcategory");
  }
});

// @desc    Update subcategory
// @route   PUT /api/Stocksubcategory/:id
// @access  Private/Admin
const updateStockSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, subcategory, createuser } = req.body;

  if (!category || !subcategory) {
    res.status(400);
    throw new Error("Subcategory name and short name are required");
  }
  try {
    const [existingSubcategory] = await db.pool.query(
      "SELECT * FROM tbl_subcategory WHERE ID = ?",
      [id],
    );

    if (existingSubcategory.length === 0) {
      res.status(404);
      throw new Error("Subcategory not found");
    }

    const query = `
      UPDATE tbl_subcategory
      SET  category = ?, subcategory = ?, createuser = ?
      WHERE ID = ?
    `;

    const [result] = await db.pool.query(query, [
      category,
      subcategory,
      createuser,
      id,
    ]);

    if (result.affectedRows === 0) {
      res.status(404);
      throw new Error("No changes made to the subcategory");
    }

    res.status(200).json({
      message: "Subcategory updated successfully",
      subcategory: {
        id,
        category,
        subcategory,
        createuser,
      },
    });
  } catch (error) {
    console.error(`Error updating subcategory: ${error.message}`);
    res.status(500);
    throw new Error("Error updating subcategory");
  }
});

// @desc    Delete subcategory
// @route   DELETE /api/Stocksubcategory/:id
// @access  Private/Admin
const deleteStockSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [existingSubcategory] = await db.pool.query(
      "SELECT * FROM tbl_subcategory WHERE ID = ?",
      [id],
    );

    if (existingSubcategory.length === 0) {
      res.status(404);
      throw new Error("Subcategory not found");
    }

    await db.pool.query("DELETE FROM tbl_subcategory WHERE ID = ?", [id]);

    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error(`Error deleting subcategory: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting subcategory");
  }
});

module.exports = {
  createStockSubcategory,
  updateStockSubcategory,
  deleteStockSubcategory,
  getStockSubcategory,
  getStockSubcategoryDetails,
  getStockSubcategoryByCategory,
};
