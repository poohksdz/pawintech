const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js");
const PDFDocument = require("pdfkit");

// @desc    Fetch all invoices
// @route   GET /api/invoices
// @access  Public
const getInvoices = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_invoices ORDER BY id DESC",
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching invoices: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoices" });
  }
});

// @desc    Fetch single invoice by ID
// @route   GET /api/invoices/:id
// @access  Public
const getInvoiceDetails = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_invoices WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching invoice: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoice" });
  }
});

// @desc    Fetch single invoice by invoice_no
// @route   GET /api/invoices/invoice_no/:id
// @access  Public
const getInvoicesByInvoiceId = asyncHandler(async (req, res) => {
  const invoice_no = req.params.invoiceId || req.params.id; // handle both param names if needed
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM tbl_invoices WHERE invoice_no = ?",
      [invoice_no],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching invoice: ${error.message}`);
    res.status(500).json({ message: "Error fetching invoice" });
  }
});

// @desc    Get next invoice no
// @route   GET /api/invoices/next-number
// @access  Public
const getNextInvoiceNo = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const shortThaiYear = String(thaiYear).slice(-2);

    const [lastInvoice] = await db.pool.query(
      `SELECT invoice_no 
       FROM tbl_invoices 
       WHERE invoice_no LIKE ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [`INV${shortThaiYear}-%`]
    );

    let nextNumber = "0001";
    if (lastInvoice.length > 0) {
      const lastNo = lastInvoice[0].invoice_no.split("-")[1];
      nextNumber = String(parseInt(lastNo) + 1).padStart(4, "0");
    }
    const nextInvoiceNo = `INV${shortThaiYear}-${nextNumber}`;

    res.status(200).json({ nextInvoiceNo });
  } catch (error) {
    console.error(`Error fetching next invoice no: ${error.message}`);
    res.status(500).json({ message: "Error fetching next invoice no" });
  }
});

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Public
const createInvoice = asyncHandler(async (req, res) => {
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
      invoice_pdf,
      note,
      internal_note,
      internal_contact_name,
      internal_contact_phone,
      payment_details,
    } = req.body;

    // Convert Thai date string "DD / MM / YYYY" to MySQL date "YYYY-MM-DD"
    function thaiDateToMySQL(thaiDateStr) {
      if (!thaiDateStr) return new Date().toISOString().slice(0, 10);
      const parts = thaiDateStr.split("/").map((s) => s.trim());
      if (parts.length !== 3) {
        return new Date(thaiDateStr).toISOString().slice(0, 10);
      }
      const [day, month, year] = parts;
      const gregorianYear = parseInt(year, 10); 
      return `${gregorianYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const mysqlDate = date
      ? thaiDateToMySQL(date)
      : new Date().toISOString().slice(0, 10);

    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const shortThaiYear = String(thaiYear).slice(-2);

    const [lastInvoice] = await db.pool.query(
      `SELECT invoice_no 
       FROM tbl_invoices 
       WHERE invoice_no LIKE ? 
       ORDER BY id DESC 
       LIMIT 1 
       FOR UPDATE`,
      [`INV${shortThaiYear}-%`],
    );

    let nextNumber = "0001";
    if (lastInvoice.length > 0) {
      const lastNo = lastInvoice[0].invoice_no.split("-")[1];
      nextNumber = String(parseInt(lastNo) + 1).padStart(4, "0");
    }
    const invoice_no = `INV${shortThaiYear}-${nextNumber}`;

    const createdAt = new Date();
    const updatedAt = new Date();

    for (let item of items) {
      await db.pool.query(
        `INSERT INTO tbl_invoices (
          customer_name, customer_present_name, customer_address, customer_vat,
          invoice_no, date, due_date, submit_price_within, number_of_credit_days,
          product_id, product_detail, quantity, unit, unit_price, amount_money,
          discount, total_amount_after_discount, total, vat, grand_total,
          transfer_bank_account_name, transfer_bank_account_number,
          buyer_approves_signature, buyer_approves_signature_date,
          sales_person_signature, sales_person_signature_date,
          sales_manager_signature, sales_manager_signature_date,
          branch_name, invoice_pdf, note, internal_note, internal_contact_name, internal_contact_phone, created_at, updated_at,
          payment_method, payment_check_bank, payment_transfer_date, payment_transfer_ref, payment_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.customer_name || null,
          customer.customer_present_name || null,
          customer.customer_address || null,
          customer.customer_vat || null,
          invoice_no,
          mysqlDate,
          due_date || null,
          submit_price_within || null,
          number_of_credit_days || null,
          item.product_id || null,
          item.description || "",
          item.qty || 0,
          item.unit || "",
          item.unit_price || 0,
          item.amount_money || 0,
          summary.discount || 0,
          summary.total || 0, 
          summary.total || 0,
          summary.vat || 0,
          summary.total || 0, 
          summary.bank_account_name || null,
          summary.bank_account_number || null,
          signatures?.buyer || "",
          "",
          signatures?.sales_person || "",
          createdAt,
          signatures?.sales_manager || "",
          createdAt,
          "Head Office",
          invoice_pdf || null,
          note || null,
          internal_note || null,
          internal_contact_name || null,
          internal_contact_phone || null,
          createdAt,
          updatedAt,
          payment_details?.paymentMethod || null,
          payment_details?.paymentCheckBank || null,
          payment_details?.paymentTransferDate || null,
          payment_details?.paymentTransferRef || null,
          payment_details?.paymentAmount !== undefined ? payment_details.paymentAmount : null,
        ],
      );
    }

    if (note !== undefined) {
      await db.pool.query("UPDATE tbl_default_invoice SET note = ?", [note || ""]);
    }

    res.status(201).json({ message: "Invoice created", invoice_no });
  } catch (error) {
    console.error(`Error creating invoice: ${error.message}`);
    res.status(500).json({ message: "Error creating invoice" });
  }
});

// @desc    Update an invoice by invoice_no
// @route   PUT /api/invoices/invoice_no/:id
// @access  Public
const updateInvoiceByInvoiceNo = asyncHandler(async (req, res) => {
  const invoice_no = req.params.id;
  const {
    due_date,
    submit_price_within,
    number_of_credit_days,
    date,
    items,
    summary,
    customer,
    signatures,
    invoice_pdf,
    note,
    internal_note,
    internal_contact_name,
    internal_contact_phone,
    payment_details,
  } = req.body;

  try {
    const [existing] = await db.pool.query(
      "SELECT * FROM tbl_invoices WHERE invoice_no = ?",
      [invoice_no],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    function thaiDateToMySQL(thaiDateStr) {
      if (!thaiDateStr) return new Date().toISOString().slice(0, 10);
      const parts = thaiDateStr.split("/").map((s) => s.trim());
      if (parts.length !== 3) {
        // Already a valid date or ISO string
        return new Date(thaiDateStr).toISOString().slice(0, 10);
      }
      const [day, month, year] = parts;
      const gregorianYear = parseInt(year, 10); 
      return `${gregorianYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const mysqlDate = thaiDateToMySQL(date);

    await db.pool.query("DELETE FROM tbl_invoices WHERE invoice_no = ?", [
      invoice_no,
    ]);

    const insertPromises = items.map((item) => {
        const createdAt = new Date();
        const updatedAt = new Date();
        const queryParams = [
          invoice_no,
          customer.customer_name || null,
          customer.customer_present_name || null,
          customer.customer_address || null,
          customer.customer_vat || null,
          mysqlDate,
          due_date || null,
          submit_price_within || null,
          number_of_credit_days || null,
          item.product_id || null,
          item.description || "",
          item.qty || 0,
          item.unit || "",
          item.unit_price || 0,
          item.amount_money || 0,
          summary.discount || 0,
          summary.total_after_discount || summary.total || 0, 
          summary.total || 0,
          summary.vat || 0,
          summary.grand_total || 0,
          summary.bank_account_name || null,
          summary.bank_account_number || null,
          signatures?.buyer || signatures?.buyer_approves_signature || null,
          signatures?.buyerDate || signatures?.buyer_approves_signature_date || null,
          signatures?.sales || signatures?.sales_person_signature || null,
          signatures?.salesDate || signatures?.sales_person_signature_date || createdAt,
          signatures?.manager || signatures?.sales_manager_signature || null,
          signatures?.managerDate || signatures?.sales_manager_signature_date || createdAt,
          invoice_pdf || null,
          customer.branch_name || "Head Office",
          note || null,
          internal_note || null,
          internal_contact_name || null,
          internal_contact_phone || null,
          createdAt,
          updatedAt,
          payment_details?.paymentMethod || null,
          payment_details?.paymentCheckBank || null,
          payment_details?.paymentTransferDate || null,
          payment_details?.paymentTransferRef || null,
          payment_details?.paymentAmount !== undefined ? payment_details.paymentAmount : null,
        ].map(p => typeof p === 'undefined' ? null : p);

        console.log("MySQL Bind Params for item:", queryParams);
        return db.pool.query(
          `INSERT INTO tbl_invoices (
            invoice_no,
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
            buyer_approves_signature,
            buyer_approves_signature_date,
            sales_person_signature,
            sales_person_signature_date,
            sales_manager_signature,
            sales_manager_signature_date,
            invoice_pdf,
            branch_name,
            note,
            internal_note,
            internal_contact_name,
            internal_contact_phone,
            created_at,
            updated_at,
            payment_method,
            payment_check_bank,
            payment_transfer_date,
            payment_transfer_ref,
            payment_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          queryParams
        );
      });

    await Promise.all(insertPromises);

    if (note !== undefined) {
      await db.pool.query("UPDATE tbl_default_invoice SET note = ?", [note || ""]);
    }

    res.json({ message: "Invoice updated successfully" });
  } catch (error) {
    console.error(`Error updating invoice: ${error.message}`);
    res.status(500).json({ message: "Error updating invoice: " + error.message, stack: error.stack });
  }
});

// @desc    Update an invoice (legacy)
// @route   PUT /api/invoices/:id
// @access  Public
const updateInvoice = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const [existing] = await db.pool.query(
      "SELECT * FROM tbl_invoices WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await db.pool.query(
      `UPDATE tbl_invoices SET
        customer_name = ?, customer_present_name = ?, customer_address = ?, customer_vat = ?,
        invoice_no = ?, date = ?, due_date = ?, submit_price_within = ?, number_of_credit_days = ?,
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
        req.body.invoice_no,
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
      ],
    );

    const [updatedRow] = await db.pool.query(
      "SELECT * FROM tbl_invoices WHERE id = ?",
      [id],
    );
    res.status(200).json(updatedRow[0]);
  } catch (error) {
    console.error(`Error updating invoice: ${error.message}`);
    res.status(500).json({ message: "Error updating invoice" });
  }
});

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Public
const deleteInvoice = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    await db.pool.query("DELETE FROM tbl_invoices WHERE id = ?", [id]);
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(`Error deleting invoice: ${error.message}`);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

// @desc    Delete an invoice by invoice_id/invoice_no
// @route   DELETE /api/invoices/invoice_id/:id
// @access  Public
const deleteInvoiceByInvoiceId = asyncHandler(async (req, res) => {
  const invoice_no = req.params.id;
  try {
    await db.pool.query("DELETE FROM tbl_invoices WHERE invoice_no = ?", [
      invoice_no,
    ]);
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(`Error deleting invoice: ${error.message}`);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

module.exports = {
  getInvoices,
  getInvoiceDetails,
  getNextInvoiceNo,
  getInvoicesByInvoiceId,
  createInvoice,
  updateInvoice,
  updateInvoiceByInvoiceNo,
  deleteInvoice,
  deleteInvoiceByInvoiceId,
};
