const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js"); //  แก้เป็นบรรทัดนี้

// @desc    Get all supplier
// @route   GET /api/Stocksupplier
// @access  Private/Admin
const getStockSupplier = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_supplier ORDER BY `namesupplier` ASC",
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching supplier: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching supplier");
  }
});

// @desc    Get supplier by ID
// @route   GET /api/Stocksupplier/:id
// @access  Private/Admin
const getStockSupplierDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_supplier WHERE ID = ?",
      [id],
    );

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching supplier: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching supplier");
  }
});

// @desc    Create a new supplier
// @route   POST /api/Stocksupplier
// @access  Public
const createStockSupplier = asyncHandler(async (req, res) => {
  const { namesupplier, createuser } = req.body;

  if (!namesupplier) {
    res.status(400);
    throw new Error("Supplier name is required");
  }

  try {
    const query = `
      INSERT INTO tbl_supplier (namesupplier, createuser)
      VALUES (?, ?)
    `;
    const [result] = await db.pool.query(query, [namesupplier, createuser]);

    const supplierID = String(result.insertId).padStart(4, "0");

    await db.pool.query(`UPDATE tbl_supplier SET supplierID = ? WHERE id = ?`, [
      supplierID,
      result.insertId,
    ]);

    res.status(201).json({
      message: "Supplier created successfully",
      supplier: {
        id: result.insertId,
        supplierID,
        namesupplier,
        createuser,
      },
    });
  } catch (error) {
    console.error(`Error creating supplier: ${error.message}`);
    res.status(500);
    throw new Error("Error creating supplier");
  }
});

// @desc    Update supplier
// @route   PUT /api/Stocksupplier/:id
// @access  Private/Admin
const updateStockSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { namesupplier, createuser } = req.body;

  if (!namesupplier) {
    res.status(400);
    throw new Error("Supplier name and short name are required");
  }

  try {
    const [existingSupplier] = await db.pool.query(
      "SELECT * FROM tbl_supplier WHERE ID = ?",
      [id],
    );

    if (existingSupplier.length === 0) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    const query = `
      UPDATE tbl_supplier
      SET namesupplier = ?, createuser = ?
      WHERE ID = ?
    `;

    const [result] = await db.pool.query(query, [namesupplier, createuser, id]);

    if (result.affectedRows === 0) {
      res.status(404);
      throw new Error("No changes made to the supplier");
    }

    res.status(200).json({
      message: "Supplier updated successfully",
      supplier: {
        id,
        namesupplier,
        createuser,
      },
    });
  } catch (error) {
    console.error(`Error updating supplier: ${error.message}`);
    res.status(500);
    throw new Error("Error updating supplier");
  }
});

// @desc    Delete supplier
// @route   DELETE /api/Stocksupplier/:id
// @access  Private/Admin
const deleteStockSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [existingSupplier] = await db.pool.query(
      "SELECT * FROM tbl_supplier WHERE ID = ?",
      [id],
    );

    if (existingSupplier.length === 0) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    await db.pool.query("DELETE FROM tbl_supplier WHERE ID = ?", [id]);

    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error(`Error deleting supplier: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting supplier");
  }
});

module.exports = {
  createStockSupplier,
  updateStockSupplier,
  deleteStockSupplier,
  getStockSupplier,
  getStockSupplierDetails,
};
