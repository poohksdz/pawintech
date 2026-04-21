-- เพิ่มคอลัมน์ระบบเฉลี่ยคะแนนดาวให้ tbl_product
-- รันไฟล์นี้ใน phpMyAdmin หรือ MySQL CLI

ALTER TABLE tbl_product
  ADD COLUMN totalRating DECIMAL(10,1) NOT NULL DEFAULT 0 COMMENT 'คะแนนรวมทั้งหมด',
  ADD COLUMN ratingCount INT NOT NULL DEFAULT 0 COMMENT 'จำนวนคนที่ให้คะแนน';

-- ถ้ามีข้อมูลดาวเก่าอยู่แล้ว ให้ย้าย starRating เป็น totalRating และ ratingCount = 1 ถ้า isStarred
UPDATE tbl_product
  SET totalRating = IFNULL(starRating, 0),
      ratingCount = IF(starRating > 0 OR isStarred, 1, 0)
  WHERE (starRating IS NOT NULL AND starRating > 0) OR (isStarred IS NOT NULL AND isStarred = 1);

-- เพิ่มคอลัมน์ lastRatingChange (ถ้ายังไม่มี)
ALTER TABLE tbl_product
  ADD COLUMN lastRatingChange VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'บันทึกว่าดาวขึ้น/ลง';