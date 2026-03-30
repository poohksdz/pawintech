const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js"); //  ประกาศตัวแปรชื่อ db

// @desc    Fetch all invoices
// @route   GET /api/invoices
// @access  Public
const getInvoices = asyncHandler(async (req, res) => {
  try {
    //  แก้ไข: ใช้ db แทน connection
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_product_invoice ORDER BY ID DESC",
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching invoices: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoices" });
  }
});

// @desc    Fetch single invoice details
// @route   GET /api/invoices/:id
// @access  Public
const getInvoiceDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    //  แก้ไข: ใช้ db แทน connection
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_product_invoice WHERE ID = ?",
      [id],
    );
    if (rows.length === 0) {
      res.status(404);
      throw new Error("Invoice not found");
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching invoice: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoice" });
  }
});

// @desc    Fetch invoices by user ID
// @route   GET /api/invoices/user/:userId
// @access  Public
const getInvoicesByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  try {
    //  แก้ไข: ใช้ db แทน connection
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_product_invoice WHERE userId = ?",
      [userId],
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching invoices by user: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoices by user" });
  }
});

// @desc    Fetch invoices by invoice ID
// @route   GET /api/invoices/by/:invoiceId
// @access  Public
const getInvoicesByInvoiceId = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  console.log(invoiceId);
  try {
    //  แก้ไข: ใช้ db แทน connection
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_product_invoice WHERE invoice_id = ?",
      [invoiceId],
    );
    if (rows.length === 0) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching invoice by ID: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoice by ID" });
  }
});

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Public
const createInvoice = asyncHandler(async (req, res) => {
  const data = req.body;
  try {
    const [result] = await db.pool.query(
      "INSERT INTO tbl_product_invoice (userId, customerName, branch_name, description, qty, unit, unit_price, grand_total, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.userId,
        data.customerName,
        data.branch_name,
        data.description,
        data.qty,
        data.unit,
        data.unit_price,
        data.grand_total,
        data.date,
      ],
    );
    const [invoice] = await db.pool.query(
      "SELECT * FROM tbl_product_invoice WHERE ID = ?",
      [result.insertId],
    );
    res.status(201).json(invoice[0]);
  } catch (error) {
    console.error(`Error creating invoice: ${error.message}`);
    res.status(500).json({ message: "Error creating invoice" });
  }
});

// @desc    Update an existing invoice
// @route   PUT /api/invoices/:id
// @access  Public
const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await db.pool.query(
      "UPDATE tbl_product_invoice SET customerName = ?, branch_name = ?, description = ?, qty = ?, unit = ?, unit_price = ?, grand_total = ?, date = ? WHERE ID = ?",
      [
        data.customerName,
        data.branch_name,
        data.description,
        data.qty,
        data.unit,
        data.unit_price,
        data.grand_total,
        data.date,
        id,
      ],
    );
    const [invoice] = await db.pool.query(
      "SELECT * FROM tbl_product_invoice WHERE ID = ?",
      [id],
    );
    res.status(200).json(invoice[0]);
  } catch (error) {
    console.error(`Error updating invoice: ${error.message}`);
    res.status(500).json({ message: "Error updating invoice" });
  }
});

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Public
const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    //  แก้ไข: ใช้ db แทน connection
    await db.pool.query("DELETE FROM tbl_product_invoice WHERE ID = ?", [id]);
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(`Error deleting invoice: ${error.message}`);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

// @desc    Delete an invoice
// @route   DELETE /api/invoices/invoice_id/:id
// @access  Public
const deleteInvoiceByInvoiceId = asyncHandler(async (req, res) => {
  const { id: invoice_id } = req.params;
  try {
    console.log(`Deleting invoice with invoice_id: ${invoice_id}`);
    //  แก้ไข: ใช้ db แทน connection และ Uncomment โค้ดให้ทำงานได้จริง
    await db.pool.query(
      "DELETE FROM tbl_product_invoice WHERE invoice_id = ?",
      [invoice_id],
    );
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(`Error deleting invoice: ${error.message}`);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

module.exports = {
  getInvoices,
  getInvoiceDetails,
  getInvoicesByUserId,
  getInvoicesByInvoiceId,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  deleteInvoiceByInvoiceId,
};
