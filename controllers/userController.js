const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db");
const generateToken = require("../utils/generateToken");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { resetPasswordTemplate } = require("../utils/emailTemplates");

// ==========================================
//  AUTHENTICATION & USER PROFILE
// ==========================================

//  Helper: แปลง JSON อย่างปลอดภัย (ป้องกันบั๊กการดึงข้อมูลที่อยู่ไม่ขึ้น)
const parseJSON = (data) => {
  try {
    if (!data) return {};
    // ถ้าฐานข้อมูล (MySQL Driver) แปลงเป็น Object มาให้แล้ว ให้ส่งค่ากลับได้เลย
    if (typeof data === "object") return data;
    // ถ้ายังเป็น String อยู่ ค่อยแปลงด้วย JSON.parse
    return JSON.parse(data);
  } catch (e) {
    console.error("🔥 JSON Parse Error:", e.message);
    return {};
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. ค้นหา User ด้วย Email
  const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  const user = users[0];

  // 2. เช็ค User และ Password
  if (user && (await bcrypt.compare(password, user.password))) {
    const userId = user._id || user.id;

    generateToken(res, userId); // สร้าง Token

    // ส่งข้อมูลแนบที่อยู่กลับไปด้วย
    res.json({
      _id: userId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin === 1,
      isStaff: user.isStaff === 1,
      isStore: user.isStore === 1,
      isPCBAdmin: user.isPCBAdmin === 1,
      // ดึงที่อยู่ที่เก็บไว้เป็น JSON ออกมา
      shippingAddress: parseJSON(user.shippingAddress),
      billingAddress: parseJSON(user.billingAddress),
    });
  } else {
    res.status(401);
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }
});

// @desc    Register user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. เช็คว่ามี User นี้หรือยัง
  const [existingUser] = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
  );

  if (existingUser.length > 0) {
    res.status(400);
    throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
  }

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Insert User
  const sql = `INSERT INTO users (name, email, password, isAdmin, isStaff, isStore, isPCBAdmin, created_at) VALUES (?, ?, ?, 0, 0, 0, 0, NOW())`;
  const [result] = await pool.query(sql, [name, email, hashedPassword]);

  const newUserId = result.insertId;

  if (newUserId) {
    generateToken(res, newUserId);

    res.status(201).json({
      _id: newUserId,
      name,
      email,
      isAdmin: false,
    });
  } else {
    res.status(400);
    throw new Error("ข้อมูลผู้ใช้งานไม่ถูกต้อง");
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const [users] = await pool.query("SELECT * FROM users WHERE _id = ?", [
    req.user._id,
  ]);
  const user = users[0];

  if (user) {
    const userId = user._id || user.id;
    res.json({
      _id: userId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin === 1 || user.isAdmin === true,
      isStaff: user.isStaff === 1 || user.isStaff === true,
      isStore: user.isStore === 1 || user.isStore === true,
      isPCBAdmin: user.isPCBAdmin === 1 || user.isPCBAdmin === true,
      shippingAddress: parseJSON(user.shippingAddress),
      billingAddress: parseJSON(user.billingAddress),
    });
  } else {
    res.status(404);
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
  }
});

// @desc    Update user profile (อัปเดตข้อมูลส่วนตัวและที่อยู่จัดส่ง)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const [users] = await pool.query("SELECT * FROM users WHERE _id = ?", [
    req.user._id,
  ]);
  const user = users[0];

  if (user) {
    const userId = user._id;
    const name = req.body.name || user.name;
    const email = req.body.email || user.email;
    let password = user.password;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(req.body.password, salt);
    }

    // แปลง Object ที่อยู่เป็น JSON String เพื่อเก็บลง Database
    // ตรวจสอบข้อมูลก่อนแปลง
    const shippingData =
      req.body.shippingAddress &&
        Object.keys(req.body.shippingAddress).length > 0
        ? req.body.shippingAddress
        : parseJSON(user.shippingAddress);
    const billingData =
      req.body.billingAddress && Object.keys(req.body.billingAddress).length > 0
        ? req.body.billingAddress
        : parseJSON(user.billingAddress);

    const shippingAddressStr = JSON.stringify(shippingData);
    const billingAddressStr = JSON.stringify(billingData);
    const rawAddress = req.body.shippingAddress?.address || user.address || "";

    // อัปเดตข้อมูลทั้งหมดลง Database
    const sql = `UPDATE users SET name=?, email=?, password=?, address=?, shippingAddress=?, billingAddress=? WHERE _id=?`;
    await pool.query(sql, [
      name,
      email,
      password,
      rawAddress,
      shippingAddressStr,
      billingAddressStr,
      userId,
    ]);

    // ดึงข้อมูลใหม่หลังจากอัปเดตเสร็จ
    const [updatedUserRows] = await pool.query(
      "SELECT * FROM users WHERE _id = ?",
      [userId],
    );
    const updatedUser = updatedUserRows[0];

    //  คืนค่ากลับไปให้ Frontend (Redux) อัปเดต state แบบครบทุกสิทธิ์ 
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin === 1 || updatedUser.isAdmin === true,
      isStaff: updatedUser.isStaff === 1 || updatedUser.isStaff === true,
      isStore: updatedUser.isStore === 1 || updatedUser.isStore === true,
      isPCBAdmin:
        updatedUser.isPCBAdmin === 1 || updatedUser.isPCBAdmin === true,
      shippingAddress: parseJSON(updatedUser.shippingAddress),
      billingAddress: parseJSON(updatedUser.billingAddress),
    });
  } else {
    res.status(404);
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
  }
});

// @desc    Update user profile Shipping Only
// @route   PUT /api/users/shipping
const updateUserProfileShipping = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. ดึงข้อมูล User ปัจจุบันออกมาเพื่อใช้เป็นฐานในการ Merge
  const [users] = await pool.query("SELECT shippingAddress, billingAddress FROM users WHERE _id = ?", [userId]);
  const user = users[0];

  if (!user) {
    res.status(404);
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
  }

  // 2. Merge ข้อมูล (ถ้าไม่มีข้อมูลส่งมา ให้ใช้ของเดิมที่มีอยู่)
  const shippingData = req.body.shippingAddress || parseJSON(user.shippingAddress);
  const billingData = req.body.billingAddress || parseJSON(user.billingAddress);

  const shippingAddressJSON = JSON.stringify(shippingData);
  const billingAddressJSON = JSON.stringify(billingData);

  try {
    const sql = `UPDATE users SET shippingAddress=?, billingAddress=? WHERE _id=?`;
    await pool.query(sql, [shippingAddressJSON, billingAddressJSON, userId]);
    res.json({
      message: "อัปเดตที่อยู่สำเร็จ",
      shippingAddress: shippingData,
      billingAddress: billingData
    });
  } catch (e) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกที่อยู่" });
  }
});

// ==========================================
//  ADMIN SECTION
// ==========================================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  //  ดึงเฉพาะฟิลด์ที่จำเป็น และยกเว้น password เพื่อความปลอดภัย
  const sql = `SELECT _id, name, email, isAdmin, isStaff, isStore, isPCBAdmin, created_at, address, shippingAddress, billingAddress FROM users`;
  const [users] = await pool.query(sql);
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const [users] = await pool.query("SELECT * FROM users WHERE _id = ?", [
    req.params.id,
  ]);
  const user = users[0];

  if (user) {
    delete user.password;
    res.json(user);
  } else {
    res.status(404);
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const [users] = await pool.query("SELECT * FROM users WHERE _id = ?", [
    req.params.id,
  ]);
  const user = users[0];

  if (user) {
    if (user.isAdmin === 1) {
      res.status(400);
      throw new Error("ไม่สามารถลบบัญชีผู้ดูแลระบบได้");
    }
    await pool.query("DELETE FROM users WHERE _id = ?", [user._id]);
    res.json({ message: "ลบผู้ใช้งานสำเร็จ" });
  } else {
    res.status(404);
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
  }
});

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, isAdmin, isStaff, isStore, isPCBAdmin } = req.body;

  // แปลง Boolean เป็น 1/0
  const valIsAdmin = isAdmin ? 1 : 0;
  const valIsStaff = isStaff ? 1 : 0;
  const valIsStore = isStore ? 1 : 0;
  const valIsPCBAdmin = isPCBAdmin ? 1 : 0;

  const sql = `UPDATE users SET name=?, email=?, isAdmin=?, isStaff=?, isStore=?, isPCBAdmin=? WHERE _id=?`;
  await pool.query(sql, [
    name,
    email,
    valIsAdmin,
    valIsStaff,
    valIsStore,
    valIsPCBAdmin,
    req.params.id,
  ]);

  res.json({ message: "อัปเดตข้อมูลผู้ใช้งานสำเร็จ" });
});

// @desc    Update user Staff Only
// @route   PUT /api/users/:id/Staff
const updateUserStaff = asyncHandler(async (req, res) => {
  res.json({ message: "อัปเดตสถานะพนักงานสำเร็จ" });
});

// ==========================================
//  EMAIL & PASSWORD RESET SECTION
// ==========================================

// Helper Function: ส่ง Email
const sendRequestEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport(
      process.env.EMAIL_HOST
        ? {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
        : {
          service: process.env.EMAIL_SERVICE || "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html, //  รองรับ HTML
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
  }
};

// @desc    Request Password Reset
// @route   POST /api/users/request-reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  const user = users[0];

  // IMPORTANT: ALWAYS return success to prevent account enumeration
  if (!user) {
    return res
      .status(200)
      .json({
        message: "หากพบอีเมลในระบบ เราจะส่งลิงก์สำหรับเปลี่ยนรหัสผ่านไปให้",
      });
  }

  // สร้าง Token โดยแฝง Hash ของรหัสผ่านปัจจุบันเข้าไปด้วย
  // หากรหัสผ่านถูกเปลี่ยน Token จะใช้ไม่ได้ทันที
  const userId = user._id || user.id;
  const passwordHash = user.password.substring(0, 10); // ใช้แค่ส่วนหัวของ Hash เพื่อความสั้น

  const resetToken = jwt.sign(
    { id: userId, h: passwordHash },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const resetUrl = `${process.env.APP_URL}/resetpassword?token=${resetToken}`;

  await sendRequestEmail({
    to: email,
    subject: "คำขอเปลี่ยนรหัสผ่าน (Password Reset Request)",
    text: `กรุณาคลิกลิงก์เพื่อเปลี่ยนรหัสผ่านของคุณ: ${resetUrl}`,
    html: resetPasswordTemplate(resetUrl, user.name),
  });

  res
    .status(200)
    .json({
      message: "หากพบอีเมลในระบบ เราจะส่งลิงก์สำหรับเปลี่ยนรหัสผ่านไปให้",
    });
});

// @desc    Reset Password
// @route   POST /api/users/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ค้นหา User จาก ID ใน Token
    const [users] = await pool.query("SELECT * FROM users WHERE _id = ?", [
      decoded.id,
    ]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    // ตรวจสอบว่า Password Hash ยังตรงกับตอนออก Token หรือไม่ (ป้องกัน Token เก่าหลังเปลี่ยนรหัสไปแล้ว)
    if (decoded.h !== user.password.substring(0, 10)) {
      return res
        .status(400)
        .json({ message: "ลิงก์นี้ถูกใช้งานไปแล้ว หรือไม่สามารถใช้งานได้อีก" });
    }

    // Hash Password ใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update ลง DB
    const userId = user._id || user.id;
    await pool.query("UPDATE users SET password = ? WHERE _id = ?", [
      hashedPassword,
      userId,
    ]);

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    return res.status(400).json({ message: "ลิงก์ไม่ถูกต้อง หรือหมดอายุแล้ว" });
  }
});

// ==========================================
//  EXPORTS
// ==========================================
module.exports = {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserStaff,
  updateUserProfileShipping,
  requestPasswordReset,
  resetPassword,
};
