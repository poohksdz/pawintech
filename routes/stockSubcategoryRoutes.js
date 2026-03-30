const express = require("express");
const {
  createStockSubcategory,
  updateStockSubcategory,
  deleteStockSubcategory,
  getStockSubcategory,
  getStockSubcategoryDetails,
  getStockSubcategoryByCategory,
} = require("../controllers/stockSubcategoryController");

const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.route("/subcategorybycategory").get(getStockSubcategoryByCategory);

router
  .route("/")
  .post(protect, createStockSubcategory)
  .get(getStockSubcategory);
router
  .route("/:id")
  .get(getStockSubcategoryDetails)
  .delete(protect, deleteStockSubcategory)
  .put(protect, updateStockSubcategory);

module.exports = router;
