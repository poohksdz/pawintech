const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js"); //  เรียก pool ให้ถูกต้อง

// @desc    Fetch Default Price
const getassemblyCartPCBByDefault = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_assembly_default_price WHERE id = ?",
      [1],
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Error default" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Default Price
const updateassemblyCartPCBByDefault = asyncHandler(async (req, res) => {
  try {
    const { smd_price, tht_price, stencil_price, setup_price, delivery_price } =
      req.body;
    const sql = `UPDATE pcb_assembly_default_price SET smd_price=?, tht_price=?, stencil_price=?, setup_price=?, delivery_price=? WHERE id=?`;
    const [result] = await pool.query(sql, [
      smd_price,
      tht_price,
      stencil_price,
      setup_price,
      delivery_price,
      1,
    ]);

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "No record found" });
    res.status(200).json({ success: true, message: "Default prices updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch all orders
const getassemblyCartPCBs = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_assembly_carts ORDER BY created_at DESC",
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch single order by ID
const getassemblyCartPCBById = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_assembly_carts WHERE id = ?",
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
const getassemblyCartPCBByUserId = asyncHandler(async (req, res) => {
  const user_id = req.params.userId || req.user?._id;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_assembly_carts WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch orders by accepted status
const getassemblyCartPCBByaccepted = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pcb_assembly_carts WHERE status = 'accepted' ORDER BY created_at DESC",
    );
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create Order
const createassemblyCartPCB = asyncHandler(async (req, res) => {
  try {
    const { orderData } = req.body;
    if (!orderData) return res.status(400).json({ message: "No order data" });

    const {
      projectname,
      width_mm,
      high_mm,
      count_smd,
      count_tht,
      board_types,
      total_columns,
      total_rows,
      smd_side,
      tht_side,
      gerber_zip,
      notes,
      user_id,
      userName,
      userEmail,
      image_tops,
      image_bottoms,
      alreadyHaveStencil,
      total_point_smd,
      total_point_tht,
      pcb_qty,
    } = orderData;

    // Get Default Price
    const [priceRows] = await pool.query(
      "SELECT * FROM pcb_assembly_default_price WHERE id = 1",
    );
    if (priceRows.length === 0)
      return res.status(500).json({ message: "Default price not found" });
    const prices = priceRows[0];

    // Calculate Price
    let total_stencil_price = 0;
    // เช็ค alreadyHaveStencil ว่าเป็น false หรือ 'false' หรือ 0
    const isNewStencil =
      alreadyHaveStencil === false ||
      alreadyHaveStencil === "false" ||
      alreadyHaveStencil === 0;

    if (isNewStencil) {
      total_stencil_price =
        smd_side === "Both" ? prices.stencil_price * 2 : prices.stencil_price;
    }
    // ถ้าไม่มี SMD ตัดค่า Stencil ออก
    if (!count_smd || !total_point_smd || !smd_side) total_stencil_price = 0;

    const smdCost = prices.smd_price * (total_point_smd || 0);
    const thtCost = prices.tht_price * (total_point_tht || 0);

    const subTotal = (smdCost + thtCost) * pcb_qty + total_stencil_price;
    const vatPrice = subTotal * 0.07;
    let estimatedCost = subTotal + prices.delivery_price + vatPrice;

    if (estimatedCost < prices.setup_price) estimatedCost = prices.setup_price;

    // Prepare Images (Array 10 items)
    const topImages = [
      ...(Array.isArray(image_tops) ? image_tops : []),
      ...Array(10).fill(null),
    ].slice(0, 10);
    const bottomImages = [
      ...(Array.isArray(image_bottoms) ? image_bottoms : []),
      ...Array(10).fill(null),
    ].slice(0, 10);

    const sql = `
      INSERT INTO pcb_assembly_carts (
        projectname, pcb_qty, status, estimatedCost, confirmed_price, width_mm, high_mm,
        count_smd, total_point_smd, smdCost, thtCost, vatPrice, count_tht, total_point_tht, 
        board_types, total_columns, total_rows, smd_side, stencil_price, alreadyHaveStencil, 
        tht_side, gerber_zip, notes,
        image_top_1, image_top_2, image_top_3, image_top_4, image_top_5,
        image_top_6, image_top_7, image_top_8, image_top_9, image_top_10,
        image_bottom_1, image_bottom_2, image_bottom_3, image_bottom_4, image_bottom_5,
        image_bottom_6, image_bottom_7, image_bottom_8, image_bottom_9, image_bottom_10,
        created_at, updated_at, user_id, userName, userEmail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        NOW(), NOW(), ?, ?, ?)
    `;

    const values = [
      projectname,
      pcb_qty,
      "pending",
      estimatedCost,
      null,
      width_mm,
      high_mm,
      count_smd,
      total_point_smd,
      smdCost,
      thtCost,
      vatPrice,
      count_tht,
      total_point_tht,
      board_types,
      total_columns,
      total_rows,
      smd_side,
      total_stencil_price,
      alreadyHaveStencil,
      tht_side,
      gerber_zip,
      notes,
      ...topImages,
      ...bottomImages,
      user_id,
      userName,
      userEmail,
    ];

    const [result] = await pool.query(sql, values);
    res
      .status(201)
      .json({
        success: true,
        message: "Order created",
        orderId: result.insertId,
      });
  } catch (error) {
    console.error("Create Assembly Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Order
const updateassemblyCartPCB = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    // Logic Update ค่อนข้างซับซ้อนในหน้า Assembly
    // เพื่อความปลอดภัยและกระชับ ผมจะสร้าง Dynamic SQL Update
    // ที่อัปเดตเฉพาะค่าที่ส่งมาเท่านั้น

    let fields = [];
    let params = [];

    // รายชื่อฟิลด์ที่อนุญาตให้อัปเดต (ตัดพวก created_at ออก)
    const allowed = [
      "projectname",
      "pcb_qty",
      "status",
      "estimatedCost",
      "confirmed_price",
      "confirmed_reason",
      "width_mm",
      "high_mm",
      "count_smd",
      "total_point_smd",
      "count_tht",
      "total_point_tht",
      "board_types",
      "total_columns",
      "total_rows",
      "smd_side",
      "tht_side",
      "gerber_zip",
      "notes",
      "stencil_price",
      "alreadyHaveStencil",
      "reasonUpdated",
      "ConfirmAlreadyHaveStencil",
      "image_top_1",
      "image_top_2",
      "image_top_3",
      "image_top_4",
      "image_top_5",
      "image_top_6",
      "image_top_7",
      "image_top_8",
      "image_top_9",
      "image_top_10",
      "image_bottom_1",
      "image_bottom_2",
      "image_bottom_3",
      "image_bottom_4",
      "image_bottom_5",
      "image_bottom_6",
      "image_bottom_7",
      "image_bottom_8",
      "image_bottom_9",
      "image_bottom_10",
    ];

    for (const key of Object.keys(data)) {
      if (allowed.includes(key) && data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    fields.push("updated_at = NOW()");
    params.push(id);

    const sql = `UPDATE pcb_assembly_carts SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(sql, params);

    res.json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Cancel Order (Qty = 0)
const updateAmountassemblyCartPCBById = asyncHandler(async (req, res) => {
  try {
    await pool.query("UPDATE pcb_assembly_carts SET pcb_qty = 0 WHERE id = ?", [
      req.params.id,
    ]);
    res.status(200).json({ success: true, message: "Qty set to 0" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Status
const updateStatusassemblyCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // รองรับ body ซ้อนใน data
  const bodyData = req.body.data || req.body;
  const { status, confirmed_price, confirmed_reason } = bodyData;

  try {
    await pool.query(
      "UPDATE pcb_assembly_carts SET status=?, confirmed_price=?, confirmed_reason=?, updated_at=NOW() WHERE id=?",
      [status, confirmed_price, confirmed_reason, id],
    );
    res.status(200).json({ success: true, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Shipping
const updateShippingassemblyCartPCBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    userName,
    userEmail,
    shippingaddress = {},
    billingaddress = {},
  } = req.body;

  try {
    const sql = `
      UPDATE pcb_assembly_carts SET 
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

// @desc    Delete Order
const deleteassemblyCartPCB = asyncHandler(async (req, res) => {
  try {
    await pool.query("DELETE FROM pcb_assembly_carts WHERE id = ?", [
      req.params.id,
    ]);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = {
  getassemblyCartPCBByDefault,
  updateassemblyCartPCBByDefault,
  getassemblyCartPCBs,
  getassemblyCartPCBById,
  createassemblyCartPCB,
  updateassemblyCartPCB,
  deleteassemblyCartPCB,
  getassemblyCartPCBByUserId,
  updateAmountassemblyCartPCBById,
  updateStatusassemblyCartPCBById,
  updateShippingassemblyCartPCBById,
  getassemblyCartPCBByaccepted,
};
