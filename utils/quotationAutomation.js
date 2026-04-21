const db = require("../config/db");
const { quotationEmailTemplate } = require("./emailTemplates");
const nodemailer = require("nodemailer");

/**
 * Automates the creation and emailing of a quotation when a PCB price is confirmed.
 * @param {string} type - 'gerber', 'custom', 'copy', or 'assembly'
 * @param {number} itemId - The ID of the item in the respective cart table
 */
const automateQuotation = async (type, itemId) => {
    try {
        console.log(`Starting automated quotation for ${type} ID: ${itemId}`);

        // 1. Fetch Active Default Quotation Settings
        const [defaultQuotations] = await db.pool.query("SELECT * FROM tbl_default_quotation WHERE is_used = 1 LIMIT 1");
        if (defaultQuotations.length === 0) {
            console.error("Automation error: No active default quotation found.");
            return;
        }
        const dq = defaultQuotations[0];

        // 2. Determine Table and Fetch Item Details
        let table = "";
        if (type === "gerber") table = "pcb_gerber_carts";
        else if (type === "custom") table = "pcb_custom_carts";
        else if (type === "copy") table = "pcb_copy_carts";
        else if (type === "assembly") table = "pcb_assembly_carts";
        else throw new Error(`Invalid PCB type: ${type}`);

        const [items] = await db.pool.query(`SELECT * FROM ${table} WHERE id = ?`, [itemId]);
        if (items.length === 0) {
            console.error(`Automation error: Item ${itemId} not found in ${table}.`);
            return;
        }
        const item = items[0];

        // 3. Fetch User Information
        const [users] = await db.pool.query("SELECT name, email, billingAddress FROM users WHERE _id = ?", [item.user_id]);
        if (users.length === 0) {
            console.error(`Automation error: User ${item.user_id} not found.`);
            return;
        }
        const user = users[0];

        // 4. Calculate Financials
        // Note: use confirmed_price if available, otherwise fallback to item price
        const unit_price = Number(item.confirmed_price || item.price || 0);
        const quantity = Number(item.pcb_qty || 1);
        const amount_money = unit_price * quantity;

        const discount_perc = Number(dq.discount || 0);
        const discount_val = (amount_money * discount_perc) / 100;
        const total_after_discount = amount_money - discount_val;

        const vat_perc = Number(dq.vat || 7); // Default to 7% if not set
        const vat_val = (total_after_discount * vat_perc) / 100;
        const grand_total = total_after_discount + vat_val;

        // 5. Generate Quotation Number (QUYY-XXXX)
        const now = new Date();
        const thaiYear = now.getFullYear() + 543;
        const shortThaiYear = String(thaiYear).slice(-2);

        const [lastQuotation] = await db.pool.query(
            "SELECT quotation_no FROM tbl_quotations WHERE quotation_no LIKE ? ORDER BY id DESC LIMIT 1",
            [`QU${shortThaiYear}-%`]
        );

        let nextNumber = "0001";
        if (lastQuotation.length > 0) {
            const lastNoStr = lastQuotation[0].quotation_no.split("-")[1];
            nextNumber = String(parseInt(lastNoStr) + 1).padStart(4, "0");
        }
        const quotation_no = `QU${shortThaiYear}-${nextNumber}`;

        // 6. Create Record in tbl_quotations
        const billing = typeof user.billingAddress === 'string' ? JSON.parse(user.billingAddress || '{}') : (user.billingAddress || {});

        const sql = `
            INSERT INTO tbl_quotations (
                customer_name, customer_present_name, customer_address, customer_vat,
                quotation_no, date, due_date, submit_price_within, number_of_credit_days,
                product_id, product_detail, quantity, unit, unit_price, amount_money,
                discount, total_amount_after_discount, total, vat, grand_total,
                transfer_bank_account_name, transfer_bank_account_number,
                sales_person_signature, branch_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const product_detail = `${type.toUpperCase()} PCB Production: ${item.projectname || 'Untitled Project'}`;
        const due_date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 7 days from now

        const values = [
            user.name,
            billing.billingName || user.name,
            billing.billinggAddress || '-',
            billing.tax || '-',
            quotation_no,
            now.toISOString().slice(0, 10), // current date YYYY-MM-DD
            due_date,
            '7 Days',
            0,
            item.orderID || item.paymentComfirmID || `PCB-${itemId}`,
            product_detail,
            quantity,
            'PCS',
            unit_price,
            amount_money,
            discount_perc,
            total_after_discount,
            total_after_discount,
            vat_perc,
            grand_total,
            dq.bank_account_name,
            dq.bank_account_number,
            dq.sales_person,
            dq.branch_name
        ];

        await db.pool.query(sql, values);
        console.log(`Successfully created quotation ${quotation_no} in database`);

        // 6.5 Update Cart Item with Quotation Number
        await db.pool.query(`UPDATE ${table} SET quotation_no = ? WHERE id = ?`, [quotation_no, itemId]);
        console.log(`Updated ${table} ID: ${itemId} with quotation_no: ${quotation_no}`);

        // 7. Send Email Notification
        await sendQuotationEmail(user.email, user.name, quotation_no, grand_total, dq);

    } catch (error) {
        console.error("Quotation automation failed:", error.message);
    }
};

/**
 * Helper to send the quotation email
 */
const sendQuotationEmail = async (to, userName, quotationNo, grandTotal, dq) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const bankInfo = {
            name: dq.bank_account_name.includes('ธนาคาร') ? dq.bank_account_name : `ธนาคาร (ผ่าน ${dq.bank_account_name})`,
            accountName: dq.company_name_thai || dq.company_name,
            accountNumber: dq.bank_account_number
        };

        const html = quotationEmailTemplate(userName, quotationNo, grandTotal, dq.company_name_thai || dq.company_name, bankInfo);

        const mailOptions = {
            from: `"PAWIN TECH" <${process.env.EMAIL_USER}>`,
            to,
            subject: `ใบเสนอราคาเลขที่ ${quotationNo} จาก Pawin Tech`,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Quotation email sent to ${to}`);
    } catch (error) {
        console.error("Failed to send quotation email:", error.message);
    }
};

module.exports = {
    automateQuotation
};
