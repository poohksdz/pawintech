const asyncHandler = require('../middleware/asyncHandler.js')
const { pool } = require('../config/db.js')

// @desc    Fetch all default invoices
// @route   GET /api/defaultinvoices
// @access  Public
const getDefaultInvoices = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM tbl_default_invoice
       ORDER BY id DESC`
    )

    res.status(200).json({ invoices: rows })
  } catch (error) {
    console.error(`Error fetching default invoices: ${error.message}`)
    res.status(500).json({ message: 'Error fetching default invoices' })
  }
})

// @desc    Fetch single default invoice by ID
// @route   GET /api/defaultinvoices/:id
// @access  Public
const getDefaultInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await pool.query(
      `SELECT * FROM tbl_default_invoice
       WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Default invoice not found' })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching default invoice: ${error.message}`)
    res.status(500).json({ message: 'Error fetching default invoice' })
  }
})

// @desc    Fetch single default invoice
// @route   GET /api/defaultinvoices/used
// @access  Public
const getDefaultInvoiceUsed = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM tbl_default_invoice
       WHERE set_default = ?`,
      [1]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Default invoice not found' })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching default invoice: ${error.message}`)
    res.status(500).json({ message: 'Error fetching default invoice' })
  }
})

// @desc    Create a new default invoice
// @route   POST /api/defaultinvoices
// @access  Private/Admin
const createDefaultInvoice = asyncHandler(async (req, res) => {
  const {
    company_name,
    company_name_thai,
    head_office,
    head_office_thai,
    tel,
    email,
    tax_id,
    discount,
    vat,
    is_head_office,
    is_branch,
    branch_name,
  } = req.body

  const logo = `/images${req.body.logo}`

  try {
    const [result] = await pool.query(
      `INSERT INTO tbl_default_invoice
      (logo, company_name, company_name_thai, head_office, head_office_thai, tel, email, tax_id, discount, vat, is_head_office, is_branch, branch_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logo,
        company_name,
        company_name_thai,
        head_office,
        head_office_thai,
        tel,
        email,
        tax_id,
        discount,
        vat,
        is_head_office,
        is_branch,
        branch_name,
      ]
    )

    const [newInvoice] = await pool.query(
      'SELECT * FROM tbl_default_invoice WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json(newInvoice[0])
  } catch (error) {
    console.error(`Error creating default invoice: ${error.message}`)
    res.status(500).json({ message: 'Error creating default invoice' })
  }
})

// @desc    Update a default invoice
// @route   PUT /api/defaultinvoices/:id
// @access  Private/Admin
const updateDefaultInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    company_name,
    company_name_thai,
    head_office,
    head_office_thai,
    tel,
    email,
    tax_id,
    discount,
    vat,
    is_head_office,
    is_branch,
    branch_name,
  } = req.body

  const logo = `/images${req.body.logo}`

  try {

    const [existing] = await pool.query(
      'SELECT * FROM tbl_default_invoice WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Default invoice not found' })
    }

    await pool.query(
      `UPDATE tbl_default_invoice SET logo = ?, 
      company_name = ?, company_name_thai = ?, head_office = ?, head_office_thai = ?,
      tel = ?, email = ?, tax_id = ?, discount = ?, vat = ?,
      is_head_office = ?, is_branch = ?, branch_name = ?
      WHERE id = ?`,
      [
        logo,
        company_name,
        company_name_thai,
        head_office,
        head_office_thai,
        tel,
        email,
        tax_id,
        discount,
        vat,
        is_head_office,
        is_branch,
        branch_name,
        id,
      ]
    )

    const [updatedInvoice] = await pool.query(
      'SELECT * FROM tbl_default_invoice WHERE id = ?',
      [id]
    )

    res.status(200).json(updatedInvoice[0])
  } catch (error) {
    console.error(`Error updating default invoice: ${error.message}`)
    res.status(500).json({ message: 'Error updating default invoice' })
  }
})

// @desc    Set an invoice as default
// @route   POST /api/defaultinvoices/:id/use
// @access  Private/Admin
const useDefaultInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {

    const [existing] = await pool.query(
      'SELECT * FROM tbl_default_invoice WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Default invoice not found' })
    }

    // Reset all invoices to set_default = 0
    await pool.query('UPDATE tbl_default_invoice SET set_default = 0')

    // Set the selected invoice as default
    await pool.query(
      'UPDATE tbl_default_invoice SET set_default = 1 WHERE id = ?',
      [id]
    )

    const [updatedInvoice] = await pool.query(
      'SELECT * FROM tbl_default_invoice WHERE id = ?',
      [id]
    )

    res.status(200).json(updatedInvoice[0])
  } catch (error) {
    console.error(`Error setting default invoice: ${error.message}`)
    res.status(500).json({ message: 'Error setting default invoice' })
  }
})

// @desc    Delete a default invoice
// @route   DELETE /api/defaultinvoices/:id
// @access  Private/Admin
const deleteDefaultInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [existing] = await pool.query(
      'SELECT * FROM tbl_default_invoice WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Default invoice not found' })
    }

    if (existing[0].set_default === 1) {
      return res
        .status(400)
        .json({ message: 'Cannot delete the default invoice' })
    }

    await pool.query('DELETE FROM tbl_default_invoice WHERE id = ?', [id])

    res.status(200).json({ message: 'Default invoice deleted successfully' })
  } catch (error) {
    console.error(`Error deleting default invoice: ${error.message}`)
    res.status(500).json({ message: 'Error deleting default invoice' })
  }
})

module.exports = {
  getDefaultInvoices,
  getDefaultInvoiceById,
  getDefaultInvoiceUsed,
  createDefaultInvoice,
  updateDefaultInvoice,
  useDefaultInvoice,
  deleteDefaultInvoice,
}
