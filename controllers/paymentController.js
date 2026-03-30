const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js");

// @desc    Get all payments (แอดมินดึงข้อมูลการชำระเงินทุกแผนก)
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  try {
    // 1. ตาราง Orders (มีคอลัมน์ครบตามโครงสร้างหลัก)
    const [orders] = await pool.query(`
      SELECT 
        o.id, o.user_id, o.totalPrice as amount, o.isPaid, o.paidAt as paymentDate, 
        o.paymentSlip, o.status, o.created_at, 'product' as orderType, o.isDelivered, o.transferedNumber as deliveryID,
        u.name as userName, u.email as userEmail, o.shippingAddress, 'bysending' as receivePlace, NULL as shippingPhone,
        0 as isManufacting
      FROM orders o
      LEFT JOIN users u ON o.user_id = u._id 
      WHERE o.paymentSlip IS NOT NULL
      ORDER BY o.created_at DESC
    `);

    // 2. ตาราง Custom PCB (ตารางนี้เราเพิ่มคอลัมน์รองรับไว้แล้ว)
    const [customOrders] = await pool.query(`
      SELECT 
        id, user_id, transferedAmount as amount, status, transferedDate as paymentDate,
        paymentSlip, created_at, 'custom' as orderType, isDelivered, transferedNumber as deliveryID,
        userName, userEmail, receivePlace, shippingAddress, shippingPhone,
        0 as isManufacting
      FROM pcb_custom_orders 
      WHERE paymentSlip IS NOT NULL
      ORDER BY created_at DESC
    `);

    // 3. ตาราง Copy PCB
    const [copyOrders] = await pool.query(`
      SELECT 
        id, user_id, confirmed_price as amount, status, transferedDate as paymentDate,
        paymentSlip, created_at, 'pcb' as orderType, isDelivered, transferedNumber as deliveryID,
        userName, userEmail, 'bysending' as receivePlace, shippingAddress, shippingPhone,
        0 as isManufacting
      FROM pcb_copy_orders 
      WHERE paymentSlip IS NOT NULL
      ORDER BY created_at DESC
    `);

    // 4. ตาราง Assembly
    const [assemblyOrders] = await pool.query(`
      SELECT 
        id, user_id, confirmed_price as amount, status, transferedDate as paymentDate,
        paymentSlip, created_at, 'assembly' as orderType, isDelivered, transferedNumber as deliveryID,
        userName, userEmail, 'bysending' as receivePlace, shippingAddress, shippingPhone,
        0 as isManufacting
      FROM pcb_assembly_orders 
      WHERE paymentSlip IS NOT NULL
      ORDER BY created_at DESC
    `);

    // 5. ตาราง Order PCB (Gerber)
    const [orderPcbs] = await pool.query(`
      SELECT 
        id, user_id, total_amount_cost as amount, 
        status, transferedDate as paymentDate,
        paymentSlip, created_at, 'orderpcb' as orderType, isDelivered, transferedNumber as deliveryID,
        userName, userEmail, 'bysending' as receivePlace, shippingAddress, shippingPhone,
        isManufacting
      FROM order_pcbs 
      WHERE paymentSlip IS NOT NULL
      ORDER BY created_at DESC
    `);

    // 6. ฟังก์ชันจัดรูปแบบข้อมูล (Normalize Data)
    const formatData = (items) =>
      items.map((item) => {
        let slipPath = item.paymentSlip;
        if (slipPath) {
          slipPath = slipPath.replace(/\\/g, "/").replace(/^\/+/, "");
          if (
            !slipPath.startsWith("uploads/") &&
            !slipPath.startsWith("paymentSlipImages/") &&
            !slipPath.startsWith("http")
          ) {
            slipPath = `uploads/${slipPath}`;
          }
          // Remove leading slash to let the frontend/getSlipUrl handle it consistently
          slipPath = slipPath.replace(/^\/+/, "");
        }

        return {
          _id: item.id,
          user: {
            _id: item.user_id,
            name: item.userName || `User ${item.user_id}`,
            email: item.userEmail || "",
          },
          amount: Number(item.amount) || 0,
          status: item.status || "pending",
          isPaid:
            item.isPaid === 1 ||
            item.status === "Paid" ||
            item.status === "COMPLETED" ||
            item.status === "accepted" ||
            item.status === "paid",
          isDelivered: item.isDelivered === 1 || item.isDelivered === true,
          deliveryID: item.deliveryID || "",
          isManufacting:
            item.isManufacting === 1 || item.isManufacting === true,
          receivePlace: item.receivePlace || "bysending",
          shippingAddress: item.shippingAddress || "",
          shippingPhone: item.shippingPhone || "",
          paymentDate: item.paymentDate,
          paymentSlip: slipPath,
          orderType: item.orderType,
          createdAt: item.created_at,
        };
      });

    const allPayments = [
      ...formatData(orders),
      ...formatData(customOrders),
      ...formatData(copyOrders),
      ...formatData(assemblyOrders),
      ...formatData(orderPcbs),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allPayments);
  } catch (error) {
    console.error("🔥 API Get Payments Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch payments: " + error.message });
  }
});

// @desc    อัปเดตสถานะการชำระเงิน (แอดมินกดยืนยัน  หรือปฏิเสธ )
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, orderType } = req.body;

  try {
    if (orderType === "product") {
      const isPaid = status === "Paid" ? 1 : 0;
      // Table 'orders' uses 'id', 'status', 'isPaid', and 'updatedAt' (camelCase)
      await pool.query(
        `UPDATE orders SET isPaid = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
        [isPaid, status, id],
      );
    } else if (orderType === "orderpcb") {
      // Table 'order_pcbs' (GERBER)
      // We added 'status' column. Also has 'isManufacting' and 'manfactingDate'
      let dbStatus = "pending";
      let extraFields = "";
      let extraValues = [];

      if (status === "Paid") {
        dbStatus = "accepted";
        extraFields = ", isManufacting = 1, manfactingDate = NOW()";
      } else if (status === "Reject") {
        dbStatus = "rejected";
      }

      await pool.query(
        `UPDATE order_pcbs SET status = ?, updated_at = NOW() ${extraFields} WHERE id = ?`,
        [dbStatus, ...extraValues, id],
      );
    } else {
      // Tables: pcb_custom_orders, pcb_copy_carts, pcb_assembly_carts
      let table = "";
      switch (orderType) {
        case "custom":
          table = "pcb_custom_orders";
          break;
        case "pcb":
          table = "pcb_copy_carts";
          break;
        case "assembly":
          table = "pcb_assembly_carts";
          break;
        default:
          return res.status(400).json({ message: "Invalid order type" });
      }

      let dbStatus = "pending";
      if (status === "Paid") dbStatus = "accepted";
      if (status === "Reject") dbStatus = "rejected";

      await pool.query(
        `UPDATE ${table} SET status = ?, updated_at = NOW() WHERE id = ?`,
        [dbStatus, id],
      );

      // Custom PCB also has a relation to carts table
      if (orderType === "custom") {
        await pool.query(
          `UPDATE pcb_custom_carts SET status = ?, updated_at = NOW() WHERE id = (SELECT cartId FROM pcb_custom_orders WHERE id = ?)`,
          [dbStatus, id],
        );
      }
    }

    res.json({
      message: `อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว`,
      status,
      id,
    });
  } catch (error) {
    console.error("🔥 Update Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = { getPayments, updatePaymentStatus };
