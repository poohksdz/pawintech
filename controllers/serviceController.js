const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js"); //  แก้ไข 1: เรียกใช้ pool แบบนี้
const deleteFile = require("../utils/fileUtils");

// @desc    Fetch all services
// @route   GET /api/services
// @access  Public
const getServices = asyncHandler(async (req, res) => {
  try {
    //  ใช้ pool.query และแปลง ID ให้เป็น _id (ถ้า Frontend ต้องการ)
    const [rows] = await pool.query("SELECT *, ID as _id FROM services");
    res.status(200).json({ services: rows });
  } catch (error) {
    console.error(`Error fetching services: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching services");
  }
});

// @desc    Fetch single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT *, ID as _id FROM services WHERE ID = ?",
      [id],
    );

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Service not found");
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching service: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching service");
  }
});

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = asyncHandler(async (req, res) => {
  const {
    headerTextOne,
    headerTextTwo,
    headerTextThree,
    headerTextFour,
    headerTextFive,
    bodyTextOne,
    bodyTextTwo,
    bodyTextThree,
    bodyTextFour,
    bodyTextFive,
    headerThaiOne,
    headerThaiTwo,
    headerThaiThree,
    headerThaiFour,
    headerThaiFive,
    bodyTextThaiOne,
    bodyTextThaiTwo,
    bodyTextThaiThree,
    bodyTextThaiFour,
    bodyTextThaiFive,
    imageOne,
    imageTwo,
    imageThree,
    imageFour,
    imageFive,
    deploymentTypes,
  } = req.body;

  // Validation Logic (เช็คว่าว่างหมดเลยไหม)
  if (
    !headerTextOne &&
    !bodyTextOne &&
    !headerThaiOne &&
    !bodyTextThaiOne &&
    !headerTextTwo &&
    !bodyTextTwo &&
    !headerThaiTwo &&
    !bodyTextThaiTwo &&
    !headerTextThree &&
    !bodyTextThree &&
    !headerThaiThree &&
    !bodyTextThaiThree &&
    !headerTextFour &&
    !bodyTextFour &&
    !headerThaiFour &&
    !bodyTextThaiFour &&
    !headerTextFive &&
    !bodyTextFive &&
    !headerThaiFive &&
    !bodyTextThaiFive &&
    !imageOne &&
    !imageTwo &&
    !imageThree &&
    !imageFour &&
    !imageFive
  ) {
    res.status(400);
    throw new Error("Missing required fields, all required fields are empty.");
  }

  try {
    const query = `
      INSERT INTO services (
        headerTextOne, headerTextTwo, headerTextThree, headerTextFour, headerTextFive,
        bodyTextOne, bodyTextTwo, bodyTextThree, bodyTextFour, bodyTextFive,
        headerThaiOne, headerThaiTwo, headerThaiThree, headerThaiFour, headerThaiFive,
        bodyTextThaiOne, bodyTextThaiTwo, bodyTextThaiThree, bodyTextThaiFour, bodyTextThaiFive,
        imageOne, imageTwo, imageThree, imageFour, imageFive, 
        deploymentTypes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      //  ใช้ pool.query
      headerTextOne,
      headerTextTwo,
      headerTextThree,
      headerTextFour,
      headerTextFive,
      bodyTextOne,
      bodyTextTwo,
      bodyTextThree,
      bodyTextFour,
      bodyTextFive,
      headerThaiOne,
      headerThaiTwo,
      headerThaiThree,
      headerThaiFour,
      headerThaiFive,
      bodyTextThaiOne,
      bodyTextThaiTwo,
      bodyTextThaiThree,
      bodyTextThaiFour,
      bodyTextThaiFive,
      imageOne,
      imageTwo,
      imageThree,
      imageFour,
      imageFive,
      deploymentTypes,
    ]);

    res.status(201).json({
      message: "Service created successfully",
      service: {
        id: result.insertId, // ID ที่เพิ่งสร้าง
        ...req.body,
      },
    });
  } catch (error) {
    console.error(`Error creating service: ${error.message}`);
    res.status(500);
    throw new Error("Error creating service");
  }
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    headerTextOne,
    headerTextTwo,
    headerTextThree,
    headerTextFour,
    headerTextFive,
    bodyTextOne,
    bodyTextTwo,
    bodyTextThree,
    bodyTextFour,
    bodyTextFive,
    headerThaiOne,
    headerThaiTwo,
    headerThaiThree,
    headerThaiFour,
    headerThaiFive,
    bodyTextThaiOne,
    bodyTextThaiTwo,
    bodyTextThaiThree,
    bodyTextThaiFour,
    bodyTextThaiFive,
    imageOne,
    imageTwo,
    imageThree,
    imageFour,
    imageFive,
    deploymentTypes,
  } = req.body;

  if (
    !headerTextOne &&
    !bodyTextOne &&
    !headerThaiOne &&
    !bodyTextThaiOne &&
    !headerTextTwo &&
    !bodyTextTwo &&
    !headerThaiTwo &&
    !bodyTextThaiTwo &&
    !headerTextThree &&
    !bodyTextThree &&
    !headerThaiThree &&
    !bodyTextThaiThree &&
    !headerTextFour &&
    !bodyTextFour &&
    !headerThaiFour &&
    !bodyTextThaiFour &&
    !headerTextFive &&
    !bodyTextFive &&
    !headerThaiFive &&
    !bodyTextThaiFive &&
    !imageOne &&
    !imageTwo &&
    !imageThree &&
    !imageFour &&
    !imageFive
  ) {
    res.status(400);
    throw new Error("Missing required fields, all required fields are empty.");
  }

  try {
    const [existingService] = await pool.query(
      //  ใช้ pool.query
      "SELECT * FROM services WHERE ID = ?",
      [id],
    );

    if (existingService.length === 0) {
      res.status(404);
      throw new Error("Service not found");
    }

    const query = `
      UPDATE services
      SET  headerTextOne = ?, headerTextTwo = ?, headerTextThree = ?, headerTextFour = ?, headerTextFive = ?, bodyTextOne = ?, bodyTextTwo = ?, bodyTextThree = ?, bodyTextFour = ?, bodyTextFive = ?, headerThaiOne = ?, headerThaiTwo = ?, headerThaiThree = ?, headerThaiFour = ?, headerThaiFive = ?, bodyTextThaiOne = ?, bodyTextThaiTwo = ?, bodyTextThaiThree = ?, bodyTextThaiFour = ?, bodyTextThaiFive = ?, imageOne = ?, imageTwo = ?, imageThree = ?, imageFour = ?, imageFive = ?, deploymentTypes = ?
      WHERE ID = ?
    `;

    const [result] = await pool.query(query, [
      //  ใช้ pool.query
      headerTextOne,
      headerTextTwo,
      headerTextThree,
      headerTextFour,
      headerTextFive,
      bodyTextOne,
      bodyTextTwo,
      bodyTextThree,
      bodyTextFour,
      bodyTextFive,
      headerThaiOne,
      headerThaiTwo,
      headerThaiThree,
      headerThaiFour,
      headerThaiFive,
      bodyTextThaiOne,
      bodyTextThaiTwo,
      bodyTextThaiThree,
      bodyTextThaiFour,
      bodyTextThaiFive,
      imageOne,
      imageTwo,
      imageThree,
      imageFour,
      imageFive,
      deploymentTypes,
      id,
    ]);

    // ตรวจสอบว่ามีแถวถูกกระทบหรือไม่ (เผื่อข้อมูลเหมือนเดิมเป๊ะๆ SQL อาจจะบอกว่า 0 rows affected ในบาง config)
    // แต่โดยทั่วไปถ้า ID ถูกต้องถือว่า OK
    res.status(200).json({
      message: "Service updated successfully",
      service: { id, ...req.body },
    });
  } catch (error) {
    console.error(`Error updating service: ${error.message}`);
    res.status(500);
    throw new Error("Error updating service");
  }
});

// @desc    Delete a service
const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const [existingService] = await pool.query(
      "SELECT * FROM services WHERE ID = ?",
      [id],
    );

    if (existingService.length === 0) {
      res.status(404);
      throw new Error("Service not found");
    }

    const service = existingService[0];

    // Cleanup images from disk
    const imagesToDelete = [
      service.imageOne,
      service.imageTwo,
      service.imageThree,
      service.imageFour,
      service.imageFive,
    ];
    imagesToDelete.forEach((img) => deleteFile(img));

    await pool.query("DELETE FROM services WHERE ID = ?", [id]);

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error(`Error deleting service: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting service");
  }
});

// @desc    Update showFront service
// @route   PUT /api/services/:id/showfront
// @access  Private/Admin
const updateShowFrontService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { showFront } = req.body;

  try {
    const [service] = await pool.query(
      //  ใช้ pool.query
      "SELECT * FROM services WHERE ID = ?",
      [id],
    );

    if (service.length === 0) {
      res.status(404);
      throw new Error("Service not found");
    }

    const query = `UPDATE services SET showFront = ? WHERE ID = ?`;
    await pool.query(query, [showFront, id]); //  ใช้ pool.query

    res
      .status(200)
      .json({ message: "Service show status updated successfully" });
  } catch (error) {
    console.error(`Error updating service: ${error.message}`);
    res.status(500);
    throw new Error("Error updating service");
  }
});

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  updateShowFrontService,
};
