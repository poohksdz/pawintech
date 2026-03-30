const express = require("express");
const {
  createStockSupplier,
  updateStockSupplier,
  deleteStockSupplier,
  getStockSupplier,
  getStockSupplierDetails,
} = require("../controllers/stockSupplierController");

const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.route("/").post(protect, createStockSupplier).get(getStockSupplier);
router
  .route("/:id")
  .get(getStockSupplierDetails)
  .delete(protect, deleteStockSupplier)
  .put(protect, updateStockSupplier);

module.exports = router;
