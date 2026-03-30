const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Manually parse .env if it exists
let env = {};
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) env[key.trim()] = value.trim();
  });
} catch (e) {}

const pool = mysql.createPool({
  host: env.DB_HOST || "127.0.0.1",
  user: env.DB_USER || "root",
  password: env.DB_PASSWORD || "",
  database: env.DB_NAME || "pawin_tech",
});

async function migrate() {
  try {
    console.log("--- Migrating order_pcbs ---");
    await pool.query(
      `ALTER TABLE order_pcbs ADD COLUMN status VARCHAR(50) DEFAULT 'pending' AFTER paymentSlip`,
    );
    console.log("✅ Added status column to order_pcbs");
  } catch (err) {
    if (err.code === "ER_DUP_COLUMN_NAME") {
      console.log("ℹ️ status column already exists in order_pcbs");
    } else {
      console.error("❌ Error migrating order_pcbs:", err.message);
    }
  }

  try {
    // Also check if updated_at exists, if not add it
    await pool.query(
      `ALTER TABLE order_pcbs ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`,
    );
    console.log("✅ Added updated_at column to order_pcbs");
  } catch (err) {
    if (err.code === "ER_DUP_COLUMN_NAME") {
      console.log("ℹ️ updated_at column already exists in order_pcbs");
    } else {
      console.error("❌ Error migrating order_pcbs updated_at:", err.message);
    }
  }

  process.exit();
}

migrate();
