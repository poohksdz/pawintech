const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ ประกาศตัวแปรชื่อ db

// @desc    Fetch all customers
// @route   GET /api/customers
// @access  Public
const getcustomers = asyncHandler(async (req, res) => {
  try {
    // ✅ แก้ไข: ใช้ db แทน connection
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_customers ORDER BY id DESC'
    )
    res.status(200).json({ customers: rows })
  } catch (error) {
    console.error(`Error fetching customers: ${error.message}`)
    res.status(500).json({ message: 'Error fetching customers' })
  }
})

// @desc    Fetch single customer by ID
// @route   GET /api/customers/:id
// @access  Public
const getcustomerById = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {
    // ✅ แก้ไข: ใช้ db แทน connection
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_customers WHERE id = ?',
      [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'customer not found' })
    }
    res.status(200).json({ customer: rows[0] })
  } catch (error) {
    console.error(`Error fetching customer: ${error.message}`)
    res.status(500).json({ message: 'Error fetching customer' })
  }
})

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Public
const createcustomer = asyncHandler(async (req, res) => {
  try {
    const {
      customer_name,
      customer_present_name,
      customer_address,
      customer_vat,
    } = req.body

    if (
      !customer_name ||
      !customer_present_name ||
      !customer_address ||
      !customer_vat
    ) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // ✅ แก้ไข: ใช้ db แทน connection
    const [result] = await db.pool.query(
      `INSERT INTO tbl_customers
        (customer_name, customer_present_name, customer_address, customer_vat, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [customer_name, customer_present_name, customer_address, customer_vat]
    )

    // ✅ แก้ไข: ใช้ db แทน connection
    const [newCustomer] = await db.pool.query(
      'SELECT * FROM tbl_customers WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json({ customer: newCustomer[0] })
  } catch (error) {
    console.error(`Error creating customer: ${error.message}`)
    res.status(500).json({ message: 'Error creating customer' })
  }
})

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
const updatecustomer = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {
    const {
      customer_name,
      customer_present_name,
      customer_address,
      customer_vat,
    } = req.body

    // ✅ แก้ไข: ใช้ db แทน connection
    const [existing] = await db.pool.query(
      'SELECT * FROM tbl_customers WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    // ✅ แก้ไข: ใช้ db แทน connection
    await db.pool.query(
      `UPDATE tbl_customers
       SET customer_name = ?, customer_present_name = ?, customer_address = ?, customer_vat = ?, updated_at = NOW()
       WHERE id = ?`,
      [customer_name, customer_present_name, customer_address, customer_vat, id]
    )

    // ✅ แก้ไข: ใช้ db แทน connection
    const [updatedCustomer] = await db.pool.query(
      'SELECT * FROM tbl_customers WHERE id = ?',
      [id]
    )

    res.status(200).json({ customer: updatedCustomer[0] })
  } catch (error) {
    console.error(`Error updating customer: ${error.message}`)
    res.status(500).json({ message: 'Error updating customer' })
  }
})

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
const deletecustomer = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {
    // ✅ แก้ไข: ใช้ db แทน connection
    await db.pool.query('DELETE FROM tbl_customers WHERE id = ?', [id])
    res.status(200).json({ message: 'customer deleted successfully' })
  } catch (error) {
    console.error(`Error deleting customer: ${error.message}`)
    res.status(500).json({ message: 'Error deleting customer' })
  }
})

module.exports = {
  getcustomers,
  getcustomerById,
  createcustomer,
  updatecustomer,
  deletecustomer,
}