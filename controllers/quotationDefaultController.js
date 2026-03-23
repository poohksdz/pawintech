const asyncHandler = require('../middleware/asyncHandler.js')
const connectToDatabase = require('../config/db.js')
const db = require('../config/db.js')
// @desc    Fetch all default quotations
// @route   GET /api/defaultquotations
// @access  Public
const getDefaultQuotations = asyncHandler(async (req, res) => {
  try {

    const [rows] = await db.pool.query(
      `SELECT * FROM tbl_default_quotation ORDER BY id DESC`
    )
    res.status(200).json({ quotations: rows })
  } catch (error) {
    console.error(`Error fetching default quotations: ${error.message}`)
    res.status(500).json({ message: 'Error fetching default quotations' })
  }
})

// @desc    Fetch single default quotation by ID
// @route   GET /api/defaultquotations/:id
// @access  Public
const getDefaultQuotationById = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {

    const [rows] = await db.pool.query(
      `SELECT * FROM tbl_default_quotation WHERE id = ?`,
      [id]
    )
    if (rows.length === 0) {
      res.status(404).json({ message: 'Quotation not found' })
    } else {
      res.status(200).json({ quotation: rows[0] })
    }
  } catch (error) {
    console.error(`Error fetching quotation: ${error.message}`)
    res.status(500).json({ message: 'Error fetching quotation' })
  }
})

// @desc    Fetch default quotations that are marked as "used"
// @route   GET /api/defaultquotations/used
// @access  Public
const getDefaultQuotationUsed = asyncHandler(async (req, res) => {
  try {

    const [rows] = await db.pool.query(
      `SELECT * FROM tbl_default_quotation WHERE is_used = 1 ORDER BY id DESC`
    )
    res.status(200).json({ quotations: rows })
  } catch (error) {
    console.error(`Error fetching used quotations: ${error.message}`)
    res.status(500).json({ message: 'Error fetching used quotations' })
  }
})

// @desc    Create a new default quotation
// @route   POST /api/defaultquotations
// @access  Public
const createDefaultQuotation = asyncHandler(async (req, res) => {
  const {
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
    branch_name,
    bank_account_name,
    bank_account_number,
    deposit,
    buyer_approves,
    sales_person,
    sales_manager,
  } = req.body

  try {


    const is_head_office = branch_name === 'Head Office' ? 1 : 0
    const is_branch = branch_name === 'Head Office' ? 0 : 1

    const [result] = await db.pool.query(
      `INSERT INTO tbl_default_quotation 
      (logo, company_name, company_name_thai, head_office, head_office_thai, tel, email, tax_id, discount, vat, is_head_office, is_branch, branch_name, bank_account_name, bank_account_number, deposit, buyer_approves, sales_person, sales_manager, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
        bank_account_name,
        bank_account_number,
        deposit,
        buyer_approves,
        sales_person,
        sales_manager,
      ]
    )

    const [newRow] = await db.pool.query(
      `SELECT * FROM tbl_default_quotation WHERE id = ?`,
      [result.insertId]
    )

    res.status(201).json({ quotation: newRow[0] })
  } catch (error) {
    console.error(`Error creating quotation: ${error.message}`)
    res.status(500).json({ message: 'Error creating quotation' })
  }
})

// @desc    Update a default quotation
// @route   PUT /api/defaultquotations/:id
// @access  Public
const updateDefaultQuotation = asyncHandler(async (req, res) => {
  const id = req.params.id
  const {
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
    branch_name,
    bank_account_name,
    bank_account_number,
    deposit,
    buyer_approves,
    sales_person,
    sales_manager,
  } = req.body

  try {


    const is_head_office = branch_name === 'Head Office' ? 1 : 0
    const is_branch = branch_name === 'Head Office' ? 0 : 1

    console.log(req.body)

    await db.pool.query(
      `UPDATE tbl_default_quotation
       SET logo = ?, company_name = ?, company_name_thai = ?, head_office = ?, head_office_thai = ?, tel = ?, email = ?, tax_id = ?, discount = ?, vat = ?, is_head_office = ?, is_branch = ?, branch_name = ?, bank_account_name = ?, bank_account_number = ?, deposit = ?, buyer_approves = ?, sales_person = ?, sales_manager = ?
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
        bank_account_name,
        bank_account_number,
        deposit,
        buyer_approves,
        sales_person,
        sales_manager,
        id,
      ]
    )

    const [updatedRow] = await db.pool.query(
      `SELECT * FROM tbl_default_quotation WHERE id = ?`,
      [id]
    )

    res.status(200).json({ quotation: updatedRow[0] })
  } catch (error) {
    console.error(`Error updating quotation: ${error.message}`)
    res.status(500).json({ message: 'Error updating quotation' })
  }
})
// @desc    Update a default quotation as "used"
// @route   PUT /api/defaultquotations/set/:id
// @access  Public
const updateDefaultQuotationSet = asyncHandler(async (req, res) => {
  const id = req.params.id

  try {


    // 1. Set all other quotations to is_used = 0
    await db.pool.query(
      `UPDATE tbl_default_quotation
       SET is_used = 0
       WHERE id != ?`,
      [id]
    )

    // 2. Set the selected quotation to is_used = 1
    await db.pool.query(
      `UPDATE tbl_default_quotation
       SET is_used = 1
       WHERE id = ?`,
      [id]
    )

    // 3. Return the updated quotation
    const [updatedRow] = await db.pool.query(
      `SELECT * FROM tbl_default_quotation WHERE id = ?`,
      [id]
    )

    res.status(200).json({ quotation: updatedRow[0] })
  } catch (error) {
    console.error(`Error updating quotation: ${error.message}`)
    res.status(500).json({ message: 'Error updating quotation' })
  }
})

// @desc    Delete a default quotation
// @route   DELETE /api/defaultquotations/:id
// @access  Public
const deleteDefaultQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {


    // Fetch the existing quotation
    const [existing] = await db.pool.query(
      'SELECT * FROM tbl_default_quotation WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Default quotation not found' })
    }

    // Check if the quotation is currently used
    if (existing[0].is_used === 1) {
      return res
        .status(400)
        .json({ message: 'Cannot delete a quotation that is in use' })
    }

    // Delete the quotation
    await db.pool.query('DELETE FROM tbl_default_quotation WHERE id = ?', [
      id,
    ])

    res.status(200).json({ message: 'Quotation deleted successfully' })
  } catch (error) {
    console.error(`Error deleting quotation: ${error.message}`)
    res.status(500).json({ message: 'Error deleting quotation' })
  }
})

module.exports = {
  getDefaultQuotations,
  getDefaultQuotationById,
  getDefaultQuotationUsed,
  createDefaultQuotation,
  updateDefaultQuotation,
  updateDefaultQuotationSet,
  deleteDefaultQuotation,
}
