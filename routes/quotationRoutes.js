const express = require("express");
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  getQuotationByQuotationNo,
  getQuotationUsed,
  createQuotation,
  updateQuotation,
  updateQuotationByQuotationNo,
  deleteQuotation,
  deleteQuotationByQuotationNo,
} = require("../controllers/quotationController.js");

const { protect, admin, store } = require("../middleware/authMiddleware.js");

// Get all quotations
router.get("/", protect, getQuotations);

// Get single quotation by ID
router.get("/:id", protect, getQuotationById);

// Get single quotation by ID
router.get("/quotation_no/:id", protect, getQuotationByQuotationNo);

// Get used quotations
router.get("/used", protect, getQuotationUsed);

// Create a new quotation
router.post("/", protect, createQuotation);

// Update a quotation
router.put("/:id", protect, updateQuotation);

// Update a quotation by quotation no
router.put("/quotation_no/:id", protect, updateQuotationByQuotationNo);

// Delete a quotation
router.delete("/:id", protect, admin, deleteQuotation);

// Delete a quotation by quotation no
router.delete("/quotation_no/:id", protect, admin, deleteQuotationByQuotationNo);

module.exports = router;
