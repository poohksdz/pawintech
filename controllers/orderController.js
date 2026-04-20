const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");
const path = require("path");
const Jimp = require("jimp");
const jsQR = require("jsqr");

// ️ ฟังก์ชันถอดรหัสยอดเงินจาก QR Code
function extractAmountFromQR(payload) {
  let i = 0;
  while (i < payload.length - 4) {
    const tag = payload.substring(i, i + 2);
    const lenStr = payload.substring(i + 2, i + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len)) break;
    const val = payload.substring(i + 4, i + 4 + len);
    if (tag === "54") return parseFloat(val);
    i += 4 + len;
  }
  return null;
}

// @desc    ดึงข้อมูลประวัติออเดอร์รวม (แก้ปัญหาตาราง PCB ไม่มี isPaid)
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let allOrders = [];

  try {
    // 1. ดึงออเดอร์สินค้าทั่วไป (ตาราง orders มี isPaid เลยใช้ได้ปกติ)
    try {
      const [orders] = await pool.query(
        `SELECT o.*, 
        (SELECT GROUP_CONCAT(productName SEPARATOR ', ') FROM orderitems WHERE order_id = o.id) as projectname 
        FROM orders o WHERE o.user_id = ?`,
        [userId],
      );
      orders.forEach((o) =>
        allOrders.push({
          id: o.id,
          orderType: "product",
          amount: o.totalPrice,
          qty: o.totalQty,
          status: o.status,
          isPaid: o.isPaid,
          isDelivered: o.isDelivered,
          deliveryID: o.transferedNumber,
          receivePlace: o.receivePlace,
          createdAt: o.createdAt,
          projectname: o.projectname,
          paymentSlip: o.paymentSlip,
          quotation_no: o.quotation_no || null,
        }),
      );
    } catch (e) {
      console.error("Error fetching normal orders:", e.message);
    }

    // 2. ดึง Custom PCB (ลบ isPaid ออก ใช้แค่ status กับ paymentSlip)
    try {
      const [customs] = await pool.query(
        `SELECT * FROM pcb_custom_orders WHERE user_id = ? AND (status IN ('paid', 'accepted') OR paymentSlip IS NOT NULL AND paymentSlip != '')`,
        [userId],
      );
      customs.forEach((o) =>
        allOrders.push({
          id: o.id,
          orderType: "custom",
          amount: o.confirmed_price || o.total_amount_cost,
          qty: o.pcb_qty,
          status: o.status || "paid",
          isPaid: 1,
          isDelivered: o.isDelivered,
          deliveryID: o.deliveryID || o.transferedNumber,
          receivePlace: o.receivePlace,
          createdAt: o.created_at,
          projectname: o.projectname,
          paymentSlip: o.paymentSlip,
          quotation_no: o.quotation_no || null,
        }),
      );
    } catch (e) {
      console.error("Error fetching custom orders:", e.message);
    }

    // 3. ดึง Copy PCB (ลบ isPaid ออก)
    try {
      const [copies] = await pool.query(
        `SELECT * FROM pcb_copy_orders WHERE user_id = ? AND (status IN ('paid', 'accepted') OR paymentSlip IS NOT NULL AND paymentSlip != '')`,
        [userId],
      );
      copies.forEach((o) =>
        allOrders.push({
          id: o.id,
          orderType: "copy",
          amount: o.confirmed_price || o.transferedAmount,
          qty: o.pcb_qty,
          status: o.status || "paid",
          isPaid: 1,
          isDelivered: o.isDelivered || 0,
          deliveryID: o.deliveryID || null,
          receivePlace: o.receivePlace || "bysending",
          createdAt: o.created_at,
          projectname: o.projectname || "งาน Copy PCB",
          paymentSlip: o.paymentSlip || "",
          quotation_no: o.quotation_no || null,
        }),
      );
    } catch (e) {
      console.error("Error fetching copy orders:", e.message);
    }

    // 4. ดึง Assembly PCB (ลบ isPaid ออก)
    try {
      const [assemblies] = await pool.query(
        `SELECT * FROM pcb_assembly_orders WHERE user_id = ? AND (status IN ('paid', 'accepted') OR paymentSlip IS NOT NULL AND paymentSlip != '')`,
        [userId],
      );
      assemblies.forEach((o) =>
        allOrders.push({
          id: o.id,
          orderType: "assembly",
          amount: o.confirmed_price || o.estimatedCost,
          qty: o.pcb_qty,
          status: o.status || "paid",
          isPaid: 1,
          isDelivered: o.isDelivered || 0,
          deliveryID: o.deliveryID || null,
          receivePlace: o.receivePlace || "bysending",
          createdAt: o.created_at,
          projectname: o.projectname || "งาน Assembly PCB",
          paymentSlip: o.paymentSlip || "",
          quotation_no: o.quotation_no || null,
        }),
      );
    } catch (e) {
      console.error("Error fetching assembly orders:", e.message);
    }

    // 5. ดึง Standard PCB (ที่เพิ่งทำเสร็จใหม่)
    try {
      const [pcbs] = await pool.query(
        `SELECT * FROM order_pcbs WHERE user_id = ? AND paymentSlip IS NOT NULL AND paymentSlip != ''`,
        [userId],
      );
      pcbs.forEach((o) =>
        allOrders.push({
          id: o.id,
          orderType: "pcb",
          amount: o.total_amount_cost,
          qty: o.pcb_quantity,
          status: o.status || (o.isManufacting ? "manufacturing" : "paid"),
          isPaid: 1,
          isDelivered: o.isDelivered,
          deliveryID: o.transferedNumber,
          receivePlace: o.receivePlace,
          createdAt: o.created_at,
          projectname: o.projectname,
          paymentSlip: o.paymentSlip,
          isManufacting: o.isManufacting,
          quotation_no: o.quotation_no || null,
        }),
      );
    } catch (e) {
      console.error("Error fetching standard orders:", e.message);
    }

    // นำออเดอร์ทั้งหมดมาเรียงตามวันที่ (ใหม่ล่าสุดขึ้นก่อน)
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // จัด Format รูปแบบให้ตรงกับที่ Frontend ต้องการ
    const finalResult = allOrders.map((row) => ({
      ...row,
      amount: parseFloat(row.amount) || 0,
      qty: parseInt(row.qty) || 1,
      isDelivered: row.isDelivered === 1 || row.isDelivered === true,
      // ใส่ orderItems จำลองเพื่อให้ Frontend โชว์ชื่อโปรเจกต์ได้
      orderItems:
        row.orderType === "product"
          ? [{ name: row.projectname, qty: row.qty, image: null }]
          : [],
    }));

    res.status(200).json(finalResult);
  } catch (error) {
    console.error("🔥 Main MyOrders Logic Error:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการประมวลผลข้อมูลประวัติสั่งซื้อ" });
  }
});

// @desc    สร้างออเดอร์สินค้าทั่วไป
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    billingAddress,
    paymentResult,
    shippingPrice: receivedShippingPrice,
    receivePlace,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("ไม่พบสินค้าในตะกร้า");
  }

  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );
  const vatPrice = itemsPrice * 0.07;
  const shippingPrice =
    receivePlace === "atcompany" ? 0 : parseFloat(receivedShippingPrice) || 0;
  const totalPrice = itemsPrice + vatPrice + shippingPrice;

  const totalQtyCount = orderItems.reduce(
    (acc, item) => acc + (Number(item.qty) || 0),
    0,
  );
  const product_ids_string = orderItems
    .map((item) => item.product || item._id)
    .join(",");

  if (paymentResult && paymentResult.image) {
    try {
      const rootPath = path.resolve();
      const relativeImagePath = paymentResult.image.replace(/^\/+/, "");
      const absoluteImagePath = path.resolve(rootPath, relativeImagePath);

      //  Security Fix: Prevent Path Traversal by ensuring the path is within rootPath
      if (!absoluteImagePath.startsWith(rootPath)) {
        throw new Error("❌ Access Denied: Invalid image path");
      }
      const imageJimp = await Jimp.read(absoluteImagePath);
      let qrCode = jsQR(
        new Uint8ClampedArray(imageJimp.bitmap.data),
        imageJimp.bitmap.width,
        imageJimp.bitmap.height,
      );
      if (!qrCode) {
        imageJimp.resize(800, Jimp.AUTO).greyscale().contrast(0.5);
        qrCode = jsQR(
          new Uint8ClampedArray(imageJimp.bitmap.data),
          imageJimp.bitmap.width,
          imageJimp.bitmap.height,
        );
      }
      if (!qrCode) throw new Error("❌ ไม่พบ QR Code ในสลิป");
      const slipAmount = extractAmountFromQR(qrCode.data);
      if (slipAmount === null || Math.abs(slipAmount - totalPrice) > 0.05) {
        throw new Error(
          `❌ ยอดเงินไม่ถูกต้อง! (สลิป: ${slipAmount} ฿ | ต้องชำระ: ${totalPrice.toFixed(2)} ฿)`,
        );
      }
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
  } else {
    res.status(400);
    throw new Error("❌ กรุณาแนบสลิป");
  }

  // ️ เริ่มกระบวนการ Transaction เพื่อความปลอดภัยของข้อมูล
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. บันทึกข้อมูลออเดอร์ลงในตาราง orders
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, userName, userEmail, receivePlace, shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone, billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax, totalPrice, totalQty, createdAt, updatedAt, paymentSlip, product_id, isPaid, paidAt, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, 1, NOW(), 'Paid')`,
      [
        req.user._id,
        req.user.name,
        req.user.email,
        receivePlace || "bysending",
        shippingAddress.shippingname,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        shippingAddress.country,
        shippingAddress.phone,
        billingAddress.billingName,
        billingAddress.billinggAddress,
        billingAddress.billingCity,
        billingAddress.billingPostalCode,
        billingAddress.billingCountry,
        billingAddress.billingPhone,
        billingAddress.tax,
        totalPrice,
        totalQtyCount,
        paymentResult.image,
        product_ids_string,
      ],
    );

    const newId = orderResult.insertId;

    // 2. บันทึกรายการสินค้าลงในตาราง orderitems (Batch Insert)
    const itemsData = orderItems.map((i) => [
      null,
      newId,
      i.product || i._id,
      i.name,
      i.image,
      i.price,
      i.qty,
      i.price * i.qty,
    ]);
    await connection.query(
      `INSERT INTO orderitems (id, order_id, product_id, productName, productImage, price, qty, totalPrice) VALUES ?`,
      [itemsData],
    );

    // 3. หักสต็อกสินค้าออกจากตาราง products
    for (const item of orderItems) {
      // ตรวจสอบสต็อกปัจจุบันก่อนหัก (Optional but recommended)
      const [productRows] = await connection.query(
        "SELECT countInStock FROM products WHERE _id = ?",
        [item.product || item._id],
      );
      if (productRows.length > 0 && productRows[0].countInStock < item.qty) {
        throw new Error(
          `ขออภัย สินค้า "${item.name}" มีจำนวนไม่พอในสต็อก (คงเหลือ: ${productRows[0].countInStock})`,
        );
      }

      await connection.query(
        `UPDATE products SET countInStock = countInStock - ? WHERE _id = ?`,
        [item.qty, item.product || item._id],
      );
    }

    //  ยืนยันการทำรายการทั้งหมด
    await connection.commit();

    res.status(201).json({ message: "สำเร็จ", orderId: newId });
  } catch (error) {
    //  ยกเลิกรายการทั้งหมดหากเกิดข้อผิดพลาด
    await connection.rollback();
    console.error("🔥 Transaction Error:", error.message);
    res.status(500);
    throw new Error("เกิดข้อผิดพลาดภายใน");
  } finally {
    //  คืน Connection เข้า Pool เสมอ ไม่ว่าจะสำเร็จหรือไม่
    connection.release();
  }
});

// @desc    Get all orders (Unified across 5 types)
// @route   GET /api/orders/all-types
// @access  Private/Admin/Store
const getAllUnifiedOrders = asyncHandler(async (req, res) => {
  const sql = `
    SELECT 
      id as id, paymentComfirmID as orderID, 'Product Order' as projectname, '-' as company, 
      userName as customer, shippingPhone as phone, totalPrice as price, 
      IF(isDelivered = 1, 'delivered', 'pending') as status, createdAt, 'PRODUCT' as type,
      NULL as quotation_no
    FROM orders
    
    UNION ALL
    
    SELECT 
      id, orderID, projectname, compay_name as company, 
      userName as customer, userPhone as phone, confirmed_price as price, 
      status, created_at as createdAt, 'ASSEMBLY PCB' as type,
      NULL as quotation_no
    FROM pcb_assembly_orders
    
    UNION ALL
    
    SELECT 
      id, orderID, projectname, compay_name as company, 
      userName as customer, userPhone as phone, confirmed_price as price, 
      status, created_at as createdAt, 'CUSTOM PCB' as type,
      NULL as quotation_no
    FROM pcb_custom_orders
    
    UNION ALL
    
    SELECT 
      id, orderID, projectname, compay_name as company, 
      userName as customer, userPhone as phone, confirmed_price as price, 
      status, created_at as createdAt, 'COPY PCB' as type,
      NULL as quotation_no
    FROM pcb_copy_orders
    
    UNION ALL
    
    SELECT 
      id, orderID, projectname, compay_name as company, 
      userName as customer, userPhone as phone, total_amount_cost as price, 
      IF(isManufacting = 1, 'manufacturing', 'accepted') as status, created_at as createdAt, 'GERBER PCB' as type,
      quotation_no
    FROM order_pcbs
    
    ORDER BY createdAt DESC
  `;

  const [rows] = await pool.query(sql);
  res.json(rows);
});

const getOrders = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM orders ORDER BY createdAt DESC",
  );
  res.json(rows);
});
const getOrderById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [
    req.params.id,
  ]);
  if (!rows || rows.length === 0) {
    res.status(404);
    throw new Error("Order not found");
  }
  const order = rows[0];

  // Fetch order items
  const [items] = await pool.query(
    `SELECT * FROM orderitems WHERE order_id = ?`,
    [order.id],
  );

  // Shape response to match frontend expectations
  res.json({
    _id: order.id,
    id: order.id,
    user: {
      _id: order.user_id,
      name: order.userName,
      email: order.userEmail,
    },
    orderItems: items.map((item) => ({
      name: item.productName,
      qty: item.qty,
      image: item.productImage,
      price: item.price,
      product_id: item.product_id,
    })),
    shippingAddress: {
      shippingname: order.shippingName,
      address: order.shippingAddress,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
      phone: order.shippingPhone,
      receivePlace: order.receivePlace,
    },
    billingAddress: {
      billingName: order.billingName,
      billinggAddress: order.billinggAddress,
      billingCity: order.billingCity,
      billingPostalCode: order.billingPostalCode,
      billingCountry: order.billingCountry,
      billingPhone: order.billingPhone,
      tax: order.billingTax,
    },
    paymentResult: {
      paymentComfirmID: order.paymentComfirmID || null,
      transferedName: order.transferedName || null,
      transferedDate: order.transferedDate || null,
      image: order.paymentSlip,
      paymentSlip: order.paymentSlip,
    },
    itemsPrice: order.itemsPrice || 0,
    vatPrice: order.vatPrice || 0,
    shippingPrice: order.shippingPrice || 0,
    totalPrice: order.totalPrice,
    totalQty: order.totalQty,
    isPaid: !!order.isPaid,
    paidAt: order.paidAt,
    isDelivered: !!order.isDelivered,
    deliveredAt: order.deliveredAt,
    transferedNumber: order.transferedNumber,
    receivePlace: order.receivePlace,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
});
const updateOrderToReceivePlace = asyncHandler(async (req, res) => {
  await pool.query("UPDATE orders SET receivePlace = ? WHERE id = ?", [
    req.body.receivePlace,
    req.params.id,
  ]);
  res.json({ message: "Updated" });
});
const updateOrderToPaid = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE orders SET isPaid = 1, paidAt = NOW(), status = "Paid" WHERE id = ?',
    [req.params.id],
  );
  res.json({ message: "Paid" });
});
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE orders SET isDelivered = 1, deliveredAt = NOW(), transferedNumber = ? WHERE id = ?`,
    [req.body.transferedNumber, req.params.id],
  );
  res.json({ message: "Delivered" });
});

const updateOrderStatusByQuotationNo = asyncHandler(async (req, res) => {
  const { quotation_no, status } = req.body;
  await pool.query("UPDATE orders SET status = ? WHERE quotation_no = ?", [
    status,
    quotation_no,
  ]);
  res.json({ message: "Status Updated" });
});
const updateTransportationPrice = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE transportaitions SET transportationPrice = ? WHERE ID = ?`,
    [req.body.transportationPrice, req.params.id],
  );
  res.json({ message: "Updated" });
});
const getTransportationPrice = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM transportaitions WHERE ID = ?",
    [req.params.id],
  );
  res.json(rows[0]);
});

module.exports = {
  getOrders,
  getOrderById,
  getMyOrders,
  addOrderItems,
  updateOrderToReceivePlace,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateTransportationPrice,
  getTransportationPrice,
  getAllUnifiedOrders, //  Added
  updateOrderStatusByQuotationNo,
};
