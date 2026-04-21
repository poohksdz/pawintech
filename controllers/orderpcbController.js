const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");
const deleteFile = require("../utils/fileUtils");
const fs = require("fs");
const path = require("path");
const jsQR = require("jsqr");
const Jimp = require("jimp");

// ️️️ สำคัญมาก: เปลี่ยนชื่อตารางตรงนี้ให้ตรงกับในฐานข้อมูลของคุณ
const tableName = "order_pcbs";

// Helper: สร้าง Timestamp สำหรับ ID
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

//  Helper: ตรวจสอบหา QR Code ในรูปภาพ (อิงจาก Assembly)
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

// @desc    Create new PCB order
// @route   POST /api/orderpcbs
// @access  Private
const createOrderPCB = asyncHandler(async (req, res) => {
  const {
    orderItems,
    useId,
    userName,
    shippingAddress = {},
    billingAddress = {},
    paymentResult = {},
    receivePlace,
    itemsPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("ไม่มีรายการสินค้าในคำสั่งซื้อ");
  }

  //  1. ระบบตรวจจับสลิปด้วย QR Code (ดักจับรูปปลอม/รูปมั่ว)
  const paymentSlip = paymentResult?.image;
  if (!paymentSlip) {
    return res
      .status(400)
      .json({ success: false, message: "⚠️ กรุณาแนบรูปสลิปโอนเงิน" });
  }

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

  const isValidQR = await checkSlipQR(absoluteFilePath);
  if (!isValidQR) {
    // ถ้ารูปที่อัปมาไม่มี QR Code (เช่น รูปเซลฟี่) ให้ลบไฟล์ทิ้งแล้วตีกลับทันที
    if (fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
    return res.status(400).json({
      success: false,
      message: "⚠️ ไม่พบ QR Code ในรูปภาพ กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้อง",
    });
  }

  //  2. ระบบตรวจจับยอดเงิน (ป้องกันโอนไม่ครบ)
  const targetPrice = Number(totalPrice) || 0;
  const paidAmount = Number(paymentResult.transferedAmount) || 0;

  if (targetPrice > 0 && Math.abs(paidAmount - targetPrice) > 1.0) {
    if (fs.existsSync(absoluteFilePath)) fs.unlinkSync(absoluteFilePath);
    return res.status(400).json({
      success: false,
      message: `⚠️ ยอดโอนเงินไม่ถูกต้อง (ยอดที่ต้องชำระคือ ${targetPrice.toLocaleString()} บาท)`,
    });
  }

  // ️ เริ่มต้นกระบวนการบันทึกลง Database
  const userId = useId || req.user?._id;
  const baseOrderId = paymentResult?.orderID || `PCB-${getTimestamp()}`;
  const paymentConfirmId =
    paymentResult?.paymentComfirmID || `PAY-${getTimestamp()}`;

  const sql = `
        INSERT INTO \`${tableName}\` (
            orderID, paymentComfirmID, user_id, userName,
            projectname, pcb_quantity, length_cm, width_cm,
            base_material, layers, thickness_mm, color, silkscreen_color, surface_finish, copper_weight_oz, gerberZip,
            shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone, receivePlace,
            billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax,
            pcb_cost, ems, total_amount_cost, transferedAmount, transferedName, paymentSlip, transferedDate,
            order_type, quotation_no, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PCB_GERBER_ORDER', ?, NOW(), NOW())
    `;

  try {
    let index = 1;
    for (const item of orderItems) {
      const copperOunce = parseFloat(item.copper_weight_oz) || 1.0;
      const thicknessVal = parseFloat(item.thickness_mm) || 1.6;

      const uniqueRowOrderId = `${baseOrderId}-${Date.now().toString().slice(-4)}${index}`;

      const values = [
        uniqueRowOrderId,
        paymentConfirmId,
        userId,
        userName || "",

        item.projectname || "Untitled",
        item.pcb_quantity || 0,
        item.length_cm || 0,
        item.width_cm || 0,
        item.base_material || "",
        item.layers || 0,
        thicknessVal,
        item.color || "",
        item.silkscreen_color || "",
        item.surface_finish || "",
        copperOunce,
        item.gerberZip || "",

        shippingAddress.shippingname || "",
        shippingAddress.address || "",
        shippingAddress.city || "",
        shippingAddress.postalCode || "",
        shippingAddress.country || "",
        shippingAddress.phone || "",
        receivePlace || "bysending",

        billingAddress.billingName || "",
        billingAddress.billinggAddress || "",
        billingAddress.billingCity || "",
        billingAddress.billingPostalCode || "",
        billingAddress.billingCountry || "",
        billingAddress.billingPhone || "",
        billingAddress.tax || "",

        itemsPrice || 0,
        shippingPrice || 0,
        item.price || totalPrice || 0,
        paidAmount,
        paymentResult.transferedName || "",
        cleanPaymentSlip, // บันทึก Path รูปภาพที่ผ่านการตรวจสอบแล้ว
        paymentResult.transferedDate || new Date(),
        item.quotation_no || null,
      ];

      await pool.query(sql, values);
      index++;
    }

    res
      .status(201)
      .json({
        success: true,
        message: "บันทึกคำสั่งซื้อสำเร็จ",
        orderId: baseOrderId,
      });
  } catch (error) {
    console.error("🔥 Error creating PCB order:", error);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// @desc    ดึงประวัติออเดอร์ PCB
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  try {
    const sql = `
      SELECT * FROM \`${tableName}\` 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql, [userId]);

    res.status(200).json({
      success: true,
      orders: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// @desc    ดึงออเดอร์ทั้งหมด (สำหรับ Admin)
const getOrders = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM \`${tableName}\` ORDER BY created_at DESC`,
  );
  res.status(200).json({ success: true, data: rows });
});

// @desc    ดึงตาม ID
const getOrderById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM \`${tableName}\` WHERE id = ?`,
    [req.params.id],
  );
  if (rows.length === 0)
    return res.status(404).json({ success: false, message: "Not found" });
  res.status(200).json({ success: true, data: rows[0] });
});

// @desc    ดึงตาม orderID (Human Readable ID)
const getOrderPCBByorderID = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM \`${tableName}\` WHERE orderID = ?`,
    [req.params.orderID],
  );
  if (rows.length === 0)
    return res.status(404).json({ success: false, message: "Not found" });
  res.status(200).json({ success: true, data: rows[0] });
});

// @desc    Create PCB order by Admin (for reordering / manual entry)
// @route   POST /api/orderpcbs/createorderpcbbyadmin
// @access  Private/Admin
const createOrderPCBbyAdmin = asyncHandler(async (req, res) => {
  const { orderData } = req.body;

  if (!orderData) {
    res.status(400);
    throw new Error("No order data provided");
  }

  const {
    customerInfo,
    sellerInfo,
    shippingAddress,
    billingAddress,
    ...pcbData
  } = orderData;

  const baseOrderId = `PCB-${getTimestamp()}`;
  const paymentConfirmId = `PAY-ADMIN-${getTimestamp()}`;

  const sql = `
        INSERT INTO \`${tableName}\` (
            orderID, paymentComfirmID, user_id, userName,
            projectname, pcb_quantity, length_cm, width_cm,
            base_material, layers, thickness_mm, color, silkscreen_color, surface_finish, copper_weight_oz, gerberZip,
            shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone, receivePlace,
            billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax,
            pcb_cost, ems, total_amount_cost, quoted_price_to_customer, transferedAmount, transferedName, paymentSlip, transferedDate,
            status, confirmedPrice, confirmedReason,
            order_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PCB_GERBER_ORDER', NOW(), NOW())
    `;

  try {
    const values = [
      baseOrderId,
      paymentConfirmId,
      customerInfo.customerUserID || req.user?._id,
      customerInfo.customerName || "",

      pcbData.projectname || "Untitled",
      pcbData.pcb_quantity || 0,
      pcbData.length_cm || 0,
      pcbData.width_cm || 0,
      pcbData.base_material || "",
      pcbData.layers || 0,
      pcbData.thickness_mm || 1.6,
      pcbData.color || "",
      pcbData.silkscreen_color || "",
      pcbData.surface_finish || "",
      pcbData.copper_weight_oz || 1.0,
      pcbData.gerberZip || "",

      shippingAddress.shippingname || "",
      shippingAddress.address || "",
      shippingAddress.city || "",
      shippingAddress.postalCode || "",
      shippingAddress.country || "",
      shippingAddress.phone || "",
      shippingAddress.receivePlace || "bysending",

      billingAddress.billingName || "",
      billingAddress.billinggAddress || "",
      billingAddress.billingCity || "",
      billingAddress.billingPostalCode || "",
      billingAddress.billingCountry || "",
      billingAddress.billingPhone || "",
      billingAddress.tax || "",

      pcbData.price || 0, // pcb_cost
      0, // ems
      pcbData.price || 0, // total_amount_cost
      pcbData.price || 0, // quoted_price_to_customer
      pcbData.transferedAmount || 0,
      pcbData.transferedName || "ADMIN_OVERRIDE",
      pcbData.paymentSlip || "",
      pcbData.transferedDate || new Date(),

      pcbData.status || "accepted",
      pcbData.confirmedPrice || pcbData.price || 0,
      pcbData.confirmedReason || "Direct Admin Creation",
    ];

    await pool.query(sql, values);
    res
      .status(201)
      .json({
        success: true,
        message: "Admin order created successfully",
        orderId: baseOrderId,
      });
  } catch (error) {
    console.error("🔥 Error creating PCB order by Admin:", error);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// @desc    Admin ยืนยันการชำระเงิน (เช็คสลิปผ่านแล้ว เปลี่ยนเป็นกำลังผลิต)
const verifyPaymentPCB = asyncHandler(async (req, res) => {
  const { manufactureOrderNumber } = req.body;
  const sql = `UPDATE \`${tableName}\` SET isManufacting = 1, manfactingDate = NOW(), manufactureOrderNumber = ? WHERE paymentComfirmID = ? OR orderID = ? OR id = ?`;
  const [result] = await pool.query(sql, [
    manufactureOrderNumber || "",
    req.params.id,
    req.params.id,
    req.params.id,
  ]);

  if (result.affectedRows > 0) {
    res
      .status(200)
      .json({
        success: true,
        message: "ยืนยันยอดเงินเรียบร้อย ระบบเปลี่ยนสถานะเป็น กำลังผลิต",
      });
  } else {
    res.status(404).json({ success: false, message: "ไม่พบคำสั่งซื้อนี้" });
  }
});

// @desc    Admin อัปเดตสถานะการจัดส่ง และกรอกเลข Tracking
const updateDeliveryPCB = asyncHandler(async (req, res) => {
  const { transferedNumber } = req.body;

  const sql = `UPDATE \`${tableName}\` SET isDelivered = 1, deliveryat = NOW(), transferedNumber = ? WHERE paymentComfirmID = ? OR orderID = ? OR id = ?`;
  const [result] = await pool.query(sql, [
    transferedNumber,
    req.params.id,
    req.params.id,
    req.params.id,
  ]);

  if (result.affectedRows > 0) {
    res
      .status(200)
      .json({
        success: true,
        message: "อัปเดตสถานะจัดส่ง พร้อมบันทึกเลขพัสดุเรียบร้อย",
      });
  } else {
    res.status(404).json({ success: false, message: "ไม่พบคำสั่งซื้อนี้" });
  }
});

// @desc    Update a PCB order (Admin for general status update)
// @route   PUT /api/orderpcbs/:id
// @access  Private/Admin
const updateOrderPCB = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  // Allowlist of columns that can be updated via this endpoint
  const ALLOWED_COLUMNS = [
    "status",
    "confirmedPrice",
    "confirmedReason",
    "isManufacting",
    "manfactingDate",
    "manufactureOrderNumber",
    "isDelivered",
    "deliveryat",
    "transferedNumber",
    "receivePlace",
    "projectname",
    "notes",
    "quotation_no",
  ];

  // Filter to only allowlisted columns
  const filteredData = {};
  for (const key of ALLOWED_COLUMNS) {
    if (updatedData[key] !== undefined) {
      filteredData[key] = updatedData[key];
    }
  }

  // Build SET clause dynamically for safe updates
  const fields = Object.keys(filteredData)
    .map((key) => `\`${key}\` = ?`)
    .join(", ");
  const values = Object.values(filteredData);

  if (fields.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No data to update" });
  }

  const sql = `UPDATE \`${tableName}\` SET ${fields}, updated_at = NOW() WHERE paymentComfirmID = ? OR orderID = ? OR id = ?`;
  const [result] = await pool.query(sql, [...values, id, id, id]);

  if (result.affectedRows > 0) {
    res.status(200).json({ success: true, message: "บันทึกข้อมูลเรียบร้อย" });
  } else {
    res.status(404).json({ success: false, message: "ไม่พบคำสั่งซื้อนี้" });
  }
});

// @desc    Delete a Gerber order
// @route   DELETE /api/orderpcbs/:id
// @access  Private/Admin
const deleteOrderPCB = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT paymentSlip, gerberZip FROM \`${tableName}\` WHERE id = ?`,
      [id],
    );
    if (rows.length > 0) {
      const order = rows[0];
      deleteFile(order.paymentSlip);
      deleteFile(order.gerberZip);
    }
    const [result] = await pool.query(
      `DELETE FROM \`${tableName}\` WHERE id = ?`,
      [id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, message: "ลบสำเร็จ" });
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// @desc    Get all PCB configuration (rates, materials, defaults)
// @route   GET /api/orderpcbs/getownshippingrates
// @access  Private
const getOwnShippingRates = asyncHandler(async (req, res) => {
  try {
    const [defaultPricing] = await pool.query(
      "SELECT * FROM orderpcbdefaultprice ORDER BY created_at DESC LIMIT 1",
    );
    const [shippingRates] = await pool.query(
      "SELECT * FROM shipping_rates ORDER BY weight_kg ASC",
    );
    const [baseMaterials] = await pool.query("SELECT * FROM base_materials");
    const [surfaceFinishes] = await pool.query(
      "SELECT * FROM surface_finishes",
    );
    const [copperWeights] = await pool.query("SELECT * FROM copper_weights");
    const [pcbColors] = await pool.query("SELECT * FROM pcb_colors");

    const pricing = defaultPricing[0] || {};
    const formattedPricing = {
      ...pricing,
      base_price: Number(pricing.base_price) || 0,
      price_per_cm2: Number(pricing.price_per_cm2) || 0,
      extra_service_fee: Number(pricing.extra_service_fee) || 0,
      profit_margin: Number(pricing.profit_margin) || 0,
      exchange_rate: Number(pricing.exchange_rate) || 0,
      vat_percent: Number(pricing.vat_percent) || 0,
      build_time: Number(pricing.build_time) || 0,
      dhl_service_fixed: Number(pricing.dhl_service_fixed) || 0,
    };

    res.status(200).json({
      success: true,
      defaultPricing: formattedPricing,
      shippingRates: shippingRates || [],
      baseMaterials: baseMaterials || [],
      surfaceFinishes: surfaceFinishes || [],
      copperWeights: copperWeights || [],
      pcbColors: pcbColors || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

// @desc    Update PCB configuration
// @route   PUT /api/orderpcbs/shippingrates
// @access  Private/Admin
const updateShippingRates = asyncHandler(async (req, res) => {
  const {
    base_price,
    price_per_cm2,
    extra_service_fee,
    profit_margin,
    exchange_rate,
    vat_percent,
    build_time,
    dhl_service_fixed,
    bulk_shipping_rates,
    baseMaterials,
    surfaceFinishes,
    copperWeights,
    pcbColors,
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update Default Pricing
    const [check] = await connection.query(
      "SELECT id FROM orderpcbdefaultprice LIMIT 1",
    );
    if (check.length > 0) {
      await connection.query(
        `UPDATE orderpcbdefaultprice SET 
                base_price=?, price_per_cm2=?, extra_service_fee=?, profit_margin=?, 
                exchange_rate=?, vat_percent=?, build_time=?, dhl_service_fixed=? 
                WHERE id=?`,
        [
          base_price,
          price_per_cm2,
          extra_service_fee,
          profit_margin,
          exchange_rate,
          vat_percent,
          build_time,
          dhl_service_fixed,
          check[0].id,
        ],
      );
    } else {
      await connection.query(
        `INSERT INTO orderpcbdefaultprice 
                (base_price, price_per_cm2, extra_service_fee, profit_margin, exchange_rate, vat_percent, build_time, dhl_service_fixed) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          base_price,
          price_per_cm2,
          extra_service_fee,
          profit_margin,
          exchange_rate,
          vat_percent,
          build_time,
          dhl_service_fixed,
        ],
      );
    }

    // 2. Update Shipping Rates
    if (bulk_shipping_rates) {
      await connection.query("DELETE FROM shipping_rates");
      for (const rate of bulk_shipping_rates) {
        await connection.query(
          "INSERT INTO shipping_rates (id, shipping_type, weight_kg, price) VALUES (UUID(), ?, ?, ?)",
          [rate.shipping_type, rate.weight_kg, rate.price],
        );
      }
    }

    // 3. Update Materials/Colors/etc
    const updateTable = async (table, items) => {
      if (items) {
        for (const item of items) {
          await connection.query(
            `UPDATE \`${table}\` SET price=? WHERE name=?`,
            [item.price, item.name],
          );
        }
      }
    };

    await updateTable("base_materials", baseMaterials);
    await updateTable("surface_finishes", surfaceFinishes);
    await updateTable("copper_weights", copperWeights);
    await updateTable("pcb_colors", pcbColors);

    await connection.commit();
    res
      .status(200)
      .json({ success: true, message: "Configuration updated successfully" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  } finally {
    connection.release();
  }
});

// @desc    ดึงออเดอร์ตาม paymentComfirmID
const getOrderPCBByorderpaymentID = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM \`${tableName}\` WHERE paymentComfirmID = ?`,
    [req.params.id],
  );
  res.status(200).json({ success: true, orders: rows });
});

module.exports = {
  createOrderPCB,
  createOrderPCBbyAdmin,
  getMyOrders,
  getOrders,
  getOrderById,
  getOrderPCBByorderID,
  getOwnShippingRates,
  updateShippingRates,
  verifyPaymentPCB,
  updateDeliveryPCB,
  updateOrderPCB,
  deleteOrderPCB,
  getOrderPCBByorderpaymentID,
};
