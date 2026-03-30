const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js"); //  เรียกใช้ pool ให้ถูกต้อง

// Utility: Generate timestamp
const getTimestamp = () => {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14); // YYYYMMDDHHmmss
};

// Utility: Generate Unique Payment ID
const generateUniquePaymentConfirmID = async () => {
  const base = getTimestamp();
  let counter = 1;
  let uniqueID;
  let isUnique = false;
  while (!isUnique) {
    const suffix = String(counter).padStart(3, "0");
    uniqueID = `PIDP-${base}${suffix}`;
    const [rows] = await pool.query(
      "SELECT id FROM pcb_copy_carts WHERE paymentComfirmID = ?",
      [uniqueID],
    );
    if (rows.length === 0) isUnique = true;
    else counter++;
  }
  return uniqueID;
};

// =========================================================================
//  1. ส่วน UPLOAD
// =========================================================================

const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ message: "No images uploaded" });

  const paths = req.files.map((file) => ({
    filename: file.filename,
    path: `/${file.path.replace(/\\/g, "/")}`,
  }));

  res.status(200).json({
    message: "Images uploaded successfully",
    images: paths, // Now returns objects with path
    urls: paths.map((p) => p.path), // legacy support
  });
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const filePath = `/${req.file.path.replace(/\\/g, "/")}`;

  res.status(200).json({
    message: "File uploaded successfully",
    file: filePath,
    url: filePath,
    path: filePath, // Ensure 'path' is returned
    zipPath: filePath,
  });
});

// =========================================================================
//  2. ส่วน READ (GET)
// =========================================================================

// @desc    Fetch all orders
const getcopyCartPCBs = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_copy_carts ORDER BY created_at DESC",
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch single order by ID
const getcopyCartPCBById = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_copy_carts WHERE id = ?",
      [req.params.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch orders by User ID
const getcopyCartPCBByUserId = asyncHandler(async (req, res) => {
  const user_id = req.params.userId || req.user?._id;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_copy_carts WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
//  3. ส่วน CREATE (POST)
// =========================================================================

const createcopyCartPCB = asyncHandler(async (req, res) => {
  let { projectname, user_id, pcb_qty, notes } = req.body;

  // หา path ของไฟล์ zip (รองรับหลายชื่อตัวแปรที่ Frontend อาจส่งมา)
  let finalZip =
    req.body.copypcb_zip ||
    req.body.zipfile ||
    req.body.file ||
    req.body.zip ||
    null;

  // ฟังก์ชันช่วยดึง Array รูปภาพ
  const getImagesArray = (keys, singlePrefix) => {
    let images = [];
    for (const key of keys) {
      if (Array.isArray(req.body[key]) && req.body[key].length > 0) {
        images = req.body[key];
        break;
      }
    }
    if (images.length === 0) {
      for (let i = 1; i <= 10; i++) {
        const val = req.body[`${singlePrefix}${i}`];
        if (val) images.push(val);
      }
    }
    // Normalize: ensure all elements are strings (paths)
    return images.map((img) =>
      img && typeof img === "object" ? img.path || img.url : img,
    );
  };

  const rawFrontImages = getImagesArray(
    ["copypcbFrontImages", "frontImages", "images"],
    "front_image_",
  );
  const rawBackImages = getImagesArray(
    ["copypcbBackImages", "backImages"],
    "back_image_",
  );

  if (!projectname || !user_id || !pcb_qty) {
    return res
      .status(400)
      .json({ success: false, message: "Required fields missing" });
  }

  try {
    // Generate OrderID
    const base = getTimestamp();
    let counter = 1;
    let uniqueID = "";
    let isUnique = false;
    while (!isUnique) {
      const suffix = String(counter).padStart(3, "0");
      uniqueID = `PCP-${base}${suffix}`;
      const [rows] = await pool.query(
        "SELECT id FROM pcb_copy_carts WHERE orderID = ?",
        [uniqueID],
      );
      if (rows.length === 0) isUnique = true;
      else counter++;
    }

    // เติม null ให้ครบ 10 ช่อง
    const fImages = [...rawFrontImages, ...Array(10).fill(null)].slice(0, 10);
    const bImages = [...rawBackImages, ...Array(10).fill(null)].slice(0, 10);

    const sql = `
      INSERT INTO pcb_copy_carts (
        projectname, user_id, pcb_qty, notes, copypcb_zip,
        front_image_1, front_image_2, front_image_3, front_image_4, front_image_5,
        front_image_6, front_image_7, front_image_8, front_image_9, front_image_10,
        back_image_1, back_image_2, back_image_3, back_image_4, back_image_5,
        back_image_6, back_image_7, back_image_8, back_image_9, back_image_10,
        orderID, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      projectname,
      user_id,
      pcb_qty,
      notes || null,
      finalZip,
      ...fImages,
      ...bImages,
      uniqueID,
    ];

    const [result] = await pool.query(sql, values);
    res
      .status(201)
      .json({
        success: true,
        message: "Order created",
        orderID: uniqueID,
        insertedId: result.insertId,
      });
  } catch (error) {
    console.error("Create Copy PCB Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
//  4. ส่วน UPDATE (PUT)
// =========================================================================

const updatecopyCartPCB = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { projectname, pcb_qty, notes } = req.body;
  const finalZip = req.body.copypcb_zip || req.body.zipfile || null;

  const getImagesArray = (keys, singlePrefix) => {
    let images = [];
    for (const key of keys) {
      if (Array.isArray(req.body[key])) {
        images = req.body[key];
        break;
      }
    }
    if (images.length === 0) {
      for (let i = 1; i <= 10; i++) {
        const val = req.body[`${singlePrefix}${i}`];
        if (val) images.push(val);
      }
    }
    // Normalize: ensure all elements are strings (paths)
    return images.map((img) =>
      img && typeof img === "object" ? img.path || img.url : img,
    );
  };

  const rawFrontImages = getImagesArray(
    ["copypcbFrontImages", "frontImages", "images"],
    "front_image_",
  );
  const rawBackImages = getImagesArray(
    ["copypcbBackImages", "backImages"],
    "back_image_",
  );

  const fImages = [...rawFrontImages, ...Array(10).fill(null)].slice(0, 10);
  const bImages = [...rawBackImages, ...Array(10).fill(null)].slice(0, 10);

  try {
    const sql = `UPDATE pcb_copy_carts SET 
      projectname=?, pcb_qty=?, notes=?, copypcb_zip=?, 
      front_image_1=?, front_image_2=?, front_image_3=?, front_image_4=?, front_image_5=?,
      front_image_6=?, front_image_7=?, front_image_8=?, front_image_9=?, front_image_10=?,
      back_image_1=?, back_image_2=?, back_image_3=?, back_image_4=?, back_image_5=?,
      back_image_6=?, back_image_7=?, back_image_8=?, back_image_9=?, back_image_10=?,
      updated_at=NOW() WHERE id=?`;

    const values = [
      projectname,
      pcb_qty,
      notes,
      finalZip,
      ...fImages,
      ...bImages,
      id,
    ];
    await pool.query(sql, values);
    res.status(200).json({ success: true, message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set Qty to 0 (Cancel)
const updateAmountcopyCartPCBById = asyncHandler(async (req, res) => {
  try {
    await pool.query("UPDATE pcb_copy_carts SET pcb_qty = 0 WHERE id = ?", [
      req.params.id,
    ]);
    res.status(200).json({ success: true, message: "Qty set to 0" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Status & Price
const updateStatuscopyCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // รองรับโครงสร้าง body ที่อาจซ้อนใน data
  const bodyData = req.body.data || req.body;
  const { status, confirmed_price, confirmed_reason } = bodyData;

  try {
    let fields = [];
    let values = [];
    if (status) {
      fields.push("status=?");
      values.push(status);
    }
    if (confirmed_price !== undefined) {
      fields.push("confirmed_price=?");
      values.push(confirmed_price);
    }
    if (confirmed_reason !== undefined) {
      fields.push("confirmed_reason=?");
      values.push(confirmed_reason);
    }

    if (fields.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    values.push(id);
    await pool.query(
      `UPDATE pcb_copy_carts SET ${fields.join(", ")}, updated_at=NOW() WHERE id=?`,
      values,
    );
    res.status(200).json({ success: true, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Shipping Info
const updateShippingcopyCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    userName,
    userEmail,
    shippingaddress = {},
    billingaddress = {},
  } = req.body;

  try {
    const sql = `
      UPDATE pcb_copy_carts SET 
        shippingName=?, shippingAddress=?, shippingCity=?, shippingPostalCode=?, shippingCountry=?, shippingPhone=?, receivePlace=?, 
        billingName=?, billinggAddress=?, billingCity=?, billingPostalCode=?, billingCountry=?, billingPhone=?, billingTax=?, 
        userName=?, userEmail=? 
      WHERE id=?
    `;
    const values = [
      shippingaddress.shippingname,
      shippingaddress.address,
      shippingaddress.city,
      shippingaddress.postalCode,
      shippingaddress.country,
      shippingaddress.phone,
      shippingaddress.receivePlace,
      billingaddress.billingName,
      billingaddress.billinggAddress,
      billingaddress.billingCity,
      billingaddress.billingPostalCode,
      billingaddress.billingCountry,
      billingaddress.billingPhone,
      billingaddress.tax,
      userName,
      userEmail,
      id,
    ];
    await pool.query(sql, values);
    res.status(200).json({ success: true, message: "Shipping info updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Payment Info (เพิ่มให้ครบตาม DB)
const updatePaymentcopyCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transferedAmount, transferedName, paymentSlip, transferedDate } =
    req.body;
  try {
    const paymentID = await generateUniquePaymentConfirmID();
    const sql = `UPDATE pcb_copy_carts SET transferedAmount=?, transferedName=?, paymentSlip=?, transferedDate=?, paymentComfirmID=? WHERE id=?`;
    await pool.query(sql, [
      transferedAmount,
      transferedName,
      paymentSlip,
      transferedDate,
      paymentID,
      id,
    ]);
    res
      .status(200)
      .json({
        success: true,
        message: "Payment updated",
        paymentComfirmID: paymentID,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Order
const deletecopyCartPCB = asyncHandler(async (req, res) => {
  try {
    await pool.query("DELETE FROM pcb_copy_carts WHERE id = ?", [
      req.params.id,
    ]);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = {
  getcopyCartPCBs,
  getcopyCartPCBById,
  createcopyCartPCB,
  updatecopyCartPCB,
  deletecopyCartPCB,
  getcopyCartPCBByUserId,
  updateAmountcopyCartPCBById,
  updateStatuscopyCartPCBById,
  updateShippingcopyCartPCBById,
  updatePaymentcopyCartPCBById, // เพิ่ม Payment
  uploadMultipleImages,
  uploadFile,
};
