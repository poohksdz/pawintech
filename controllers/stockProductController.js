const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js");

// @desc    Get all stock products
// @route   GET /api/stockproducts
// @access  Public
const getStockProducts = asyncHandler(async (req, res) => {
  try {
    const [products] = await db.pool.query(
      "SELECT *, isStarred, lastStarredAt, lastUnstarredAt FROM tbl_product",
    );
    res.status(200).json({ products });
  } catch (error) {
    console.error(`Error fetching products: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single stock product by ID
// @route   GET /api/stockproducts/:id
// @access  Public
const getStockProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [product] = await db.pool.query(
      "SELECT *, isStarred, lastStarredAt, lastUnstarredAt FROM tbl_product WHERE id = ?",
      [id],
    );

    if (product.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json(product[0]);
  } catch (error) {
    console.error(`Error fetching product: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Helper to generate the next barcode (format: [CatID][SubID][Sequence])
const generateNextBarcode = async (categoryName, subcategoryName) => {
  try {
    // 1. Get Category and Subcategory IDs
    const [catRows] = await db.pool.query(
      "SELECT categoryid FROM tbl_category WHERE category = ?",
      [categoryName],
    );
    const [subRows] = await db.pool.query(
      "SELECT subcategoryID FROM tbl_subcategory WHERE subcategory = ? AND category = ?",
      [subcategoryName, categoryName],
    );

    const catId = catRows[0]?.categoryid || "0000";
    const subId = subRows[0]?.subcategoryID || "0000";
    const prefix = `${catId}${subId}`;

    // 2. Query highest identifier with this prefix across both columns to ensure continuity
    const [rows] = await db.pool.query(
      `SELECT val FROM (
        SELECT barcode as val FROM tbl_product WHERE barcode LIKE ? 
        UNION 
        SELECT electotronixPN as val FROM tbl_product WHERE electotronixPN LIKE ?
      ) as combined 
      WHERE val REGEXP '^[0-9]{12}$'
      ORDER BY val DESC LIMIT 1`,
      [`${prefix}%`, `${prefix}%`],
    );

    let nextSeq = 1;
    if (rows.length > 0 && rows[0].val && rows[0].val.length >= 12) {
      const latestSeq = parseInt(rows[0].val.slice(8)) || 0;
      nextSeq = latestSeq + 1;
    }

    const generatedID = `${prefix}${nextSeq.toString().padStart(4, "0")}`;
    console.log(`[BarcodeGen] Prefix: ${prefix}, NextSeq: ${nextSeq}, ID: ${generatedID}`);
    return generatedID;
  } catch (error) {
    console.error("Error generating barcode:", error);
    // Return a random-ish fallback ID to prevent null breaks, but ideally lookup should work
    const timestamp = Date.now().toString().slice(-12);
    console.error(`[BarcodeGen Fallback] Using timestamp: ${timestamp}`);
    return timestamp;
  }
};

// @desc    Get single stock product by Barcode
// @route   GET /api/stockproducts/barcode/:barcode
// @access  Public
const getStockProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  try {
    const [product] = await db.pool.query(
      "SELECT *, isStarred, lastStarredAt, lastUnstarredAt FROM tbl_product WHERE barcode = ?",
      [barcode],
    );

    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product[0]);
  } catch (error) {
    console.error(`Error fetching product by barcode: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new stock product
// @route   POST /api/stockproducts
// @access  Private/Stock
const createStockProduct = asyncHandler(async (req, res) => {
  const {
    electotronixPN,
    manufacturePN,
    manufacture,
    description,
    category,
    subcategory,
    footprint,
    price,
    quantity,
    position,
    supplier,
    img,
    value,
    weight,
    supplierPN,
    moq,
    spq,
    process,
    link,
    alternative,
    note,
  } = req.body;

  try {
    // Generate barcode based on Category and Subcategory IDs
    const barcode = await generateNextBarcode(category, subcategory);
    console.log(`[CreateProduct] Generated Barcode: ${barcode}`);

    // If electotronixPN is empty, blank, or "-", use barcode as the EPN
    const trimmedPN = electotronixPN ? String(electotronixPN).trim() : "";
    const finalEPN = (trimmedPN !== "" && trimmedPN !== "-")
      ? electotronixPN
      : barcode;

    console.log(`[CreateProduct] Final EPN: ${finalEPN}, Original EPN Input: ${electotronixPN}`);

    const [result] = await db.pool.query(
      `INSERT INTO tbl_product 
       (\`electotronixPN\`, \`manufacturePN\`, \`manufacture\`, \`description\`, \`category\`, \`subcategory\`, \`footprint\`, \`price\`, \`quantity\`, \`position\`, \`supplier\`, \`img\`, \`value\`, \`weight\`, \`supplierPN\`, \`moq\`, \`spq\`, \`process\`, \`link\`, \`alternative\`, \`note\`, \`barcode\`) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalEPN,
        manufacturePN,
        manufacture,
        description,
        category,
        subcategory,
        footprint,
        price,
        quantity,
        position,
        supplier,
        img,
        value,
        weight,
        supplierPN,
        moq,
        spq,
        process,
        link,
        alternative,
        note,
        barcode,
      ],
    );

    res.status(201).json({ id: result.insertId, barcode, ...req.body });
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a stock product
// @route   PUT /api/stockproducts/:id
// @access  Private/Stock
const updateStockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    electotronixPN,
    manufacturePN,
    manufacture,
    description,
    category,
    subcategory,
    footprint,
    price,
    quantity,
    position,
    supplier,
    img,
    value,
    weight,
    supplierPN,
    moq,
    spq,
    process,
    link,
    alternative,
    note,
  } = req.body;

  try {
    // Check if we need to auto-assign a barcode to Electotronix P/N
    let finalEPN = electotronixPN;
    const [currentProduct] = await db.pool.query(
      "SELECT barcode, category, subcategory FROM tbl_product WHERE ID = ?",
      [id],
    );

    const trimmedPN = electotronixPN ? String(electotronixPN).trim() : "";
    if (
      !electotronixPN ||
      trimmedPN === "" ||
      trimmedPN === "-"
    ) {
      // If PN is blank or "-", use existing barcode or generate a new one
      if (currentProduct[0]?.barcode) {
        finalEPN = currentProduct[0].barcode;
      } else {
        // Generate new barcode if product doesn't have one
        const cat = category || currentProduct[0]?.category;
        const sub = subcategory || currentProduct[0]?.subcategory;
        finalEPN = await generateNextBarcode(cat, sub);
        console.log(`[UpdateProduct] Generated New Barcode: ${finalEPN}`);
      }
    }

    console.log(`[UpdateProduct] Final EPN: ${finalEPN}, ID: ${id}`);

    await db.pool.query(
      `UPDATE tbl_product SET 
       \`electotronixPN\` = ?, \`manufacturePN\` = ?, \`manufacture\` = ?, \`description\` = ?, \`category\` = ?, 
       \`subcategory\` = ?, \`footprint\` = ?, \`price\` = ?, \`quantity\` = ?, \`position\` = ?, \`supplier\` = ?, \`img\` = ?,
       \`value\` = ?, \`weight\` = ?, \`supplierPN\` = ?, \`moq\` = ?, \`spq\` = ?, \`process\` = ?, \`link\` = ?, \`alternative\` = ?, \`note\` = ?, \`barcode\` = IFNULL(\`barcode\`, ?)
       WHERE ID = ?`,
      [
        finalEPN,
        manufacturePN,
        manufacture,
        description,
        category,
        subcategory,
        footprint,
        price,
        quantity,
        position,
        supplier,
        img,
        value,
        weight,
        supplierPN,
        moq,
        spq,
        process,
        link,
        alternative,
        note,
        finalEPN, // Ensure barcode column is also updated if it was null
        id,
      ],
    );

    res.status(200).json({ id, ...req.body });
  } catch (error) {
    console.error(`Error updating product: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a stock product
// @route   DELETE /api/stockproducts/:id
// @access  Private/Stock
const deleteStockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await db.pool.query("DELETE FROM tbl_product WHERE id = ?", [id]);
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update product quantity
// @route   PUT /api/stockproducts/updateQty/:id
// @access  Private
const updateStockProductQty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qty } = req.body;

  try {
    await db.pool.query(
      "UPDATE tbl_product SET quantity = quantity - ? WHERE id = ?",
      [qty, id],
    );
    res.status(200).json({ message: "Quantity updated" });
  } catch (error) {
    console.error(`Error updating quantity: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update product quantity by Electotronix PN
// @route   PUT /api/stockproducts/updateProductQtyByElectotronixPN/:electotronixPN
// @access  Private
const updateStockProductQtyByElectotronixPN = asyncHandler(async (req, res) => {
  const { electotronixPN } = req.params;
  const { qty } = req.body;

  try {
    await db.pool.query(
      "UPDATE tbl_product SET quantity = quantity - ? WHERE electotronixPN = ?",
      [qty, electotronixPN],
    );
    res.status(200).json({ message: "Quantity updated" });
  } catch (error) {
    console.error(`Error updating updating product: ${error.message}`);
    res.status(500);
    throw new Error("Error updating updating product");
  }
});

// @desc    Toggle star status for a product
// @route   PUT /api/stockproducts/:id/star
// @access  Private/Stock
const toggleStarProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userName = req.user?.name || "Unknown User";

  if (rating !== undefined && (rating < 0 || rating > 5)) {
    res.status(400);
    throw new Error("Rating must be between 0 and 5");
  }

  try {
    const [productRows] = await db.pool.query(
      "SELECT isStarred, starRating FROM tbl_product WHERE id = ?",
      [id],
    );

    if (productRows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const currentRating = productRows[0].starRating;
    const newRating =
      rating !== undefined ? rating : productRows[0].isStarred ? 0 : 5; // Fallback to toggle if no rating provided
    const newStarredStatus = newRating > 0 ? 1 : 0;
    const now = new Date();

    let query = "";
    let queryParams = [];

    if (newStarredStatus) {
      query =
        "UPDATE tbl_product SET isStarred = ?, starRating = ?, lastStarredAt = ?, lastStarredBy = ?, starExpirationAlertSent = FALSE WHERE id = ?";
      queryParams = [newStarredStatus, newRating, now, userName, id];
    } else {
      query =
        "UPDATE tbl_product SET isStarred = ?, starRating = ?, lastUnstarredAt = ?, lastUnstarredBy = ?, starExpirationAlertSent = FALSE WHERE id = ?";
      queryParams = [newStarredStatus, newRating, now, userName, id];
    }

    await db.pool.query(query, queryParams);

    res.status(200).json({
      message: newStarredStatus
        ? `Product rated ${newRating} stars`
        : "Product unstarred",
      isStarred: !!newStarredStatus,
      starRating: newRating,
      timestamp: now,
      userName: userName,
    });
  } catch (error) {
    console.error(`Error rating product: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getStockProducts,
  getStockProductById,
  getStockProductByBarcode,
  createStockProduct,
  updateStockProduct,
  deleteStockProduct,
  updateStockProductQty,
  updateStockProductQtyByElectotronixPN,
  toggleStarProduct,
};
