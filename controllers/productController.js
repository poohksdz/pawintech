const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js");
const deleteFile = require("../utils/fileUtils");

// @desc    Fetch all products
const getProducts = asyncHandler(async (req, res) => {
  try {
    //  ไม่ต้อง alias id as _id แล้ว เพราะใน DB ชื่อ _id อยู่แล้ว
    const [rows] = await pool.query("SELECT * FROM products");
    res.status(200).json({ products: rows });
  } catch (error) {
    console.error(`Error fetching products: ${error.message}`);
    res.status(500).json({ message: "Error fetching products", debug: error.message, code: error.code, host: process.env.DB_HOST || "default:127.0.0.1", user: process.env.DB_USER || "default:root", db: process.env.DB_NAME || "default:pawin_tech" });
  }
});

// @desc    Fetch single product
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    //  แก้ WHERE id เป็น WHERE _id
    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching product: ${error.message}`);
    res.status(500).json({ message: "Error fetching product" });
  }
});

// @desc    Create a product
const createProduct = asyncHandler(async (req, res) => {
  // (ส่วนรับค่า req.body คงเดิม)
  const {
    productCode,
    name,
    image,
    mutipleImage,
    brand,
    category,
    description,
    datasheet,
    manual,
    price,
    countInStock,
    nameThai,
    descriptionThai,
    brandThai,
    categoryThai,
    videoLink,
  } = req.body;

  // Basic Validation
  if (!name || !productCode || price === undefined) {
    res.status(400);
    throw new Error("Please provide name, product code, and price");
  }

  if (price < 0 || countInStock < 0) {
    res.status(400);
    throw new Error("Price and stock cannot be negative");
  }

  try {
    const query = `
      INSERT INTO products (
        productCode, name, image, mutipleImage, brand, category, 
        description, datasheet, manual, rating, numReviews, price, 
        countInStock, nameThai, descriptionThai, brandThai, categoryThai, 
        reviews, videoLink, createdAt, updatedAt
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.query(query, [
      productCode,
      name,
      image,
      mutipleImage || "",
      brand,
      category,
      description,
      datasheet,
      manual,
      5,
      5,
      price || 0,
      countInStock || 0,
      nameThai,
      descriptionThai,
      brandThai,
      categoryThai,
      5,
      videoLink,
    ]);

    res.status(201).json({
      message: "Product created successfully",
      product: { ...req.body, _id: result.insertId },
    });
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    res.status(500).json({ message: "Error creating product" });
  }
});

// @desc    Update a product
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    productCode,
    name,
    image,
    mutipleImage,
    brand,
    category,
    description,
    datasheet,
    manual,
    price,
    countInStock,
    nameThai,
    descriptionThai,
    brandThai,
    categoryThai,
    videoLink,
  } = req.body;

  // Basic Validation
  if (price !== undefined && price < 0) {
    res.status(400);
    throw new Error("Price cannot be negative");
  }

  if (countInStock !== undefined && countInStock < 0) {
    res.status(400);
    throw new Error("Stock cannot be negative");
  }

  try {
    //  แก้ WHERE _id
    const query = `
      UPDATE products 
      SET 
        productCode=?, name=?, image=?, mutipleImage=?,
        brand=?, category=?, description=?, datasheet=?, manual=?, 
        price=?, countInStock=?, nameThai=?, 
        descriptionThai=?, brandThai=?, categoryThai=?, videoLink=?,
        updatedAt=NOW() 
      WHERE _id = ?`;

    await pool.query(query, [
      productCode,
      name,
      image,
      mutipleImage,
      brand,
      category,
      description,
      datasheet,
      manual,
      price,
      countInStock,
      nameThai,
      descriptionThai,
      brandThai,
      categoryThai,
      videoLink,
      id,
    ]);

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
});

// @desc    Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch product data to get file paths
    const [rows] = await pool.query(
      "SELECT image, mutipleImage, datasheet, manual FROM products WHERE _id = ?",
      [id],
    );

    if (rows.length > 0) {
      const product = rows[0];
      // 2. Delete main image
      deleteFile(product.image);

      // 3. Delete multiple images (stored as JSON string or comma-separated)
      if (product.mutipleImage) {
        try {
          const images = JSON.parse(product.mutipleImage);
          if (Array.isArray(images)) {
            images.forEach((img) => deleteFile(img.path || img));
          }
        } catch (e) {
          // Fallback for non-JSON content
          const images = product.mutipleImage.split(",");
          images.forEach((img) => deleteFile(img.trim()));
        }
      }

      // 4. Delete documents
      deleteFile(product.datasheet);
      deleteFile(product.manual);
    }

    // 5. Delete from DB
    await pool.query("DELETE FROM products WHERE _id = ?", [id]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
});

// (ฟังก์ชันอื่นๆ เช่น updateReviewsProduct, updateShowFrontProduct ก็ต้องแก้ WHERE id เป็น WHERE _id เช่นกัน)
const updateReviewsProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviews } = req.body;
  const userID = req.user._id;
  try {
    await pool.query(
      "UPDATE products SET user = ?, reviews = ? WHERE _id = ?",
      [userID, reviews, id],
    );
    res.status(200).json({ message: "Product reviews updated" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

const updateShowFrontProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { showFront } = req.body;
  try {
    await pool.query("UPDATE products SET showFront = ? WHERE _id = ?", [
      showFront,
      id,
    ]);
    res.status(200).json({ message: "Updated show front" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const product = rows[0];
    let reviews = [];

    try {
      if (product.reviews && product.reviews !== "5") {
        reviews = JSON.parse(product.reviews);
      }
      if (!Array.isArray(reviews)) reviews = [];
    } catch (e) {
      reviews = [];
    }

    const alreadyReviewed = reviews.find(
      (r) => r.user && r.user.toString() === req.user._id.toString(),
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    reviews.push(review);

    const numReviews = reviews.length;
    const avgRating =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await pool.query(
      "UPDATE products SET rating = ?, numReviews = ?, reviews = ? WHERE _id = ?",
      [avgRating, numReviews, JSON.stringify(reviews), id],
    );

    res.status(201).json({ message: "Review added" });
  } catch (error) {
    console.error(`Error adding review: ${error.message}`);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Error adding review" });
  }
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateReviewsProduct,
  updateShowFrontProduct,
  createProductReview,
};
