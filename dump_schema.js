require('dotenv').config();
const db = require('./config/db.js');

async function dump() {
  try {
    const [invoiceRows] = await db.pool.query("SHOW CREATE TABLE tbl_product_invoice");
    console.log("Invoice Table:");
    console.log(invoiceRows[0]['Create Table']);
    
    const [quotationRows] = await db.pool.query("SHOW CREATE TABLE tbl_quotations");
    console.log("\nQuotation Table:");
    console.log(quotationRows[0]['Create Table']);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
dump();
