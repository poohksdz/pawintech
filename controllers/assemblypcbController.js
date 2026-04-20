const asyncHandler = require("../middleware/asyncHandler");
const { pool: db } = require("../config/db.js");
const deleteFile = require("../utils/fileUtils");
const { resolvePaymentSlipPath } = require("../utils/pathUtils.js");
const fs = require("fs");
const path = require("path");
const jsQR = require("jsqr");
const Jimp = require("jimp");

// Utility: Generate timestamp string: YYYYMMDDHHmmss
const getTimestamp = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const DD = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
};

// Utility: Generate unique payment confirm ID for Assembly
const generateUniquePaymentConfirmID = async () => {
  const base = getTimestamp();
  const maxTries = 10000;
  let counter = 1;
  while (counter < maxTries) {
    const suffix = String(counter).padStart(3, "0");
    const uniqueID = `PCPA-${base}${suffix}`;
    const [rows] = await db.execute(
      "SELECT id FROM pcb_assembly_orders WHERE paymentComfirmID = ?",
      [uniqueID],
    );
    if (rows.length === 0) return uniqueID;
    counter++;
  }
  const fallback = `-${Date.now().toString(36)}`;
  return `PCPA-${base}${fallback}`;
};

// Helper: ตรวจสอบหา QR Code ในรูปภาพ
const checkSlipQR = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const image = await Jimp.read(filePath);
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code !== null;
  } catch (error) {
    console.error("🔥 Error reading image for QR:", error);
    return false;
  }
};

// Helper: format Date -> MySQL DATETIME
const toMySQLDatetime = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

// @desc    Fetch all Assembly PCB Orders
const getassemblyPCBs = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_assembly_orders ORDER BY created_at DESC",
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
      });
  }
});

// @desc    Fetch single Assembly PCB by ID
const getassemblyPCBById = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_assembly_orders WHERE id = ?",
      [req.params.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @desc    Fetch Assembly PCB orders by User ID
const getassemblyPCBByUserId = asyncHandler(async (req, res) => {
  const user_id = req.params.userId;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_assembly_orders WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({
          success: false,
          message: "No assembly orders found for this user.",
        });
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @desc    Fetch Assembly PCB orders by Order ID
const getassemblyPCBByOrderId = asyncHandler(async (req, res) => {
  const orderID = req.params.orderID;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_assembly_orders WHERE orderID = ? ORDER BY created_at DESC",
      [orderID],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({
          success: false,
          message: "No assembly orders found for this order ID.",
        });
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("getassemblyPCBByOrderId error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch assembly orders" });
  }
});

// @desc    Create a new Assembly PCB Order
const createassemblyPCB = asyncHandler(async (req, res) => {
  const {
    orderItems,
    userId,
    userName,
    userEmail,
    shippingAddress = {},
    billingAddress = {},
    paymentResult = {}, // อิงตาม Standard PCB
    receivePlace,
    totalPrice, // ยอดรวมทั้งหมด
  } = req.body;

  try {
    const payload = req.body.orderData || req.body;
    // รองรับทั้งแบบเก่า (cartId) และแบบใหม่ (orderItems)
    const items = orderItems || (payload.cartId ? [payload] : []);

    if (!items || items.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "⚠️ ไม่พบรายการสินค้าในคำสั่งซื้อ" });

    const transferedAmount = paymentResult.transferedAmount || payload.transferedAmount;
    const paymentSlip = paymentResult.image || payload.paymentSlip;
    const transferedName = paymentResult.transferedName || payload.transferedName;
    const transferedDate = paymentResult.transferedDate || payload.transferedDate;

    if (!paymentSlip)
      return res
        .status(400)
        .json({ success: false, message: "⚠️ กรุณาแนบรูปสลิปโอนเงิน" });

    let cleanPaymentSlip = paymentSlip.replace(/\\/g, "/");
    if (!cleanPaymentSlip.startsWith("/"))
      cleanPaymentSlip = "/" + cleanPaymentSlip;
    const absoluteFilePath = resolvePaymentSlipPath(cleanPaymentSlip);
    if (!absoluteFilePath) {
      return res.status(400).json({
        success: false,
        message: "⚠️ Path ของไฟล์สลิปไม่ถูกต้อง",
      });
    }

    // 1. ตรวจสอบ QR Code (ถ้ามีไฟล์)
    const isValidQR = await checkSlipQR(absoluteFilePath);
    if (!isValidQR) {
      if (fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
      return res.status(400).json({
        success: false,
        message: "⚠️ ไม่พบ QR Code ในรูปภาพ กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้อง",
      });
    }

    // 2. ตรวจสอบยอดเงินรวม
    const targetTotalPrice = Number(totalPrice) || 0;
    const paidAmount = Number(transferedAmount);

    if (targetTotalPrice > 0 && Math.abs(paidAmount - targetTotalPrice) > 1.0) {
      if (fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
      return res.status(400).json({
        success: false,
        message: `⚠️ ยอดโอนเงินไม่ถูกต้อง (ยอดที่ต้องชำระคือ ${targetTotalPrice.toLocaleString()} บาท)`,
      });
    }

    const paymentComfirmID = await generateUniquePaymentConfirmID();
    const results = [];

    // 3. Loop สร้าง Order แต่ละรายการ
    for (const item of items) {
      const cartId = item.cartId || item.id;
      if (!cartId) continue;

      const [cartRows] = await db.execute(
        `SELECT * FROM pcb_assembly_carts WHERE id = ?`,
        [cartId],
      );
      if (cartRows.length === 0) continue;
      const cart = cartRows[0];

      const targetUserId = userId || cart.user_id || 0;
      const userPrefix = parseInt(targetUserId) + 1000;
      let count = 1;
      const maxTries = 10000;
      let orderID = "";
      while (count < maxTries) {
        orderID = `${userPrefix}PCA${count}`;
        const [existing] = await db.execute(
          `SELECT id FROM pcb_assembly_orders WHERE orderID = ?`,
          [orderID],
        );
        if (existing.length === 0) break;
        count++;
      }

      const fileZip = cart.gerber_zip || cart.assembly_zip || cart.file_path || "";

      const insertSql = `
          INSERT INTO pcb_assembly_orders (
              projectname, user_id, pcb_qty, notes, gerber_zip,
              status, confirmed_price, vatPrice, created_at, updated_at,
              userName, userEmail, 
              shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone, 
              receivePlace, 
              billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax,
              transferedAmount, transferedName, paymentSlip, transferedDate,
              orderID, paymentComfirmID, cartId, quotation_no, isDelivered
          ) VALUES (
              ?, ?, ?, ?, ?, 
              'paid', ?, ?, NOW(), NOW(), 
              ?, ?, 
              ?, ?, ?, ?, ?, ?, 
              ?, 
              ?, ?, ?, ?, ?, ?, ?, 
              ?, ?, ?, ?, 
              ?, ?, ?, ?, 0
          )
      `;

      const insertValues = [
        cart.projectname,
        cart.user_id,
        cart.pcb_qty,
        cart.notes || "",
        fileZip,
        cart.confirmed_price || cart.estimatedCost,
        cart.vatPrice || 0,
        userName || cart.userName,
        userEmail || cart.userEmail,
        shippingAddress.shippingname || cart.shippingName,
        shippingAddress.address || cart.shippingAddress,
        shippingAddress.city || cart.shippingCity,
        shippingAddress.postalCode || cart.shippingPostalCode,
        shippingAddress.country || cart.shippingCountry,
        shippingAddress.phone || cart.shippingPhone,
        receivePlace || cart.receivePlace || "bysending",
        billingAddress.billingName || cart.billingName,
        billingAddress.billinggAddress || cart.billinggAddress,
        billingAddress.billingCity || cart.billingCity,
        billingAddress.billingPostalCode || cart.billingPostalCode,
        billingAddress.billingCountry || cart.billingCountry,
        billingAddress.billingPhone || cart.billingPhone,
        billingAddress.tax || cart.billingTax,
        item.confirmed_price || item.estimatedCost || transferedAmount, // ใช้ราคาของชิ้นนั้นๆ
        transferedName,
        cleanPaymentSlip,
        transferedDate || new Date(),
        orderID,
        paymentComfirmID,
        cartId,
        cart.quotation_no || null,
      ];

      await db.execute(insertSql, insertValues);

      await db.execute(
        `UPDATE pcb_assembly_carts SET status = 'paid' WHERE id = ?`,
        [cartId],
      );
      results.push(orderID);
    }

    return res
      .status(201)
      .json({ success: true, message: "ชำระเงินสำเร็จ!", orderIDs: results });
  } catch (error) {
    console.error("🔥 Backend Error (Assembly):", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
  }
});

// @desc    Create a new Assembly PCB Order by Admin
const createassemblyPCBbyAdmin = asyncHandler(async (req, res) => {
  const data = req.body || {};

  if (
    !data.projectname ||
    !data.customerInfo ||
    !data.customerInfo.customerUserID
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  let useId = data.customerInfo.customerUserID;

  try {
    const userPrefix = parseInt(useId) + 1000;
    let count = 1;
    const maxTries = 10000;
    let orderID;
    while (count < maxTries) {
      orderID = `${userPrefix}PCA${count}`;
      const [existing] = await db.execute(
        `SELECT id FROM pcb_assembly_orders WHERE orderID = ?`,
        [orderID],
      );
      if (existing.length === 0) break;
      count++;
    }

    const paymentComfirmID = await generateUniquePaymentConfirmID();

    //  แก้ไขคอลัมน์จาก assembly_zip เป็น gerber_zip
    const columns = [
      "projectname",
      "user_id",
      "pcb_qty",
      "notes",
      "gerber_zip",
      "status",
      "confirmed_price",
      "confirmed_reason",
      "created_at",
      "updated_at",
      "isDelivered",
      "deliveryID",
      "deliveryOn",
      "userName",
      "userEmail",
      "shippingName",
      "shippingAddress",
      "shippingCity",
      "shippingPostalCode",
      "shippingCountry",
      "shippingPhone",
      "receivePlace",
      "billingName",
      "billinggAddress",
      "billingCity",
      "billingPostalCode",
      "billingCountry",
      "billingPhone",
      "billingTax",
      "transferedNumber",
      "transferedAmount",
      "transferedName",
      "paymentSlip",
      "transferedDate",
      "orderID",
      "cartId",
      "paymentComfirmID",
      "sell_id",
      "sell_name",
      "sell_address",
      "sell_city",
      "sell_post_code",
      "sell_country",
      "sell_phone",
      "sell_email",
    ];

    const createdAt = toMySQLDatetime();
    const updatedAt = createdAt;

    const values = [
      data.projectname || "",
      data.user_id || "",
      data.pcb_qty || 0,
      data.notes || "",
      data.assembly_zip || "",
      data.status || "pending",
      data.confirmed_price || "",
      data.confirmed_reason || "",
      createdAt,
      updatedAt,
      data.isDelivered ? 1 : 0,
      data.deliveryID || "",
      data.deliveryOn || "",
      data.customerInfo?.customerName || "",
      data.customerInfo?.customerEmailAddress || "",
      data.shippingAddress?.shippingname || "",
      data.shippingAddress?.address || "",
      data.shippingAddress?.city || "",
      data.shippingAddress?.postalCode || "",
      data.shippingAddress?.country || "",
      data.shippingAddress?.phone || "",
      data.shippingAddress?.receivePlace || "",
      data.billingAddress?.billingName || "",
      data.billingAddress?.billinggAddress || "",
      data.billingAddress?.billingCity || "",
      data.billingAddress?.billingPostalCode || "",
      data.billingAddress?.billingCountry || "",
      data.billingAddress?.billingPhone || "",
      data.billingAddress?.tax || "",
      data.transfer?.transferedNumber || "",
      data.transfer?.transferedAmount || "",
      data.transfer?.transferedName || "",
      data.paymentSlip || "",
      data.transfer?.transferedDate
        ? new Date(data.transfer.transferedDate)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19)
        : "",
      orderID,
      data.cartId || "",
      paymentComfirmID,
      data.sellerInfo?.sellerUserID || "",
      data.sellerInfo?.sellerName || "",
      data.sellerInfo?.sellerAddress || "",
      data.sellerInfo?.sellerCity || "",
      data.sellerInfo?.sellerPostalCode || "",
      data.sellerInfo?.sellerCountry || "",
      data.sellerInfo?.sellerPhoneNumber || "",
      data.sellerInfo?.sellerEmailAddress || "",
    ];

    const placeholders = values.map(() => "?").join(",");
    const sql = `INSERT INTO pcb_assembly_orders (${columns.join(",")}) VALUES (${placeholders})`;

    await db.execute(sql, values);

    return res
      .status(201)
      .json({
        success: true,
        message: "Assembly PCB order created successfully",
        orderID,
        paymentComfirmID,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to create Assembly PCB order",
      });
  }
});

// @desc    Update an Assembly PCB Order by ID
const updateassemblyPCBById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body.updatedData || req.body;
    const {
      projectname,
      pcbQty,
      notes,
      assembly_zip,
      billingName,
      billingPhone,
      billinggAddress,
      billingCity,
      billingPostalCode,
      billingCountry,
      billingTax,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      receivePlace,
      userName,
      userEmail,
      confirmed_price,
      status,
      transferedNumber,
      isDelivered,
      manufactureOrderNumber,
      slot_buyer,
      slot_cashier,
      slot_manager,
      slot_sender,
      slot_quo_buyer,
      slot_quo_sales,
      slot_quo_manager,
    } = data;

    const [orderRows] = await db.query(
      `SELECT * FROM pcb_assembly_orders WHERE id = ?`,
      [id],
    );
    if (orderRows.length === 0) {
      res.status(404);
      throw new Error("Order not found");
    }

    let updateFields = [];
    let queryParams = [];

    const addField = (name, value) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${name} = ?`);
        queryParams.push(value);
      }
    };

    addField("projectname", projectname);
    addField("pcb_qty", pcbQty);
    addField("notes", notes);
    addField("gerber_zip", assembly_zip);
    addField("confirmed_price", confirmed_price);
    addField("userName", userName);
    addField("userEmail", userEmail);
    addField("receivePlace", receivePlace);
    addField("shippingName", shippingName);
    addField("shippingPhone", shippingPhone);
    addField("shippingAddress", shippingAddress);
    addField("shippingCity", shippingCity);
    addField("shippingPostalCode", shippingPostalCode);
    addField("shippingCountry", shippingCountry);
    addField("billingName", billingName);
    addField("billingPhone", billingPhone);
    addField("billinggAddress", billinggAddress);
    addField("billingCity", billingCity);
    addField("billingPostalCode", billingPostalCode);
    addField("billingCountry", billingCountry);
    addField("billingTax", billingTax);
    addField("status", status);
    addField("transferedNumber", transferedNumber);
    addField("isDelivered", isDelivered);
    addField("manufactureOrderNumber", manufactureOrderNumber);

    // Signature slots
    addField("slot_buyer", slot_buyer);
    addField("slot_cashier", slot_cashier);
    addField("slot_manager", slot_manager);
    addField("slot_sender", slot_sender);
    addField("slot_quo_buyer", slot_quo_buyer);
    addField("slot_quo_sales", slot_quo_sales);
    addField("slot_quo_manager", slot_quo_manager);

    if (updateFields.length === 0) {
      res.status(400);
      throw new Error("No fields to update");
    }

    updateFields.push("updated_at = NOW()");
    queryParams.push(id);

    const sql = `UPDATE pcb_assembly_orders SET ${updateFields.join(", ")} WHERE id = ?`;
    await db.query(sql, queryParams);

    res.json({ message: "Order updated successfully" });
  } catch (err) {
    console.error("Error during update:", err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update an Assembly Delivery Order by ID
const updateDeliveryassemblyPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transferedNumber } = req.body;

  try {
    const [orderRows] = await db.query(
      `SELECT * FROM pcb_assembly_orders WHERE id = ?`,
      [id],
    );
    if (orderRows.length === 0) {
      res.status(404);
      throw new Error("Order not found");
    }

    const deliveryOn = new Date();

    await db.query(
      `UPDATE pcb_assembly_orders SET isDelivered = ?, deliveryOn = ?, deliveryID = ?, transferedNumber = ? WHERE id = ?`,
      [true, deliveryOn, transferedNumber, transferedNumber, id],
    );
    res.json({ message: "Order marked as delivered" });
  } catch (err) {
    console.error("Error during delivery update:", err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    แอดมินอนุมัติการชำระเงิน
const updatePaymentassemblyPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const dbStatus =
    status === "Paid"
      ? "accepted"
      : status === "Reject"
        ? "rejected"
        : "pending";
  await db.execute(
    `UPDATE pcb_assembly_orders SET status = ?, updated_at = NOW() WHERE id = ?`,
    [dbStatus, id],
  );
  res.status(200).json({ success: true, message: `อัปเดตสำเร็จ` });
});

// @desc    Delete an Assembly PCB Order by ID
const deleteassemblyPCB = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch order to get files
    const [rows] = await db.execute(
      "SELECT paymentSlip, gerber_zip FROM pcb_assembly_orders WHERE id = ?",
      [id],
    );

    if (rows.length > 0) {
      const order = rows[0];
      deleteFile(order.paymentSlip);
      deleteFile(order.gerber_zip);
    }

    const [result] = await db.execute(
      "DELETE FROM pcb_assembly_orders WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @desc    Update Assembly PCB Manufacture Order Number
// @route   PUT /api/assemblypcbs/:pcborderId/pcbmanufacture
// @access  Protected (admin)
const updatePCBManufactureAssembly = asyncHandler(async (req, res) => {
  const { pcborderId } = req.params;
  const { manufactureOrderNumber } = req.body;

  try {
    const [orderRows] = await db.query(
      `SELECT * FROM pcb_assembly_orders WHERE id = ?`,
      [pcborderId],
    );
    if (orderRows.length === 0) {
      res.status(404);
      throw new Error("Order not found");
    }
    await db.query(
      `UPDATE pcb_assembly_orders SET manufactureOrderNumber = ?, updated_at = NOW() WHERE id = ?`,
      [manufactureOrderNumber, pcborderId],
    );
    res.json({ message: "Manufacture order number updated" });
  } catch (err) {
    console.error("Error during manufacture update:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = {
  createassemblyPCB,
  getassemblyPCBById,
  getassemblyPCBs,
  getassemblyPCBByUserId,
  getassemblyPCBByOrderId,
  updateassemblyPCBById,
  updateDeliveryassemblyPCBById,
  updatePaymentassemblyPCBById,
  updatePCBManufactureAssembly,
  deleteassemblyPCB,
  createassemblyPCBbyAdmin,
};
