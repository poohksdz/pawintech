const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getInvoiceDetails,
  getInvoicesByInvoiceId,
  getNextInvoiceNo,
  createInvoice,
  updateInvoice,
  updateInvoiceByInvoiceNo,
  deleteInvoice,
  deleteInvoiceByInvoiceId,
} = require("../controllers/invoiceProductController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// Routes
router.get("/", protect, admin, getInvoices);
router.get("/next-number", protect, getNextInvoiceNo);
router.get("/invoice/:invoiceId", protect, getInvoicesByInvoiceId);
router.get("/:id", protect, getInvoiceDetails);
router.post("/", protect, createInvoice);
router.put("/invoice_no/:id", protect, updateInvoiceByInvoiceNo);
router.put("/:id", protect, updateInvoice);
router.delete("/invoice_id/:id", protect, admin, deleteInvoiceByInvoiceId);
router.delete("/:id", protect, admin, deleteInvoice);

module.exports = router;
