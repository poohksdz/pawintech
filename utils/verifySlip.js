const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const jsQR = require("jsqr");
const fs = require("fs");
const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db");

const createassemblyPCB = asyncHandler(async (req, res) => {
  try {
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({ message: "Cart ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No slip uploaded" });
    }

    // =========================
    // 1️⃣ ดึง cart จาก DB
    // =========================
    const [cartRows] = await pool.query(
      "SELECT * FROM pcb_assembly_carts WHERE id = ?",
      [cartId],
    );

    if (cartRows.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cart = cartRows[0];
    const imagePath = req.file.path;

    // =========================
    // 2️⃣ OCR อ่านข้อความ
    // =========================
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "tha+eng");

    if (!text.includes("บาท") && !text.includes("THB")) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "ไม่ใช่สลิปโอนเงิน" });
    }

    // ตรวจสอบยอดเงินจาก confirmed_price
    const expectedAmount = Number(cart.confirmed_price).toFixed(2);

    if (
      !text.includes(expectedAmount) &&
      !text.includes(Number(cart.confirmed_price).toString())
    ) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "ยอดเงินไม่ตรงกับราคาที่ยืนยัน" });
    }

    // =========================
    // 3️⃣ ตรวจ QR Code
    // =========================
    const image = await sharp(imagePath)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const qr = jsQR(
      new Uint8ClampedArray(image.data),
      image.info.width,
      image.info.height,
    );

    if (!qr) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ message: "ไม่พบ QR Code ในสลิป" });
    }

    // =========================
    // 4️⃣ INSERT ORDER
    // =========================
    const insertData = {
      order_type: "PCB_ASSEMBLY_ORDER",
      projectname: cart.projectname,
      pcb_qty: cart.pcb_qty,
      status: "Pending",

      confirmed_price: cart.confirmed_price,
      vatPrice: cart.vatPrice,

      user_id: cart.user_id,
      userName: cart.userName,
      userEmail: cart.userEmail,

      shippingName: cart.shippingName,
      shippingAddress: cart.shippingAddress,
      shippingCity: cart.shippingCity,
      shippingPostalCode: cart.shippingPostalCode,
      shippingCountry: cart.shippingCountry,
      shippingPhone: cart.shippingPhone,

      paymentSlip: imagePath,
      isVerified: 1,
      cartId: cart.id,
    };

    const [result] = await pool.query(
      "INSERT INTO pcb_assembly_orders SET ?",
      insertData,
    );

    // =========================
    // 5️⃣ ลบ cart
    // =========================
    await pool.query("DELETE FROM pcb_assembly_carts WHERE id = ?", [cartId]);

    res.status(201).json({
      message: "Order created and slip verified successfully",
      orderId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Slip verification failed" });
  }
});

module.exports = {
  createassemblyPCB,
};
