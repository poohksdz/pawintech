const asyncHandler = require("../middleware/asyncHandler");
const { pool: db } = require("../config/db.js");
const deleteFile = require("../utils/fileUtils");
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

// Utility: Generate unique payment confirm ID
const generateUniquePaymentConfirmID = async () => {
  const base = getTimestamp();
  let counter = 1;
  let uniqueID;
  let isUnique = false;

  while (!isUnique) {
    const suffix = String(counter).padStart(3, "0");
    uniqueID = `PCPP-${base}${suffix}`;

    const [rows] = await db.execute(
      "SELECT id FROM pcb_copy_orders WHERE paymentComfirmID = ?",
      [uniqueID],
    );

    if (rows.length === 0) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  return uniqueID;
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

// Helper: format Date -> MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
const toMySQLDatetime = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

// @desc    Fetch all PCB copy  Orders
// @route   GET /api/copypcbs
// @access  Public
const getcopyPCBs = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_copy_orders ORDER BY created_at DESC",
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch PCB copy orders",
      error: "Internal server error",
    });
  }
});

// @desc    Fetch single PCB copy  by ID
// @route   GET /api/copypcbs/:id
// @access  Public
const getcopyPCBById = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_copy_orders WHERE id = ?",
      [req.params.id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: "Internal server error",
    });
  }
});

// @desc    Fetch PCB copy  orders by User ID
// @route   GET /api/copypcbs/user/:userid
// @access  Public
const getcopyPCBByUserId = asyncHandler(async (req, res) => {
  const user_id = req.params.userId;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_copy_orders WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No copy  orders found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch copy  orders",
      error: "Internal server error",
    });
  }
});

// @desc    Fetch PCB copy orders by Order ID
// @route   GET /api/copypcbs/order/:orderId
// @access  Public
const getcopyPCBByOrderId = asyncHandler(async (req, res) => {
  const orderID = req.params.orderId;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM pcb_copy_orders WHERE orderID = ? ORDER BY created_at DESC",
      [orderID],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No copy orders found for this order.",
      });
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("getcopyPCBByOrderId error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch copy orders",
    });
  }
});

// @desc    Create a new PCB copy  Order
// @route   POST /api/copypcbs
// @access  Public or Protected
const createcopyPCB = asyncHandler(async (req, res) => {
  try {
    const payload = req.body.orderData || req.body;
    const {
      cartId,
      userId,
      userName,
      userEmail,
      transferedAmount,
      transferedName,
      transferedDate,
      paymentSlip,
      receivePlace,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      billingName,
      billinggAddress,
      billingCity,
      billingPostalCode,
      billingCountry,
      billingPhone,
      billingTax,
    } = payload;

    if (!cartId)
      return res
        .status(400)
        .json({ success: false, message: "⚠️ ไม่พบข้อมูลตะกร้าสินค้า" });
    if (!paymentSlip)
      return res
        .status(400)
        .json({ success: false, message: "⚠️ กรุณาแนบรูปสลิปโอนเงิน" });

    // 1. ดึงข้อมูลต้นฉบับจากตะกร้า
    const [cartRows] = await db.execute(
      `SELECT * FROM pcb_copy_carts WHERE id = ?`,
      [cartId],
    );
    if (cartRows.length === 0)
      return res
        .status(404)
        .json({
          success: false,
          message: "ไม่พบข้อมูลตะกร้าที่ต้องการชำระเงิน",
        });
    const cart = cartRows[0];

    // ตรวจสอบขั้นต่ำ 5 ชิ้น
    if (Number(cart.pcb_qty) < 5) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You order amount must not lower than 5 pices",
        });
    }

    // 2. จัดการ Path สลิป
    let cleanPaymentSlip = paymentSlip.replace(/\\/g, "/");
    if (!cleanPaymentSlip.startsWith("/"))
      cleanPaymentSlip = "/" + cleanPaymentSlip;

    // --------------------------------------------------------------------------
    //  ตรวจสอบความถูกต้องของสลิปและยอดเงิน
    // --------------------------------------------------------------------------
    const absoluteFilePath = path.join(__dirname, "..", cleanPaymentSlip);

    // 2.1 ตรวจสอบยอดเงิน
    const targetPrice = Number(cart.confirmed_price);
    const paidAmount = Number(transferedAmount);

    if (paidAmount !== targetPrice) {
      if (fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
      return res.status(400).json({
        success: false,
        message: `⚠️ ยอดโอนเงินไม่ถูกต้อง (ยอดที่ต้องชำระคือ ${targetPrice} บาท)`,
      });
    }

    // 2.2 ตรวจสอบว่ารูปภาพมี QR Code หรือไม่
    const isValidQR = await checkSlipQR(absoluteFilePath);

    if (!isValidQR) {
      if (fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
      return res.status(400).json({
        success: false,
        message: "⚠️ ไม่พบ QR Code ในรูปภาพ กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้อง",
      });
    }
    // --------------------------------------------------------------------------

    // 3. สร้าง OrderID
    let count = 1,
      orderID = "",
      isUnique = false;
    const targetUserId = userId || cart.user_id || 0;
    while (!isUnique) {
      orderID = `${parseInt(targetUserId) + 1000}PCP${count}`;
      const [existing] = await db.execute(
        `SELECT id FROM pcb_copy_orders WHERE orderID = ?`,
        [orderID],
      );
      if (existing.length === 0) isUnique = true;
      else count++;
    }

    const paymentComfirmID = await generateUniquePaymentConfirmID();

    //  4. คำสั่ง SQL บันทึกข้อมูล
    const insertSql = `
        INSERT INTO pcb_copy_orders (
            projectname, user_id, pcb_qty, notes, copypcb_zip,
            front_image_1, front_image_2, front_image_3, front_image_4, front_image_5,
            front_image_6, front_image_7, front_image_8, front_image_9, front_image_10,
            back_image_1, back_image_2, back_image_3, back_image_4, back_image_5,
            back_image_6, back_image_7, back_image_8, back_image_9, back_image_10,
            status, confirmed_price, created_at, updated_at,
            userName, userEmail, 
            shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone, 
            receivePlace, 
            billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax,
            transferedAmount, transferedName, paymentSlip, transferedDate,
            orderID, paymentComfirmID, cartId, quotation_no, isDelivered
        ) VALUES (
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, 
            'paid', ?, NOW(), NOW(), 
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
      cart.copypcb_zip,
      cart.front_image_1,
      cart.front_image_2,
      cart.front_image_3,
      cart.front_image_4,
      cart.front_image_5,
      cart.front_image_6,
      cart.front_image_7,
      cart.front_image_8,
      cart.front_image_9,
      cart.front_image_10,
      cart.back_image_1,
      cart.back_image_2,
      cart.back_image_3,
      cart.back_image_4,
      cart.back_image_5,
      cart.back_image_6,
      cart.back_image_7,
      cart.back_image_8,
      cart.back_image_9,
      cart.back_image_10,
      cart.confirmed_price,
      userName || cart.userName,
      userEmail || cart.userEmail,
      shippingName || cart.shippingName,
      shippingAddress || cart.shippingAddress,
      shippingCity || cart.shippingCity,
      shippingPostalCode || cart.shippingPostalCode,
      shippingCountry || cart.shippingCountry,
      shippingPhone || cart.shippingPhone,
      receivePlace || cart.receivePlace || "bysending",
      billingName || cart.billingName,
      billinggAddress || cart.billinggAddress,
      billingCity || cart.billingCity,
      billingPostalCode || cart.billingPostalCode,
      billingCountry || cart.billingCountry,
      billingPhone || cart.billingPhone,
      billingTax || cart.billingTax,
      transferedAmount,
      transferedName,
      cleanPaymentSlip,
      transferedDate,
      orderID,
      paymentComfirmID,
      cartId,
      cart.quotation_no || null,
    ];

    await db.execute(insertSql, insertValues);

    // 5. อัปเดตตะกร้าเดิมเป็นจ่ายแล้ว
    await db.execute(`UPDATE pcb_copy_carts SET status = 'paid' WHERE id = ?`, [
      cartId,
    ]);

    return res
      .status(201)
      .json({ success: true, message: "ชำระเงินสำเร็จ!", orderID });
  } catch (error) {
    console.error("🔥 Backend Error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        error: "Internal server error",
      });
  }
});

// @desc    Create a new PCB copy  Order
// @route   POST /api/createcopypcbbyadmin
// @access  Public or Protected (depends on auth logic)
const createcopyPCBbyAdmin = asyncHandler(async (req, res) => {
  const data = req.body || {};

  console.log(data);

  if (
    !data.projectname ||
    !data.customerInfo ||
    !data.customerInfo.customerUserID
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: projectname and customerInfo.customerUserID are required",
    });
  }

  let useId = data.customerInfo.customerUserID;

  try {
    const frontImages = (data.copypcbFrontImages || []).slice(0, 10);
    const backImages = (data.copypcbBackImages || []).slice(0, 10);
    const frontCols = Array.from(
      { length: 10 },
      (_, i) => frontImages[i] || "",
    );
    const backCols = Array.from({ length: 10 }, (_, i) => backImages[i] || "");

    let count = 1;
    let orderID;
    let isUnique = false;
    while (!isUnique) {
      orderID = `${parseInt(useId) + 1000}PCP${count}`;
      const [existing] = await db.execute(
        `SELECT id FROM pcb_copy_orders WHERE orderID = ?`,
        [orderID],
      );
      if (existing.length === 0) {
        isUnique = true;
      } else {
        count++;
      }
    }

    const paymentComfirmID = await generateUniquePaymentConfirmID();

    const columns = [
      "projectname",
      "compay_name",
      "user_id",
      "pcb_qty",
      "notes",
      "copypcb_zip",
      "front_image_1",
      "front_image_2",
      "front_image_3",
      "front_image_4",
      "front_image_5",
      "front_image_6",
      "front_image_7",
      "front_image_8",
      "front_image_9",
      "front_image_10",
      "back_image_1",
      "back_image_2",
      "back_image_3",
      "back_image_4",
      "back_image_5",
      "back_image_6",
      "back_image_7",
      "back_image_8",
      "back_image_9",
      "back_image_10",
      "service_type",
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
      "userAddress",
      "userPhone",
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
      data.customerInfo?.customerCompanyName || "",
      data.user_id || "",
      data.pcb_qty || 0,
      data.notes || "",
      data.copypcb_zip || "",
      ...frontCols,
      ...backCols,
      data.service_type || "copy",
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
      data.customerInfo?.customerAddress || "",
      data.customerInfo?.customerPhoneNumber || "",
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
    const sql = `INSERT INTO pcb_copy_orders (${columns.join(",")}) VALUES (${placeholders})`;

    let beganTx = false;
    try {
      if (typeof db.beginTransaction === "function") {
        await db.beginTransaction();
        beganTx = true;
      }

      const [result] = await db.execute(sql, values);

      if (beganTx && typeof db.commit === "function") {
        await db.commit();
      }

      return res.status(201).json({
        success: true,
        message: "PCB copy order created successfully",
        insertedId: result.insertId,
        orderID,
        paymentComfirmID,
      });
    } catch (execErr) {
      if (beganTx && typeof db.rollback === "function") {
        try {
          await db.rollback();
        } catch (rb) {
          console.error("rollback failed", rb);
        }
      }
      console.error("Insert error:", execErr);
      return res.status(500).json({
        success: false,
        message: "Failed to insert pcb copy order",
        error: execErr.message,
      });
    }
  } catch (error) {
    console.error("Error creating PCB copy order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create PCB copy order",
      error: "Internal server error",
    });
  }
});

// @desc    Update a PCB copy Order by ID
// @route   PUT /api/copypcbs/:id
// @access  Protected (admin or owner)
const updatecopyPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    projectname,
    pcbQty,
    notes,
    copypcb_zip,
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
    copypcbFrontImages = [],
    copypcbBackImages = [],
    custom_price,
  } = req.body;

  if (!custom_price || custom_price === "" || custom_price === 0) {
    res.status(400);
    throw new Error("Please provide a custom price");
  }

  const confirmed_price = custom_price;

  try {
    const [orderRows] = await db.query(
      `SELECT * FROM pcb_copy_orders WHERE id = ?`,
      [id],
    );

    if (orderRows.length === 0) {
      res.status(404);
      throw new Error("Order not found");
    }

    const getFrontImage = (index) => {
      let img = copypcbFrontImages[index] || null;
      if (img && typeof img === "object") img = img.path || img.url;
      if (img && typeof img === "string" && !img.startsWith("/"))
        return "/" + img;
      return img;
    };

    const getBackImage = (index) => {
      let img = copypcbBackImages[index] || null;
      if (img && typeof img === "object") img = img.path || img.url;
      if (img && typeof img === "string" && !img.startsWith("/"))
        return "/" + img;
      return img;
    };

    const frontImages = [];
    const backImages = [];
    for (let i = 0; i < 10; i++) {
      frontImages.push(getFrontImage(i));
      backImages.push(getBackImage(i));
    }

    const updatedAt = new Date();

    const sql = `
      UPDATE pcb_copy_orders SET
        projectname = ?, pcb_qty = ?, notes = ?, copypcb_zip = ?, confirmed_price = ?,
        front_image_1 = ?, front_image_2 = ?, front_image_3 = ?, front_image_4 = ?, front_image_5 = ?,
        front_image_6 = ?, front_image_7 = ?, front_image_8 = ?, front_image_9 = ?, front_image_10 = ?,
        back_image_1 = ?, back_image_2 = ?, back_image_3 = ?, back_image_4 = ?, back_image_5 = ?,
        back_image_6 = ?, back_image_7 = ?, back_image_8 = ?, back_image_9 = ?, back_image_10 = ?,
        billingName = ?, billingPhone = ?, billinggAddress = ?, billingCity = ?, billingPostalCode = ?, billingCountry = ?, billingTax = ?,
        shippingName = ?, shippingPhone = ?, shippingAddress = ?, shippingCity = ?, shippingPostalCode = ?, shippingCountry = ?, receivePlace = ?,
        userName = ?, userEmail = ?, updated_at = ?
      WHERE id = ?
    `;

    const values = [
      projectname,
      pcbQty,
      notes,
      copypcb_zip,
      confirmed_price,
      ...frontImages,
      ...backImages,
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
      updatedAt,
      id,
    ];

    await db.query(sql, values);

    res.json({ message: "Order updated successfully" });
  } catch (err) {
    console.error("Error during update:", err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update a PCB Delivery copy  Order by ID
// @route   PUT /api/copypcbs/delivery/:id
// @access  Protected (admin or owner)
const updateDeliverycopyPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transferedNumber } = req.body;

  try {
    const [orderRows] = await db.query(
      `SELECT * FROM pcb_copy_orders WHERE id = ?`,
      [id],
    );

    if (orderRows.length === 0) {
      res.status(404);
      throw new Error("Order not found");
    }

    const deliveryOn = new Date();

    await db.query(
      `UPDATE pcb_copy_orders
       SET isDelivered = ?, deliveryOn = ?, deliveryID = ?, transferedNumber = ?
       WHERE id = ?`,
      [true, deliveryOn, transferedNumber, transferedNumber, id],
    );

    res.json({ message: "Order marked as delivered" });
  } catch (err) {
    console.error("Error during delivery update:", err);
    res.status(500).json({ message: err.message });
  }
});

// @desc    แอดมินอนุมัติการชำระเงิน (ปรับเหมือนหน้า CustomPCB)
// @route   PUT /api/copypcbs/paymentrates/:id
// @access  Protected (admin)
const updatePaymentcopyPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const dbStatus =
    status === "Paid"
      ? "accepted"
      : status === "Reject"
        ? "rejected"
        : "pending";
  await db.execute(
    `UPDATE pcb_copy_orders SET status = ?, updated_at = NOW() WHERE id = ?`,
    [dbStatus, id],
  );
  res.status(200).json({ success: true, message: `อัปเดตสำเร็จ` });
});

// @desc    Delete a PCB copy  Order by ID
// @route   DELETE /api/copypcbs/:id
// @access  Protected (admin or owner)
const deletecopyPCB = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch order to get files
    const [rows] = await db.execute(
      "SELECT paymentSlip, copypcb_zip, front_image_1, front_image_2, front_image_3, front_image_4, front_image_5, front_image_6, front_image_7, front_image_8, front_image_9, front_image_10, back_image_1, back_image_2, back_image_3, back_image_4, back_image_5, back_image_6, back_image_7, back_image_8, back_image_9, back_image_10 FROM pcb_copy_orders WHERE id = ?",
      [id],
    );

    if (rows.length > 0) {
      const order = rows[0];
      deleteFile(order.paymentSlip);
      deleteFile(order.copypcb_zip);
      for (let i = 1; i <= 10; i++) {
        deleteFile(order[`front_image_${i}`]);
        deleteFile(order[`back_image_${i}`]);
      }
    }

    const [result] = await db.execute(
      "DELETE FROM pcb_copy_orders WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

module.exports = {
  createcopyPCB,
  getcopyPCBById,
  getcopyPCBs,
  getcopyPCBByUserId,
  getcopyPCBByOrderId,
  updatecopyPCBById,
  updateDeliverycopyPCBById,
  updatePaymentcopyPCBById,
  deletecopyPCB,
  createcopyPCBbyAdmin,
};
