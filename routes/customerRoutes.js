const express = require('express')
const router = express.Router()
const {
  getcustomers,
  getcustomerById,
  createcustomer,
  updatecustomer,
  deletecustomer,
} = require('../controllers/customerController.js')

// @route   GET /api/customers
// @desc    Get all customers
router.get('/', getcustomers)

// @route   GET /api/customers/:id
// @desc    Get a single customer by ID
router.get('/:id', getcustomerById)

// @route   POST /api/customers
// @desc    Create a new customer
router.post('/', createcustomer)

// @route   PUT /api/customers/:id
// @desc    Update a customer
router.put('/:id', updatecustomer)

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
router.delete('/:id', deletecustomer)

module.exports = router
