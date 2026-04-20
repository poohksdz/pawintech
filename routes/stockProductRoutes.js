const express = require("express");
const router = express.Router();

const {
  getStockProducts,
  getStockProductById,
  getStockProductByBarcode,
  createStockProduct,
  updateStockProduct,
  deleteStockProduct,
  updateStockProductQty,
  updateStockProductQtyByElectotronixPN,
  rateProduct,
} = require("../controllers/stockProductController.js");

const { protect, admin, store } = require("../middleware/authMiddleware.js");

router.route("/barcode/:barcode").get(protect, getStockProductByBarcode);

router
  .route("/")
  .get(protect, getStockProducts)
  .post(protect, createStockProduct);

router
  .route("/:id")
  .get(protect, getStockProductById)
  .put(protect, updateStockProduct)
  .delete(protect, deleteStockProduct);

router
  .route("/updateProductQtyByElectotronixPN/:electotronixPN")
  .put(protect, updateStockProductQtyByElectotronixPN);

router.route("/:id/rate").put(protect, rateProduct);

module.exports = router;
