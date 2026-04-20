const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js"); //  เรียกใช้ Pool
const { createBroadcastNotification } = require("./notificationController");

// @desc    Get all requestgood
// @route   GET /api/Stockrequestgood
// @access  Private/Admin
const getStockRequestgood = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT `ID`, `requestno`, DATE_FORMAT(`requestdate`, '%d-%m-%Y') AS `requestdate`, `requesttime`, `requestqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username`, `product_id`, `requestedUser`, `user_id` FROM tbl_jit WHERE cancel = 0 AND requestqty > 0 ORDER BY `ID` DESC",
    );
    res.status(200).json({ requestgoods: rows });
  } catch (error) {
    console.error(`Error fetching requestgood: ${error.message}`);
    res.status(500).json({ message: "Error fetching requestgood" });
  }
});

// @desc    Get requestgood by ID
// @route   GET /api/Stockrequestgood/:id
// @access  Private/Admin
const getStockRequestgoodDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.pool.query(
      "SELECT `ID`, `requestno`, DATE_FORMAT(`requestdate`, '%d-%m-%Y') AS `requestdate`, `requesttime`, `requestqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username`, `product_id`, `requestedUser`, `user_id` FROM tbl_jit WHERE ID = ? ORDER BY ID DESC",
      [id],
    );

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Requestgood not found");
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching requestgood: ${error.message}`);
    res.status(500).json({ message: "Error fetching requestgood" });
  }
});

// @desc    Post requestgood
// @route   POST /api/Stockrequestgood/
// @access  Private/Admin
const createStockRequestgood = asyncHandler(async (req, res) => {
  const { items, updateImportanceBy, requestedUser, userId } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  try {
    function generateRequestNumber(userId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      const second = String(now.getSeconds()).padStart(2, "0");
      const millisecond = String(now.getMilliseconds()).padStart(3, "0");
      return `REQ${userId}${year}${month}${day}${hour}${minute}${second}${millisecond}`;
    }

    const requestno = generateRequestNumber(userId);
    const requestdate = new Date().toISOString().split("T")[0];
    const requesttime = new Date().toLocaleTimeString("en-GB");

    const query = `
      INSERT INTO tbl_jit (
        requestno, requestdate, requesttime, requestqty, img,
        electotronixPN, value, category, subcategory, footprint,
        weight, position, unitprice, manufacture, manufacturePN,
        supplier, supplierPN, moq, spq, link, process,
        description, alternative, note, 
        important, important_message, updateImportanceBy, 
        username, requestedUser, user_id, product_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      const {
        reqqty,
        img,
        electotronixPN,
        value,
        category,
        subcategory,
        footprint,
        weight,
        position,
        price: unitprice,
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
        important,
        important_message,
        username,
        _id: ID,
      } = item;

      await db.pool.query(query, [
        requestno,
        requestdate,
        requesttime,
        reqqty,
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
        important,
        important_message,
        updateImportanceBy,
        username,
        requestedUser,
        userId,
        ID,
      ]);
    }

    res.status(201).json({
      message: "Requestgood created successfully",
      requestno,
      requestedUser,
      userId,
      itemsCount: items.length,
    });

    // 🔔 Send notification to Store users
    await createBroadcastNotification({
      message: `New stock request received: ${requestno} from ${requestedUser}`,
      type: "stock_request",
      targetRole: "isStore",
    });
  } catch (error) {
    console.error(`Error updating requestgood: ${error.message}`);
    res.status(500).json({ message: "Error updating requestgood" });
  }
});

// @desc    Update requestgood
// @route   PUT /api/Stockrequestgood/:id
// @access  Private/Admin
const updateStockRequestgood = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    requestno,
    requestdate,
    requesttime,
    requestqty,
    img,
    electotronixPN,
    value,
    footprint,
    category,
    subcategory,
    description,
    position,
    manufacturePN,
    manufacture,
    weight,
    alternative,
    process,
    note,
    unitprice,
    username,
    user_id,
  } = req.body;

  if (!requestno || !requestdate) {
    res.status(400);
    throw new Error("Requestgood name and short name are required");
  }

  try {
    const [existingRequestgood] = await db.pool.query(
      "SELECT * FROM tbl_jit WHERE ID = ?",
      [id],
    );

    if (existingRequestgood.length === 0) {
      res.status(404);
      throw new Error("Requestgood not found");
    }

    const query = `
      UPDATE tbl_jit
      SET requestno = ?, requestdate = ?, requesttime = ?, requestqty = ?, img = ?, electotronixPN = ?, value = ?, footprint = ?, category = ?, subcategory = ?, description = ?, position = ?, manufacturePN = ?, manufacture = ?, weight = ?, alternative = ?, process = ?, note = ?, unitprice = ?, username = ?, user_id = ?
      WHERE ID = ?
    `;

    const [result] = await db.pool.query(query, [
      requestno,
      requestdate,
      requesttime,
      requestqty,
      img,
      electotronixPN,
      value,
      footprint,
      category,
      subcategory,
      description,
      position,
      manufacturePN,
      manufacture,
      weight,
      alternative,
      process,
      note,
      unitprice,
      username,
      user_id,
      id,
    ]);

    if (result.affectedRows === 0) {
      res.status(404);
      throw new Error("No changes made to the requestgood");
    }

    res.status(200).json({
      message: "Requestgood updated successfully",
      requestgood: {
        id,
        requestno,
        requestdate,
        requesttime,
        requestqty,
        img,
        electotronixPN,
        value,
        footprint,
        category,
        subcategory,
        description,
        position,
        manufacturePN,
        manufacture,
        weight,
        alternative,
        process,
        note,
        unitprice,
        username,
        user_id,
      },
    });
  } catch (error) {
    console.error(`Error updating requestgood: ${error.message}`);
    res.status(500).json({ message: "Error updating requestgood" });
  }
});

// @desc    Delete requestgood
// @route   DELETE /api/Stockrequestgood/:id
// @access  Private/Admin
const deleteStockRequestgood = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [existingRequestgood] = await db.pool.query(
      "SELECT * FROM tbl_jit WHERE ID = ?",
      [id],
    );

    if (existingRequestgood.length === 0) {
      res.status(404);
      throw new Error("Requestgood not found");
    }

    await db.pool.query("DELETE FROM tbl_jit WHERE ID = ?", [id]);

    res.status(200).json({ message: "Requestgood deleted successfully" });
  } catch (error) {
    console.error(`Error deleting requestgood: ${error.message}`);
    res.status(500).json({ message: "Error deleting requestgood" });
  }
});

// @desc    Update Requestgood qty
// @route   PUT /api/Stockproducts/:id/qty
// @access  Private/Admin
const updateStockRequestgoodQty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qty } = req.body;

  try {
    const [product] = await db.pool.query(
      "SELECT * FROM tbl_jit WHERE ID = ?",
      [id],
    );

    if (product.length === 0) {
      res.status(404);
      throw new Error("Product not found");
    }

    const query = `UPDATE tbl_jit SET requestqty = ? WHERE ID = ?`;
    const [result] = await db.pool.query(query, [qty, id]);

    if (result.affectedRows === 0) {
      res.status(400);
      throw new Error("Failed to update quantity");
    }

    res.status(200).json({ message: "Product quantity updated successfully" });
  } catch (error) {
    console.error(`Error updating product: ${error.message}`);
    res.status(500).json({ message: "Error updating product" });
  }
});

//  [จุดที่แก้ปัญหา 500 Error]
// @desc    Get requestgood by username with requestqty > 0
// @route   GET /api/Stockrequestgoods/getrequestgooduser/:id
// @access  Private/Admin
const getStockRequestgoodUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // console.log('Fetching Request Good User ID:', id) // Uncomment เพื่อดู Log ใน Terminal

  try {
    //  ใช้ Single Quote ('%d-%m-%Y') แทน Double Quote ป้องกัน SQL Error
    const [rows] = await db.pool.query(
      `SELECT ID, requestno, DATE_FORMAT(requestdate, '%d-%m-%Y') AS requestdate,
              requesttime, requestqty, img, electotronixPN, value, category,
              subcategory, footprint, weight, position, unitprice, manufacture,
              manufacturePN, supplier, supplierPN, moq, spq, link, process,
              description, alternative, note, username, product_id, requestedUser, user_id
       FROM tbl_jit
       WHERE cancel = 0 AND user_id = ? AND requestqty > 0 
       ORDER BY ID DESC`,
      [id],
    );

    // ไม่ต้อง return 404 ถ้าไม่เจอ ให้ส่ง array ว่างไป หน้าเว็บจะได้ไม่ error
    if (!rows.length) {
      return res.status(200).json([]);
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching request goods:", error.message);
    res.status(500).json({ message: "Server error fetching request goods" });
  }
});

// @desc    Get all requestimportance
// @route   GET /api/Stockrequestimportance
// @access  Private/Admin
const getStockRequestImportance = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      `SELECT ID, requestno, DATE_FORMAT(requestdate, '%d-%m-%Y') AS requestdate,
              requesttime, requestqty, img, electotronixPN, value, category, subcategory,
              footprint, weight, position, unitprice, manufacture, manufacturePN,
              supplier, supplierPN, moq, spq, link, process, description, alternative, note,
              important, important_message, updateImportanceBy, username, requestedUser, user_id, product_id
       FROM tbl_jit
       WHERE important = 1
       ORDER BY ID DESC`,
    );
    res.status(200).json({ requestimportances: rows });
  } catch (error) {
    console.error(`Error fetching requestimportance: ${error.message}`);
    res.status(500).json({ message: "Error fetching requestimportance" });
  }
});

// @desc    Get all requestimportance
// @route   GET /api/Stockrequestimportance
// @access  Private/Admin
const getStockRequestAllImportance = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(`
      SELECT ID, requestno, DATE_FORMAT(requestdate, '%d-%m-%Y') AS requestdate,
             requesttime, requestqty, img, electotronixPN, value, category, subcategory,
             footprint, weight, position, unitprice, manufacture, manufacturePN,
             supplier, supplierPN, moq, spq, link, process, description, alternative, note,
             important, important_message, updateImportanceBy, username, requestedUser, user_id, product_id
      FROM tbl_jit
       WHERE important = 1 AND cancel = 0 
       ORDER BY ID DESC
    `);

    res.status(200).json({ requestimportances: rows });
  } catch (error) {
    console.error(`Error fetching requestimportance: ${error.message}`);
    res.status(500).json({ message: "Error fetching requestimportance" });
  }
});

// @desc    Get requestimportance by user ID
// @route   GET /api/Stockrequestimportance/:userId
// @access  Private/Admin
const getStockRequestImportanceByUserId = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await db.pool.query(
      `SELECT ID, requestno, DATE_FORMAT(requestdate, '%d-%m-%Y') AS requestdate,
              requesttime, requestqty, img, electotronixPN, value, category, subcategory,
              footprint, weight, position, unitprice, manufacture, manufacturePN,
              supplier, supplierPN, moq, spq, link, process, description, alternative, note,
              important, important_message, updateImportanceBy, username, requestedUser, user_id, product_id
       FROM tbl_jit
       WHERE important = 1 AND cancel = 0 AND user_id = ?
       ORDER BY ID DESC`,
      [userId],
    );
    res.status(200).json({ requestimportances: rows });
  } catch (error) {
    console.error(`Error fetching requestimportance by user: ${error.message}`);
    res
      .status(500)
      .json({ message: "Error fetching requestimportance by user" });
  }
});

// @desc    Update importance flag and message
// @route   PUT /api/Stockproducts/:id/importance
// @access  Private/Admin
const updateStockRequestgoodImportance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { important, important_message, updatedBy } = req.body;

  try {
    const [result] = await db.pool.query(
      `UPDATE tbl_jit
       SET important = ?, important_message = ?, updateImportanceBy = ?
       WHERE ID = ?`,
      [important, important_message, updatedBy, id],
    );

    if (result.affectedRows === 0) {
      res.status(400);
      throw new Error("Failed to update importance");
    }

    res.status(200).json({ message: "Importance updated successfully" });
  } catch (error) {
    console.error(`Error updating importance: ${error.message}`);
    res.status(500).json({ message: "Error updating importance" });
  }
});

// @desc    Get all requestcancel
// @route   GET /api/Stockrequestcancel
// @access  Private/Admin
const getStockRequestCancel = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      `SELECT ID, requestno, DATE_FORMAT(requestdate, '%d-%m-%Y') AS requestdate,
              requesttime, requestqty, img, electotronixPN, value, category, subcategory,
              footprint, weight, position, unitprice, manufacture, manufacturePN,
              supplier, supplierPN, moq, spq, link, process, description, alternative, note,
              cancel, cancel_message, updateCancelBy, important_message, username, requestedUser, user_id, product_id
       FROM tbl_jit
       WHERE cancel = 1
       ORDER BY ID DESC`,
    );
    res.status(200).json({ requestcancels: rows });
  } catch (error) {
    console.error(`Error fetching requestcancel: ${error.message}`);
    res.status(500).json({ message: "Error fetching requestcancel" });
  }
});

// @desc    Get requestcancel by user ID
// @route   GET /api/Stockrequestcancel/:userId
// @access  Private/Admin
const getStockRequestCancelByUserId = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await db.pool.query(
      `SELECT ID, requestno, DATE_FORMAT(requestdate, '%d-%m-%Y') AS requestdate,
              requesttime, requestqty, img, electotronixPN, value, category, subcategory,
              footprint, weight, position, unitprice, manufacture, manufacturePN,
              supplier, supplierPN, moq, spq, link, process, description, alternative, note,
              cancel, cancel_message, updateCancelBy, important_message, username, requestedUser, user_id, product_id
       FROM tbl_jit
       WHERE cancel = 1 AND user_id = ?
       ORDER BY ID DESC`,
      [userId],
    );
    res.status(200).json({ requestcancels: rows });
  } catch (error) {
    console.error(`Error fetching requestcancel by user: ${error.message}`);
    res.status(500).json({ message: "Error fetching requestcancel by user" });
  }
});

// @desc    Update cancel flag and message
// @route   PUT /api/Stockproducts/:id/cancel
// @access  Private/Admin
const updateStockRequestgoodCancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancel_message, updateCancelBy, canceledUserId } = req.body;
  const cancel = 1;

  try {
    const [result] = await db.pool.query(
      `UPDATE tbl_jit
       SET cancel = ?, cancel_message = ?, updateCancelBy = ?, canceledUserId = ?
       WHERE ID = ?`,
      [cancel, cancel_message, updateCancelBy, canceledUserId, id],
    );

    if (result.affectedRows === 0) {
      res.status(400);
      throw new Error("Failed to update cancel status");
    }

    res.status(200).json({ message: "Cancel status updated successfully" });
  } catch (error) {
    console.error(`Error updating cancel: ${error.message}`);
    res.status(500).json({ message: "Error updating cancel" });
  }
});

module.exports = {
  createStockRequestgood,
  updateStockRequestgood,
  deleteStockRequestgood,
  getStockRequestgood,
  getStockRequestgoodDetails,
  updateStockRequestgoodQty,
  getStockRequestgoodUser,
  getStockRequestImportance,
  getStockRequestAllImportance,
  getStockRequestImportanceByUserId,
  updateStockRequestgoodImportance,
  getStockRequestCancel,
  getStockRequestCancelByUserId,
  updateStockRequestgoodCancel,
};
