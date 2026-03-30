const express = require("express");
const router = express.Router();

const {
  getDefaultQuotations,
  getDefaultQuotationById,
  getDefaultQuotationUsed,
  createDefaultQuotation,
  updateDefaultQuotation,
  updateDefaultQuotationSet,
  deleteDefaultQuotation,
} = require("../controllers/quotationDefaultController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

router.route("/set/:id").put(protect, admin, updateDefaultQuotationSet);
router.route("/isuse").get(getDefaultQuotationUsed);
router
  .route("/")
  .get(getDefaultQuotations)
  .post(protect, admin, createDefaultQuotation);
router
  .route("/:id")
  .get(getDefaultQuotationById)
  .put(protect, admin, updateDefaultQuotation)
  .delete(protect, admin, deleteDefaultQuotation);

module.exports = router;
