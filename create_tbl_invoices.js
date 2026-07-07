require('dotenv').config();
const db = require('./config/db.js');

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS \`tbl_invoices\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`customer_name\` varchar(255) NOT NULL,
      \`customer_present_name\` varchar(255) DEFAULT NULL,
      \`customer_address\` text DEFAULT NULL,
      \`customer_vat\` varchar(50) DEFAULT NULL,
      \`invoice_no\` varchar(50) NOT NULL,
      \`date\` date NOT NULL,
      \`due_date\` int(11) DEFAULT NULL,
      \`submit_price_within\` varchar(50) DEFAULT NULL,
      \`number_of_credit_days\` int(11) DEFAULT NULL,
      \`product_id\` varchar(11) DEFAULT NULL,
      \`product_detail\` text DEFAULT NULL,
      \`quantity\` decimal(10,2) DEFAULT NULL,
      \`unit\` varchar(50) DEFAULT NULL,
      \`unit_price\` decimal(15,2) DEFAULT NULL,
      \`amount_money\` decimal(15,2) DEFAULT NULL,
      \`discount\` decimal(5,2) DEFAULT NULL,
      \`total_amount_after_discount\` decimal(15,2) DEFAULT NULL,
      \`total\` decimal(15,2) DEFAULT NULL,
      \`vat\` decimal(5,2) DEFAULT NULL,
      \`grand_total\` decimal(15,2) DEFAULT NULL,
      \`transfer_bank_account_name\` varchar(255) DEFAULT NULL,
      \`transfer_bank_account_number\` varchar(100) DEFAULT NULL,
      \`buyer_approves_signature\` varchar(255) DEFAULT NULL,
      \`buyer_approves_signature_date\` date DEFAULT NULL,
      \`sales_person_signature\` varchar(255) DEFAULT NULL,
      \`sales_person_signature_date\` date DEFAULT NULL,
      \`sales_manager_signature\` varchar(255) DEFAULT NULL,
      \`sales_manager_signature_date\` date DEFAULT NULL,
      \`branch_name\` varchar(100) DEFAULT NULL,
      \`invoice_pdf\` varchar(255) DEFAULT NULL,
      \`is_used\` tinyint(1) DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
  `;

  try {
    await db.pool.query(query);
    console.log("tbl_invoices created successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
createTable();
