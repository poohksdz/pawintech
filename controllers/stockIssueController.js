const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js"); //  เรียกใช้ Pool ที่สร้างไว้แล้ว

// @desc    Get all issuegoods
// @route   GET /api/Stockissuegoods
// @access  Private/Admin
const getStockIssuegoods = asyncHandler(async (req, res) => {
  try {
    //  ใช้ db.query ได้เลย
    const [rows] = await db.pool.query(
      'SELECT `ID`, `issueno`,  DATE_FORMAT(`issuedate`, "%d-%m-%Y") AS `issuedate`, `issuetime`, `issueqty`, `requestno`,  DATE_FORMAT(`requestdate`, "%d-%m-%Y") AS `requestdate`, `requesttime`, `requestqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username`, `reciever`, `product_id` FROM `tbl_issue`  ORDER BY ID DESC',
    );
    res.status(200).json({ issuegoods: rows });
  } catch (error) {
    console.error(`Error fetching issuegoods: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching issuegoods");
  }
});

// @desc    Get issuegoods by ID
// @route   GET /api/Stockissuegoods/:id
// @access  Private/Admin
const getStockIssuegoodsDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.pool.query(
      'SELECT `ID`, `issueno`,  DATE_FORMAT(`issuedate`, "%d-%m-%Y") AS `issuedate`, `issuetime`, `issueqty`, `requestno`,  DATE_FORMAT(`requestdate`, "%d-%m-%Y") AS `requestdate`, `requesttime`, `requestqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username`, `reciever`, `product_id` FROM `tbl_issue` WHERE ID = ?  ORDER BY ID DESC',
      [id],
    );

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Issuegoods not found");
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching issuegoods: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching issuegoods");
  }
});

// @desc    Create a new issuegoods
// @route   POST /api/Stockissuegoods
// @access  Public
const createStockIssuegoods = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const { items, issueUser, userId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items provided" });
  }

  // ️ Transaction ต้องขอ Connection แยกออกมา
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const generateIssueNumber = (userId) => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ms = String(now.getMilliseconds()).padStart(3, "0");
      return `ISS${userId}${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${ms}`;
    };

    const issueno = generateIssueNumber(userId);
    const issuedate = new Date().toISOString().split("T")[0];
    const issuetime = new Date().toLocaleTimeString("en-GB");

    //  STEP 1: Check all items first
    for (const item of items) {
      const { product_id, issueqty, value } = item;
      const issueQtyNum = Number(issueqty);

      const [productRows] = await connection.query(
        "SELECT quantity FROM tbl_product WHERE ID = ?",
        [product_id],
      );

      if (productRows.length === 0) {
        await connection.rollback();
        return res
          .status(404)
          .json({ message: `Product not found: ID ${product_id}` });
      }

      const currentQty = Number(productRows[0].quantity);
      if (currentQty < issueQtyNum) {
        await connection.rollback();
        return res.status(400).json({
          message: `Not enough stock for ${value}. Available: ${currentQty}, Requested: ${issueQtyNum}`,
        });
      }
    }

    //  STEP 2: If all pass, then deduct + insert
    for (const item of items) {
      const {
        ID,
        requestno,
        requestdate,
        requesttime,
        requestqty,
        img,
        electotronixPN,
        value,
        category,
        subcategory,
        footprint,
        weight,
        position,
        unitprice,
        manufacture,
        manufacturePN,
        supplier,
        supplierPN,
        moq,
        spq,
        link,
        process,
        description,
        alternative,
        note,
        username,
        requestedUser,
        user_id,
        product_id,
        issueqty,
      } = item;

      const issueQtyNum = Number(issueqty);

      let formattedRequestDate = null;
      if (requestdate) {
        const [day, month, year] = requestdate.split("-");
        formattedRequestDate = `${year}-${month}-${day}`;
      }

      // Deduct stock
      await connection.query(
        "UPDATE tbl_product SET quantity = quantity - ? WHERE ID = ?",
        [issueQtyNum, product_id],
      );

      // Update requestqty in tbl_jit
      await connection.query(
        "UPDATE tbl_jit SET requestqty = GREATEST(requestqty - ?, 0) WHERE product_id = ?",
        [issueQtyNum, product_id],
      );

      // Insert into tbl_issue
      const insertQuery = `
        INSERT INTO tbl_issue (
          issueno, issuedate, issuetime, issueqty, requestno, requestdate, requesttime, requestqty,
          electotronixPN, value, footprint, category, subcategory, description, position,
          supplierPN, supplier, manufacturePN, manufacture, weight, unitprice, moq, spq, link,
          alternative, process, note, img, username, reciever, requestedUserId, issueBy, product_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.query(insertQuery, [
        issueno,
        issuedate,
        issuetime,
        issueQtyNum,
        requestno,
        formattedRequestDate,
        requesttime,
        Number(requestqty),
        electotronixPN,
        value,
        footprint,
        category,
        subcategory,
        description,
        position,
        supplierPN,
        supplier,
        manufacturePN,
        manufacture,
        weight,
        Number(unitprice),
        moq,
        spq,
        link,
        alternative,
        process,
        note,
        img,
        username,
        requestedUser,
        user_id,
        issueUser,
        product_id,
      ]);
    }

    await connection.commit();

    if (io) {
      io.emit("stock_issue_created", {
        issueUser,
        userId,
        itemsCount: items.length,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({
      message: "Issuegoods created successfully",
      issueno,
      itemCount: items.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error(`❌ Error creating issuegoods: ${error.message}`);
    res.status(500).json({
      message: "Error creating issuegoods",
      error: "Internal server error",
    });
  } finally {
    connection.release(); //  สำคัญมาก: ต้องคืน Connection เข้า Pool เสมอ
  }
});

// @desc    Update issuegoods
// @route   PUT /api/Stockissuegoods/:id
// @access  Private/Admin
const updateStockIssuegoods = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    issueno,
    issuedate,
    issuetime,
    issueqty,
    requestno,
    requestdate,
    requesttime,
    electotronixPN,
    value,
    footprint,
    category,
    subcategory,
    description,
    position,
    supplierPN,
    supplier,
    manufacturePN,
    manufacture,
    weight,
    unitprice,
    moq,
    spq,
    link,
    alternative,
    process,
    note,
    img,
    username,
    reciever,
  } = req.body;

  if (!issueno || !issuedate) {
    res.status(400);
    throw new Error("Issuegoods name and short name are required");
  }

  try {
    const [existingIssuegoods] = await db.pool.query(
      "SELECT * FROM tbl_issue WHERE ID = ?",
      [id],
    );

    if (existingIssuegoods.length === 0) {
      res.status(404);
      throw new Error("Issuegoods not found");
    }

    const query = `
      UPDATE tbl_issue
      SET issueno = ?, issuedate = ?, issuetime = ?, issueqty = ?, requestno = ?, requestdate = ?, requesttime = ?, electotronixPN = ?, value = ?, footprint = ?, category = ?, subcategory = ?, description = ?, position = ?, supplierPN = ?, supplier = ?, manufacturePN = ?, manufacture = ?, weight = ?, unitprice = ?, moq = ?, spq = ?, link = ?, alternative = ?, process = ?, note = ?, img = ?, username = ?, reciever = ?
      WHERE ID = ?
    `;

    const [result] = await db.pool.query(query, [
      issueno,
      issuedate,
      issuetime,
      issueqty,
      requestno,
      requestdate,
      requesttime,
      electotronixPN,
      value,
      footprint,
      category,
      subcategory,
      description,
      position,
      supplierPN,
      supplier,
      manufacturePN,
      manufacture,
      weight,
      unitprice,
      moq,
      spq,
      link,
      alternative,
      process,
      note,
      img,
      username,
      reciever,
      id,
    ]);

    if (result.affectedRows === 0) {
      res.status(404);
      throw new Error("No changes made to the issuegoods");
    }

    res.status(200).json({
      message: "Issuegoods updated successfully",
      issuegoods: {
        id,
        issueno,
        issuedate,
        issuetime,
        issueqty,
        requestno,
        requestdate,
        requesttime,
        electotronixPN,
        value,
        footprint,
        category,
        subcategory,
        description,
        position,
        supplierPN,
        supplier,
        manufacturePN,
        manufacture,
        weight,
        unitprice,
        moq,
        spq,
        link,
        alternative,
        process,
        note,
        img,
        reciever,
        username,
      },
    });
  } catch (error) {
    console.error(`Error updating issuegoods: ${error.message}`);
    res.status(500);
    throw new Error("Error updating issuegoods");
  }
});

// @desc    Delete issuegoods
// @route   DELETE /api/Stockissuegoods/:id
// @access  Private/Admin
const deleteStockIssuegoods = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [existingIssuegoods] = await db.pool.query(
      "SELECT * FROM tbl_issue WHERE ID = ?",
      [id],
    );

    if (existingIssuegoods.length === 0) {
      res.status(404);
      throw new Error("Issuegoods not found");
    }

    await db.pool.query("DELETE FROM tbl_issue WHERE ID = ?", [id]);

    res.status(200).json({ message: "Issuegoods deleted successfully" });
  } catch (error) {
    console.error(`Error deleting issuegoods: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting issuegoods");
  }
});

// @desc    Get issuegoods by reciever
// @route   GET /api/Stockissuegoods/getissuegoodsuser/:reciever
// @access  Private/Admin
const getStockIssuegoodsUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // แก้ไข SQL: ลบ product_id ที่เขียนซ้ำและไม่มีลูกน้ำคั่น
    const [rows] = await db.pool.query(
      'SELECT `ID`, `issueno`,  DATE_FORMAT(`issuedate`, "%d-%m-%Y") AS `issuedate`, `issuetime`, `issueqty`, `requestno`,  DATE_FORMAT(`requestdate`, "%d-%m-%Y") AS `requestdate`, `requesttime`, `requestqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username`, `reciever`, `product_id`, `requestedUserId` FROM `tbl_issue` WHERE requestedUserId = ? ORDER BY ID DESC',
      [id],
    );

    if (rows.length === 0) {
      // res.status(404) // ไม่ต้อง Error ก็ได้ถ้าไม่เจอ แค่ส่ง Array ว่าง
      return res.status(200).json([]);
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error(`Error fetching issuegoods: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching issuegoods");
  }
});

module.exports = {
  createStockIssuegoods,
  updateStockIssuegoods,
  deleteStockIssuegoods,
  getStockIssuegoods,
  getStockIssuegoodsDetails,
  getStockIssuegoodsUser,
};
