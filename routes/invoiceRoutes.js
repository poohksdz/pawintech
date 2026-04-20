const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getInvoiceDetails,
  getInvoicesByUserId,
  getInvoicesByInvoiceId,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  deleteInvoiceByInvoiceId,
} = require("../controllers/invoiceProductController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// Routes
router.get("/", protect, getInvoices);
router.get("/invoice/:invoiceId", protect, getInvoicesByInvoiceId);
router.get("/user/:userId", protect, getInvoicesByUserId);
router.get("/:id", protect, getInvoiceDetails);
router.post("/", protect, createInvoice);
router.put("/:id", protect, updateInvoice);
router.delete("/invoice_id/:id", protect, admin, deleteInvoiceByInvoiceId);
router.delete("/:id", protect, admin, deleteInvoice);

module.exports = router;
