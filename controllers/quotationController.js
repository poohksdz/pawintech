const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ Used 'db' here
const PDFDocument = require('pdfkit')

// @desc    Fetch all quotations
// @route   GET /api/quotations
// @access  Public
const getQuotations = asyncHandler(async (req, res) => {
  try {
    // ✅ Fixed: changed connection -> db
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_quotations ORDER BY id DESC'
    )
    res.status(200).json({ quotations: rows })
  } catch (error) {
    console.error(`Error fetching quotations: ${error.message}`)
    res.status(500).json({ message: 'Error fetching quotations' })
  }
})

// @desc    Fetch single quotation by ID
// @route   GET /api/quotations/:id
// @access  Public
const getQuotationById = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {
    // ✅ Fixed: changed connection -> db
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_quotations WHERE id = ?',
      [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' })
    }
    res.status(200).json({ quotation: rows[0] })
  } catch (error) {
    console.error(`Error fetching quotation: ${error.message}`)
    res.status(500).json({ message: 'Error fetching quotation' })
  }
})

// @desc    Fetch single quotation by getQuotationByQuotationNo
// @route   GET /api/quotations/quotation_no/:id
// @access  Public
const getQuotationByQuotationNo = asyncHandler(async (req, res) => {
  const quotation_no = req.params.id
  try {
    // ✅ Fixed: changed connection -> db
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_quotations WHERE quotation_no = ?',
      [quotation_no]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' })
    }
    res.status(200).json({
      quotation: [rows],
    })
  } catch (error) {
    console.error(`Error fetching quotation: ${error.message}`)
    res.status(500).json({ message: 'Error fetching quotation' })
  }
})

// @desc    Fetch quotations that are marked as "used"
// @route   GET /api/quotations/used
// @access  Public
const getQuotationUsed = asyncHandler(async (req, res) => {
  try {
    // ✅ Fixed: changed connection -> db
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_quotations WHERE is_used = 1 ORDER BY id DESC'
    )
    res.status(200).json({ quotations: rows })
  } catch (error) {
    console.error(`Error fetching used quotations: ${error.message}`)
    res.status(500).json({ message: 'Error fetching used quotations' })
  }
})

// @desc    Create a new quotation
// @route   POST /api/quotations
// @access  Public
const createQuotation = asyncHandler(async (req, res) => {
  try {
    const {
      customer,
      summary,
      items,
      signatures,
      due_date,
      submit_price_within,
      number_of_credit_days,
      date,
      quotation_pdf,
    } = req.body

    // Convert Thai date string "DD / MM / YYYY" to MySQL date "YYYY-MM-DD"
    function thaiDateToMySQL(thaiDateStr) {
      const [day, month, year] = thaiDateStr.split('/').map((s) => s.trim())
      const gregorianYear = parseInt(year, 10) // subtract 543 to get Gregorian year
      return `${gregorianYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Inside your try block, before inserting:
    const mysqlDate = date
      ? thaiDateToMySQL(date)
      : new Date().toISOString().slice(0, 10)

    // Generate Thai year quotation_no with row lock
    const now = new Date()
    const thaiYear = now.getFullYear() + 543
    const shortThaiYear = String(thaiYear).slice(-2)

    // ✅ Fixed: changed connection -> db
    const [lastQuotation] = await db.pool.query(
      `SELECT quotation_no 
       FROM tbl_quotations 
       WHERE quotation_no LIKE ? 
       ORDER BY id DESC 
       LIMIT 1 
       FOR UPDATE`,
      [`QU${shortThaiYear}-%`]
    )

    let nextNumber = '0001'
    if (lastQuotation.length > 0) {
      const lastNo = lastQuotation[0].quotation_no.split('-')[1]
      nextNumber = String(parseInt(lastNo) + 1).padStart(4, '0')
    }
    const quotation_no = `QU${shortThaiYear}-${nextNumber}`

    const createdAt = new Date()
    const updatedAt = new Date()

    // Insert each item with the same quotation_no
    for (let item of items) {
      // ✅ Fixed: changed connection -> db
      await db.pool.query(
        `INSERT INTO tbl_quotations (
          customer_name, customer_present_name, customer_address, customer_vat,
          quotation_no, date, due_date, submit_price_within, number_of_credit_days,
          product_id, product_detail, quantity, unit, unit_price, amount_money,
          discount, total_amount_after_discount, total, vat, grand_total,
          transfer_bank_account_name, transfer_bank_account_number,
          buyer_approves_signature, buyer_approves_signature_date,
          sales_person_signature, sales_person_signature_date,
          sales_manager_signature, sales_manager_signature_date,
          branch_name, quotation_pdf, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.customer_name,
          customer.customer_present_name,
          customer.customer_address,
          customer.customer_vat,
          quotation_no,
          mysqlDate,
          due_date,
          submit_price_within,
          number_of_credit_days,
          item.product_id,
          item.description,
          item.qty,
          item.unit,
          item.unit_price,
          item.amount_money,
          summary.discount,
          summary.total, // total_amount_after_discount
          summary.total,
          summary.vat,
          summary.total, // grand_total
          summary.bank_account_name,
          summary.bank_account_number,
          signatures.buyer,
          '',
          signatures.sales_person,
          createdAt,
          signatures.sales_manager,
          createdAt,
          'Head Office',
          quotation_pdf,
          createdAt,
          updatedAt,
        ]
      )
    }

    res.status(201).json({ message: 'Quotation created', quotation_no })
  } catch (error) {
    console.error(`Error creating quotation: ${error.message}`)
    res.status(500).json({ message: 'Error creating quotation' })
  }
})

// @desc    Update a quotation
// @route   PUT /api/quotations/quotation_no/:id
// @access  Public
const updateQuotationByQuotationNo = asyncHandler(async (req, res) => {
  const quotation_no = req.params.id
  const {
    due_date,
    submit_price_within,
    number_of_credit_days,
    date,
    items,
    summary,
    customer,
    signatures,
    quotation_pdf,
  } = req.body

  console.log(req.body)

  try {
    // 1. Check if quotation exists
    // ✅ Fixed: changed connection -> db
    const [existing] = await db.pool.query(
      'SELECT * FROM tbl_quotations WHERE quotation_no = ?',
      [quotation_no]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' })
    }

    // Convert Thai date string "DD / MM / YYYY" to MySQL date "YYYY-MM-DD"
    function thaiDateToMySQL(thaiDateStr) {
      if (!thaiDateStr) return new Date().toISOString().slice(0, 10)
      const [day, month, year] = thaiDateStr.split('/').map((s) => s.trim())
      const gregorianYear = parseInt(year, 10) // convert Thai Buddhist year to Gregorian
      // const gregorianYear = parseInt(year, 10) - 543 // convert Thai Buddhist year to Gregorian
      return `${gregorianYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Inside your try block, before inserting:
    const mysqlDate = thaiDateToMySQL(date)

    // 2. Delete old quotation rows
    // ✅ Fixed: changed connection -> db
    await db.pool.query('DELETE FROM tbl_quotations WHERE quotation_no = ?', [
      quotation_no,
    ])

    // 3. Insert new items with customer, summary, and signatures
    const insertPromises = items.map((item) =>
      // ✅ Fixed: changed connection -> db
      db.pool.query(
        `INSERT INTO tbl_quotations (
          quotation_no,
          customer_name,
          customer_present_name,
          customer_address,
          customer_vat,
          date,
          due_date,
          submit_price_within,
          number_of_credit_days,
          product_id,
          product_detail,
          quantity,
          unit,
          unit_price,
          amount_money,
          discount,
          total_amount_after_discount,
          total,
          vat,
          grand_total,
          transfer_bank_account_name,
          transfer_bank_account_number,
          sales_person_signature,
          sales_manager_signature,
          quotation_pdf
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quotation_no,
          customer.customer_name,
          customer.customer_present_name,
          customer.customer_address,
          customer.customer_vat,
          mysqlDate,
          due_date,
          submit_price_within,
          number_of_credit_days,
          item.product_id,
          item.description,
          item.qty,
          item.unit,
          item.unit_price,
          item.amount_money,
          summary.discount,
          summary.total_after_discount || summary.total, // fallback if total_after_discount is missing
          summary.total,
          summary.vat,
          summary.grand_total,
          summary.bank_account_name,
          summary.bank_account_number,
          signatures?.sales_person_signature || null,
          signatures?.sales_manager_signature || null,
          quotation_pdf || null,
        ]
      )
    )

    await Promise.all(insertPromises)

    res.json({ message: 'Quotation updated successfully' })
  } catch (error) {
    console.error(`Error updating quotation: ${error.message}`)
    res.status(500).json({ message: 'Error updating quotation' })
  }
})

// @desc    Update a quotation
// @route   PUT /api/quotations/:id
// @access  Public
const updateQuotation = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {
    // ✅ Fixed: changed connection -> db
    const [existing] = await db.pool.query(
      'SELECT * FROM tbl_quotations WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' })
    }

    // ✅ Fixed: changed connection -> db
    await db.pool.query(
      `UPDATE tbl_quotations SET
        customer_name = ?, customer_present_name = ?, customer_address = ?, customer_vat = ?,
        quotation_no = ?, date = ?, due_date = ?, submit_price_within = ?, number_of_credit_days = ?,
        product_id = ?, product_detail = ?, quantity = ?, unit = ?, unit_price = ?, amount_money = ?,
        discount = ?, total_amount_after_discount = ?, total = ?, vat = ?, grand_total = ?,
        transfer_bank_account_name = ?, transfer_bank_account_number = ?,
        buyer_approves_signature = ?, buyer_approves_signature_date = ?,
        sales_person_signature = ?, sales_person_signature_date = ?,
        sales_manager_signature = ?, sales_manager_signature_date = ?,
        branch_name = ?
      WHERE id = ?`,
      [
        req.body.customer_name,
        req.body.customer_present_name,
        req.body.customer_address,
        req.body.customer_vat,
        req.body.quotation_no,
        req.body.date,
        req.body.due_date,
        req.body.submit_price_within,
        req.body.number_of_credit_days,
        req.body.product_id,
        req.body.product_detail,
        req.body.quantity,
        req.body.unit,
        req.body.unit_price,
        req.body.amount_money,
        req.body.discount,
        req.body.total_amount_after_discount,
        req.body.total,
        req.body.vat,
        req.body.grand_total,
        req.body.transfer_bank_account_name,
        req.body.transfer_bank_account_number,
        req.body.buyer_approves_signature,
        req.body.buyer_approves_signature_date,
        req.body.sales_person_signature,
        req.body.sales_person_signature_date,
        req.body.sales_manager_signature,
        req.body.sales_manager_signature_date,
        req.body.branch_name,
        id,
      ]
    )

    // ✅ Fixed: changed connection -> db
    const [updatedRow] = await db.pool.query(
      'SELECT * FROM tbl_quotations WHERE id = ?',
      [id]
    )
    res.status(200).json({ quotation: updatedRow[0] })
  } catch (error) {
    console.error(`Error updating quotation: ${error.message}`)
    res.status(500).json({ message: 'Error updating quotation' })
  }
})

// @desc    Delete a quotation
// @route   DELETE /api/quotations/:id
// @access  Public
const deleteQuotation = asyncHandler(async (req, res) => {
  const id = req.params.id
  try {
    // ✅ Fixed: changed connection -> db
    await db.pool.query('DELETE FROM tbl_quotations WHERE id = ?', [id])
    res.status(200).json({ message: 'Quotation deleted successfully' })
  } catch (error) {
    console.error(`Error deleting quotation: ${error.message}`)
    res.status(500).json({ message: 'Error deleting quotation' })
  }
})

// @desc    Delete a quotation deleteQuotationByQuotationNo
// @route   DELETE /api/quotations/:id
// @access  Public
const deleteQuotationByQuotationNo = asyncHandler(async (req, res) => {
  const quotation_no = req.params.id
  try {
    // ✅ Fixed: changed connection -> db
    await db.pool.query('DELETE FROM tbl_quotations WHERE quotation_no = ?', [
      quotation_no,
    ])
    res.status(200).json({ message: 'Quotation deleted successfully' })
  } catch (error) {
    console.error(`Error deleting quotation: ${error.message}`)
    res.status(500).json({ message: 'Error deleting quotation' })
  }
})

module.exports = {
  getQuotations,
  getQuotationById,
  getQuotationByQuotationNo,
  getQuotationUsed,
  createQuotation,
  updateQuotation,
  updateQuotationByQuotationNo,
  deleteQuotation,
  deleteQuotationByQuotationNo,
}