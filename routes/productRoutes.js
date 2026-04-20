const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateReviewsProduct,
  updateShowFrontProduct,
  createProductReview,
} = require("../controllers/productController.js");

const { protect, admin, store } = require("../middleware/authMiddleware.js");

// Define routes
router.route("/").get(getProducts).post(protect, store, createProduct);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, store, updateProduct)
  .delete(protect, store, deleteProduct);

router.route("/:id/reviews").post(protect, createProductReview);
router.route("/:id/showfront").put(protect, store, updateShowFrontProduct);

module.exports = router;
