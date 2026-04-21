const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js");

// @desc    Get all stock products
// @route   GET /api/stockproducts
// @access  Public
const getStockProducts = asyncHandler(async (req, res) => {
  try {
    const [products] = await db.pool.query(
      "SELECT * FROM tbl_product",
    );
    // Fix image paths: ensure absolute URLs so UI won't fail to load due to SPA fallback
    const fixImg = (img) => {
      if (!img || img === "-" || img === "null") return null;
      if (img.startsWith("http") || img.startsWith("/componentImages")) return img;
      return img.startsWith("/images/") ? `/componentImages${img}` : `/componentImages/${img}`;
    };

    const fixed = products.map((p) => ({
      ...p,
      img: fixImg(p.img),
    }));
    res.status(200).json({ products: fixed });
  } catch (error) {
    console.error(`Error fetching products:`, error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// @desc    Get single stock product by ID
// @route   GET /api/stockproducts/:id
// @access  Public
const getStockProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [product] = await db.pool.query(
      "SELECT * FROM tbl_product WHERE id = ?",
      [id],
    );

    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const p = product[0];
    const fixImg = (img) => {
      if (!img || img === "-" || img === "null") return null;
      if (img.startsWith("http") || img.startsWith("/componentImages")) return img;
      return img.startsWith("/images/") ? `/componentImages${img}` : `/componentImages/${img}`;
    };
    p.img = fixImg(p.img);
    res.status(200).json(p);
  } catch (error) {
    console.error(`Error fetching product ID ${id}:`, error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// Helper to generate the next barcode (format: [CatID][SubID][Sequence])
const generateNextBarcode = async (categoryName, subcategoryName) => {
  try {
    let catId = "0000";
    let subId = "0000";

    // Resolve Category ID if provided
    if (categoryName && categoryName.trim() !== "") {
      const [catRows] = await db.pool.query(
        "SELECT categoryid FROM tbl_category WHERE category = ?",
        [categoryName]
      );
      catId = catRows[0]?.categoryid || "0000";
    }

    // Resolve Subcategory ID if both category and subcategory are provided
    if (categoryName && categoryName.trim() !== "" && subcategoryName && subcategoryName.trim() !== "") {
      const [subRows] = await db.pool.query(
        "SELECT subcategoryID FROM tbl_subcategory WHERE subcategory = ? AND category = ?",
        [subcategoryName, categoryName]
      );
      subId = subRows[0]?.subcategoryID || "0000";
    } else if (subcategoryName && subcategoryName.trim() !== "") {
      // Has subcategory but no category — look it up without category filter
      const [subRows] = await db.pool.query(
        "SELECT subcategoryID FROM tbl_subcategory WHERE subcategory = ?",
        [subcategoryName]
      );
      subId = subRows[0]?.subcategoryID || "0000";
    }

    const prefix = `${String(catId).padEnd(4, "0")}${String(subId).padEnd(4, "0")}`;

    // Query highest identifier with this prefix across barcode and electotronixPN
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
      "SELECT * FROM tbl_product WHERE barcode = ?",
      [barcode],
    );

    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const p = product[0];
    const fixImg = (img) => {
      if (!img || img === "-" || img === "null") return null;
      if (img.startsWith("http") || img.startsWith("/componentImages")) return img;
      return img.startsWith("/images/") ? `/componentImages${img}` : `/componentImages/${img}`;
    };
    p.img = fixImg(p.img);
    res.status(200).json(p);
  } catch (error) {
    console.error(`Error fetching product by barcode ${barcode}:`, error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
    barcode,
  } = req.body;

  try {
    const [currentProduct] = await db.pool.query(
      "SELECT barcode, electotronixPN, category, subcategory FROM tbl_product WHERE ID = ?",
      [id],
    );

    if (currentProduct.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldCategory = currentProduct[0]?.category || "";
    const oldSubcategory = currentProduct[0]?.subcategory || "";
    const oldBarcode = currentProduct[0]?.barcode || "";
    const oldEPN = currentProduct[0]?.electotronixPN || "";

    const trimmedPN = electotronixPN ? String(electotronixPN).trim() : "";
    const trimmedBarcode = barcode ? String(barcode).trim() : "";

    // --- Determine finalBarcode ---
    let finalBarcode;

    if (trimmedBarcode !== "") {
      // User explicitly provided a barcode → use it
      finalBarcode = trimmedBarcode;
    } else {
      // Barcode field is empty → check if category changed, then generate
      const categoryChanged = category !== oldCategory;
      const subcategoryChanged = subcategory !== oldSubcategory;

      if (categoryChanged || subcategoryChanged) {
        const cat = category !== undefined ? category : oldCategory;
        const sub = subcategory !== undefined ? subcategory : oldSubcategory;
        finalBarcode = await generateNextBarcode(cat, sub);
        console.log(`[UpdateProduct] Category/Sub changed — Barcode regenerated: ${finalBarcode}`);
      } else if (oldBarcode) {
        finalBarcode = oldBarcode;
      } else {
        // Old barcode was also empty → generate a new one
        const cat = category !== undefined ? category : oldCategory;
        const sub = subcategory !== undefined ? subcategory : oldSubcategory;
        finalBarcode = await generateNextBarcode(cat, sub);
        console.log(`[UpdateProduct] Generated New Barcode (was empty): ${finalBarcode}`);
      }
    }

    // --- Determine finalEPN ---
    let finalEPN;

    if (trimmedPN !== "" && trimmedPN !== "-") {
      // User provided an EPN → use it
      finalEPN = trimmedPN;
    } else if (oldEPN && oldEPN !== "-" && oldEPN !== oldBarcode) {
      // Keep the old EPN if it was meaningful (not just the old barcode)
      finalEPN = oldEPN;
    } else {
      // Fall back to the barcode
      finalEPN = finalBarcode;
    }

    console.log(`[UpdateProduct] Final EPN: ${finalEPN}, Barcode: ${finalBarcode}, ID: ${id}`);

    await db.pool.query(
      `UPDATE tbl_product SET
       \`electotronixPN\` = ?, \`manufacturePN\` = ?, \`manufacture\` = ?, \`description\` = ?, \`category\` = ?,
       \`subcategory\` = ?, \`footprint\` = ?, \`price\` = ?, \`quantity\` = ?, \`position\` = ?, \`supplier\` = ?, \`img\` = ?,
       \`value\` = ?, \`weight\` = ?, \`supplierPN\` = ?, \`moq\` = ?, \`spq\` = ?, \`process\` = ?, \`link\` = ?, \`alternative\` = ?, \`note\` = ?, \`barcode\` = ?
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
        finalBarcode,
        id,
      ],
    );

    res.status(200).json({ id, barcode: finalBarcode, electotronixPN: finalEPN, ...req.body });
  } catch (error) {
    console.error(`Error updating product ID ${id}:`, error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
const rateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userName = req.user?.name || "Unknown User";
  const userId = req.user?._id || req.user?.id;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  try {
    const [productRows] = await db.pool.query(
      "SELECT totalRating, ratingCount, starRating, isStarred FROM tbl_product WHERE id = ?",
      [id],
    );

    if (productRows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const product = productRows[0];
    const prevTotalRating = product.totalRating || 0;
    const prevRatingCount = product.ratingCount || 0;
    const prevAvgRating = product.starRating || 0;
    const now = new Date();

    // คำนวณคะแนนเฉลี่ยใหม่
    const newTotalRating = prevTotalRating + rating;
    const newRatingCount = prevRatingCount + 1;
    const newAvgRating = parseFloat((newTotalRating / newRatingCount).toFixed(1));

    // ตรวจสอบว่าดาวขึ้นหรือลง
    let ratingChange = "";
    if (newAvgRating > prevAvgRating) {
      ratingChange = "increased";
    } else if (newAvgRating < prevAvgRating) {
      ratingChange = "decreased";
    } else if (prevRatingCount === 0) {
      ratingChange = "first_time";
    }

    const isStarred = newAvgRating > 0 ? 1 : 0;

    await db.pool.query(
      "UPDATE tbl_product SET totalRating = ?, ratingCount = ?, starRating = ?, isStarred = ?, lastStarredAt = ?, lastStarredBy = ?, lastRatingChange = ?, starExpirationAlertSent = FALSE WHERE id = ?",
      [newTotalRating, newRatingCount, newAvgRating, isStarred, now, userName, ratingChange, id],
    );

    // สร้างแจ้งเตือนเมื่อมีการให้ดาว
    if (userId) {
      const changeText = ratingChange === "increased" ? "คะแนนเพิ่มขึ้น" : ratingChange === "decreased" ? "คะแนนลดลง" : ratingChange === "first_time" ? "ให้คะแนนครั้งแรก" : "";
      await db.pool.query(
        "INSERT INTO tbl_notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)",
        [
          userId,
          `${userName} ให้คะแนนสินค้า ID ${id} → ${rating} ดาว (เฉลี่ย ${newAvgRating} ดาว จาก ${newRatingCount} คน)`,
          "star_rating",
          id,
        ],
      );
    }

    res.status(200).json({
      message: `ให้คะแนน ${rating} ดาวสำเร็จ (เฉลี่ย ${newAvgRating} จาก ${newRatingCount} คน)`,
      isStarred: !!isStarred,
      starRating: newAvgRating,
      ratingCount: newRatingCount,
      ratingChange,
      timestamp: now,
      userName: userName,
    });
  } catch (error) {
    console.error(`Error rating product: ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
  rateProduct,
};
