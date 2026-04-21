-- ============================================================
-- Signature System Migration
-- ============================================================

-- 1. ตารางเก็บคลังลายเซ็นของผู้ใช้
CREATE TABLE IF NOT EXISTS user_signatures (
  _id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT 'ชื่อกำกับลายเซ็น เช่น นาย ABC, ผู้จัดการฝ่ายขาย',
  image_path VARCHAR(255) NOT NULL COMMENT 'path ของรูป signature',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. เพิ่ม column signature slots ใน pcb_custom_orders
--    แต่ละ slot เก็บ user_signatures._id (FK) ถ้า NULL = ไม่ใส่ลายเซ็น
ALTER TABLE pcb_custom_orders
  ADD COLUMN slot_buyer INT DEFAULT NULL COMMENT 'ลายเซ็นผู้ซื้อ (ใบแจ้งหนี้/ใบเสร็จ)',
  ADD COLUMN slot_cashier INT DEFAULT NULL COMMENT 'ลายเซ็นผู้รับเงิน',
  ADD COLUMN slot_manager INT DEFAULT NULL COMMENT 'ลายเซ็นผู้มีอำนาจลงนาม',
  ADD COLUMN slot_sender INT DEFAULT NULL COMMENT 'ลายเซ็นผู้ส่งสินค้า',
  -- สำหรับ quotation (3 slots)
  ADD COLUMN slot_quo_buyer INT DEFAULT NULL COMMENT 'ลายเซ็นผู้ขอซื้อ',
  ADD COLUMN slot_quo_sales INT DEFAULT NULL COMMENT 'ลายเซ็นผู้ขาย (sales person)',
  ADD COLUMN slot_quo_manager INT DEFAULT NULL COMMENT 'ลายเซ็นผู้จัดการฝ่ายขาย';
