const multer = require("multer");
const path = require("path");
const fs = require("fs");

// กำหนดที่เก็บไฟล์
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = "uploads/"; // โฟลเดอร์ปลายทาง

    //  ตรวจสอบว่ามีโฟลเดอร์ไหม ถ้าไม่มีให้สร้างใหม่เลย (แก้ Error 500)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename(req, file, cb) {
    // ตั้งชื่อไฟล์ไม่ให้ซ้ำ: fieldname-เวลาปัจจุบัน.นามสกุล
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

// ฟังก์ชันเช็คประเภทไฟล์ (รูปภาพ และ Zip/Rar/PDF)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|pdf|zip|rar/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (jpg/jpeg/png/webp), PDF, and Zip files are allowed!"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // จำกัดขนาด 100MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
