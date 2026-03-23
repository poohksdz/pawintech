const asyncHandler = require('../middleware/asyncHandler.js')
const { pool } = require('../config/db.js')

// @desc    Fetch all vats
// @route   GET /api/vats
// @access  Public
const getVats = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_product_invoice ORDER BY id DESC'
    )
    res.status(200).json({ vats: rows })
  } catch (error) {
    console.error(`Error fetching vats: ${error.message}`)
    res.status(500).json({ message: 'Error fetching vats' })
  }
})

// @desc    Fetch single vat
// @route   GET /api/vats/:id
// @access  Public
const getVatById = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_product_invoice WHERE id = ?',
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vat not found' })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching vat: ${error.message}`)
    res.status(500).json({ message: 'Error fetching vat' })
  }
})

// @desc    Create a vat
// @route   POST /api/vats
// @access  Private/Admin
const createVat = asyncHandler(async (req, res) => {
  const {
    invoice_id,
    product_id,
    user_id,
    description,
    qty,
    unit,
    unit_price,
    unit_total,
    discount,
    total_after_discount,
    vat,
    grand_total,
    branch_name,
  } = req.body

  try {

    const [result] = await pool.query(
      `INSERT INTO tbl_product_invoice
      (invoice_id, product_id, user_id, description, qty, unit, unit_price, unit_total, discount, total_after_discount, vat, grand_total, branch_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_id,
        product_id,
        user_id,
        description,
        qty,
        unit,
        unit_price,
        unit_total,
        discount,
        total_after_discount,
        vat,
        grand_total,
        branch_name,
      ]
    )

    const [newVat] = await pool.query(
      'SELECT * FROM tbl_product_invoice WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json(newVat[0])
  } catch (error) {
    console.error(`Error creating vat: ${error.message}`)
    res.status(500).json({ message: 'Error creating vat' })
  }
})

// @desc    Update a vat
// @route   PUT /api/vats/:id
// @access  Private/Admin
const updateVat = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    invoice_id,
    product_id,
    user_id,
    description,
    qty,
    unit,
    unit_price,
    unit_total,
    discount,
    total_after_discount,
    vat,
    grand_total,
    branch_name,
  } = req.body

  try {

    const [existingVat] = await pool.query(
      'SELECT * FROM tbl_product_invoice WHERE id = ?',
      [id]
    )

    if (existingVat.length === 0) {
      return res.status(404).json({ message: 'Vat not found' })
    }

    await pool.query(
      `UPDATE tbl_product_invoice
       SET invoice_id=?, product_id=?, user_id=?, description=?, qty=?, unit=?, unit_price=?, unit_total=?, discount=?, total_after_discount=?, vat=?, grand_total=?, branch_name=?
       WHERE id=?`,
      [
        invoice_id,
        product_id,
        user_id,
        description,
        qty,
        unit,
        unit_price,
        unit_total,
        discount,
        total_after_discount,
        vat,
        grand_total,
        branch_name,
        id,
      ]
    )

    const [updatedVat] = await pool.query(
      'SELECT * FROM tbl_product_invoice WHERE id = ?',
      [id]
    )

    res.status(200).json(updatedVat[0])
  } catch (error) {
    console.error(`Error updating vat: ${error.message}`)
    res.status(500).json({ message: 'Error updating vat' })
  }
})

// @desc    Delete a vat
// @route   DELETE /api/vats/:id
// @access  Private/Admin
const deleteVat = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {

    const [existingVat] = await pool.query(
      'SELECT * FROM tbl_product_invoice WHERE id = ?',
      [id]
    )

    if (existingVat.length === 0) {
      return res.status(404).json({ message: 'Vat not found' })
    }

    await pool.query('DELETE FROM tbl_product_invoice WHERE id = ?', [id])

    res.status(200).json({ message: 'Vat deleted successfully' })
  } catch (error) {
    console.error(`Error deleting vat: ${error.message}`)
    res.status(500).json({ message: 'Error deleting vat' })
  }
})

module.exports = {
  getVats,
  getVatById,
  createVat,
  updateVat,
  deleteVat,
}
