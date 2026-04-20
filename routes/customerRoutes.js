const express = require("express");
const router = express.Router();
const {
  getcustomers,
  getcustomerById,
  createcustomer,
  updatecustomer,
  deletecustomer,
} = require("../controllers/customerController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

// @route   GET /api/customers
// @desc    Get all customers
router.get("/", getcustomers);

// @route   GET /api/customers/:id
// @desc    Get a single customer by ID
router.get("/:id", getcustomerById);

// @route   POST /api/customers
// @desc    Create a new customer (Protected)
router.post("/", protect, createcustomer);

// @route   PUT /api/customers/:id
// @desc    Update a customer (Protected)
router.put("/:id", protect, updatecustomer);

// @route   DELETE /api/customers/:id
// @desc    Delete a customer (Admin only)
router.delete("/:id", protect, admin, deletecustomer);

module.exports = router;
