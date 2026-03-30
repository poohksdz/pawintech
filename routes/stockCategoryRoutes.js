const express = require("express");
const {
  createStockCategory,
  updateStockCategory,
  deleteStockCategory,
  getStockCategories,
  getStockCategoryDetails,
} = require("../controllers/stockCategoryController.js");

const { protect, admin, store } = require("../middleware/authMiddleware.js");

const router = express.Router();

router
  .route("/")
  .post(protect, createStockCategory)
  .get(protect, getStockCategories);
router
  .route("/:id")
  .get(protect, getStockCategoryDetails)
  .delete(protect, deleteStockCategory)
  .put(protect, updateStockCategory);

module.exports = router;
