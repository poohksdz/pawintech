const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");

const getProducts = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "";

    if (search) {
      whereClause += " AND (name LIKE ? OR nameThai LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += " AND category = ?";
      params.push(category);
    }

    if (minPrice) {
      whereClause += " AND price >= ?";
      params.push(minPrice);
    }

    if (maxPrice) {
      whereClause += " AND price <= ?";
      params.push(maxPrice);
    }

    const validSortColumns = [
      "createdAt",
      "price",
      "name",
      "rating",
      "numReviews",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products WHERE 1=1 ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM products WHERE 1=1 ${whereClause} ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    // Parse reviews JSON for each product
    const products = rows.map((product) => {
      if (Buffer.isBuffer(product.reviews)) {
        product.reviews = JSON.parse(product.reviews.toString("utf8") || "[]");
      } else if (typeof product.reviews === "string") {
        try {
          product.reviews = JSON.parse(product.reviews);
        } catch (e) {
          product.reviews = [];
        }
      }
      return product;
    });

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

const getProductById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const product = rows[0];

    // Parse reviews JSON
    if (Buffer.isBuffer(product.reviews)) {
      product.reviews = JSON.parse(product.reviews.toString("utf8") || "[]");
    } else if (typeof product.reviews === "string") {
      try {
        product.reviews = JSON.parse(product.reviews);
      } catch (e) {
        product.reviews = [];
      }
    }

    // Parse images JSON
    if (Buffer.isBuffer(product.images)) {
      product.images = JSON.parse(product.images.toString("utf8") || "[]");
    } else if (typeof product.images === "string") {
      try {
        product.images = JSON.parse(product.images);
      } catch (e) {
        product.images = [];
      }
    }

    res.json(product);
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
});

const createProduct = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      nameThai,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
      featured,
      showOnFront,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, nameThai, price, description, image, brand, category, countInStock, featured, showOnFront, rating, numReviews, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        nameThai || "",
        price,
        description || "",
        image || "",
        brand || "",
        category || "",
        countInStock || 0,
        featured || false,
        showOnFront || false,
        0,
        0,
        "[]",
      ]
    );

    res.status(201).json({ _id: result.insertId, ...req.body });
  } catch (error) {
    console.error("Error in createProduct:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.createdAt;

    // Handle images array
    if (Array.isArray(updates.images)) {
      updates.images = JSON.stringify(updates.images);
    }

    // Handle reviews array
    if (typeof updates.reviews === "object") {
      updates.reviews = JSON.stringify(updates.reviews);
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const [result] = await pool.query(
      `UPDATE products SET ${setClause} WHERE _id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM products WHERE _id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product removed" });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

const updateReviewsProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reviews } = req.body;

    if (typeof reviews !== "object") {
      return res.status(400).json({ message: "Invalid reviews format" });
    }

    const reviewsJson = JSON.stringify(reviews);
    await pool.query("UPDATE products SET reviews = ? WHERE _id = ?", [
      reviewsJson,
      id,
    ]);

    res.json({ message: "Reviews updated successfully" });
  } catch (error) {
    console.error("Error in updateReviewsProduct:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

const updateShowFrontProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { showOnFront } = req.body;

    await pool.query("UPDATE products SET showOnFront = ? WHERE _id = ?", [
      showOnFront,
      id,
    ]);

    res.json({ message: "Show on front updated successfully" });
  } catch (error) {
    console.error("Error in updateShowFrontProduct:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Create product review with image support
const createProductReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    if (!rating || !comment) {
      res.status(400);
      throw new Error("Rating and comment are required");
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const product = rows[0];
    let reviews = [];
    let reviewsStr = product.reviews;

    // Handle Buffer type (MySQL returns JSON as Buffer)
    if (Buffer.isBuffer(product.reviews)) {
      reviewsStr = product.reviews.toString("utf8");
    }

    try {
      if (reviewsStr && reviewsStr !== "5" && reviewsStr !== 5 && reviewsStr !== 0) {
        if (typeof reviewsStr === "string") {
          reviews = JSON.parse(reviewsStr);
        }
      }
      if (!Array.isArray(reviews)) reviews = [];
    } catch (e) {
      reviews = [];
    }

    // Check if user already reviewed
    const alreadyReviewed = reviews.find(
      (r) => r.user && r.user.toString() === req.user._id.toString()
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
      images: images || [], // Support for multiple images
    };

    reviews.push(review);

    const numReviews = reviews.length;
    const avgRating =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    const reviewsJson = JSON.stringify(reviews);

    await pool.query(
      "UPDATE products SET rating = ?, numReviews = ?, reviews = ? WHERE _id = ?",
      [avgRating, numReviews, reviewsJson, id]
    );

    res.status(201).json({ message: "Review added", review });
  } catch (error) {
    console.error(`Error adding review: ${error.message}`);
    res
      .status(error.status || 500)
      .json({ message: "เกิดข้อผิดพลาดในการเพิ่มรีวิว" });
  }
});

// Update product review
const updateProductReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewId, rating, comment, images } = req.body;

    if (!reviewId) {
      res.status(400);
      throw new Error("Review ID is required");
    }

    if (!rating || !comment) {
      res.status(400);
      throw new Error("Rating and comment are required");
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const product = rows[0];
    let reviews = [];
    let reviewsStr = product.reviews;

    // Handle Buffer type
    if (Buffer.isBuffer(product.reviews)) {
      reviewsStr = product.reviews.toString("utf8");
    }

    try {
      if (reviewsStr && reviewsStr !== "5" && reviewsStr !== 5 && reviewsStr !== 0) {
        if (typeof reviewsStr === "string") {
          reviews = JSON.parse(reviewsStr);
        }
      }
      if (!Array.isArray(reviews)) reviews = [];
    } catch (e) {
      reviews = [];
    }

    // Find and update the review
    const reviewIndex = reviews.findIndex(
      (r) =>
        r._id === reviewId && r.user && r.user.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
      res.status(404);
      throw new Error("Review not found or you don't have permission to edit");
    }

    // Update review fields
    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      rating: Number(rating),
      comment,
      images: images !== undefined ? images : reviews[reviewIndex].images || [],
      updatedAt: new Date().toISOString(),
    };

    const numReviews = reviews.length;
    const avgRating =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    const reviewsJson = JSON.stringify(reviews);

    await pool.query(
      "UPDATE products SET rating = ?, numReviews = ?, reviews = ? WHERE _id = ?",
      [avgRating, numReviews, reviewsJson, id]
    );

    res.status(200).json({ message: "Review updated", review: reviews[reviewIndex] });
  } catch (error) {
    console.error(`Error updating review: ${error.message}`);
    res
      .status(error.status || 500)
      .json({ message: "เกิดข้อผิดพลาดในการแก้ไขรีวิว" });
  }
});

// Delete product review
const deleteProductReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewId } = req.body;

    if (!reviewId) {
      res.status(400);
      throw new Error("Review ID is required");
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE _id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const product = rows[0];
    let reviews = [];
    let reviewsStr = product.reviews;

    // Handle Buffer type
    if (Buffer.isBuffer(product.reviews)) {
      reviewsStr = product.reviews.toString("utf8");
    }

    try {
      if (reviewsStr && reviewsStr !== "5" && reviewsStr !== 5 && reviewsStr !== 0) {
        if (typeof reviewsStr === "string") {
          reviews = JSON.parse(reviewsStr);
        }
      }
      if (!Array.isArray(reviews)) reviews = [];
    } catch (e) {
      reviews = [];
    }

    // Find and remove the review
    const reviewIndex = reviews.findIndex(
      (r) =>
        r._id === reviewId && r.user && r.user.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
      res.status(404);
      throw new Error("Review not found or you don't have permission to delete");
    }

    // Remove review
    reviews.splice(reviewIndex, 1);

    const numReviews = reviews.length;
    const avgRating =
      numReviews > 0
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews
        : 0;

    const reviewsJson = JSON.stringify(reviews);

    await pool.query(
      "UPDATE products SET rating = ?, numReviews = ?, reviews = ? WHERE _id = ?",
      [avgRating, numReviews, reviewsJson, id]
    );

    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    console.error(`Error deleting review: ${error.message}`);
    res
      .status(error.status || 500)
      .json({ message: "เกิดข้อผิดพลาดในการลบรีวิว" });
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
  updateProductReview,
  deleteProductReview,
};