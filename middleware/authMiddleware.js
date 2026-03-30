const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { pool } = require("../config/db.js"); //  แก้ไข 1: เรียกใช้ pool แบบนี้

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. ดึง Token จาก Cookie หรือ Header
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtErr) {
        console.error("❌ JWT Verify Failed:", jwtErr.message);
        res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
        res.status(401);
        throw new Error("Not authorized, token failed");
      }

      // 2. ดึง ID จาก Token (รองรับทั้ง userId และ id)
      const userId = decoded.userId || decoded.id;

      let rows;
      try {
        const sql = `SELECT * FROM users WHERE _id = ?`;
        const [result] = await pool.query(sql, [userId]);
        rows = result;
      } catch (dbErr) {
        console.error("❌ Database Query Failed in Auth:", dbErr.message);
        res.status(500);
        throw new Error("Internal Server Error (Auth DB)");
      }

      if (rows && rows.length > 0) {
        // เจอ User แล้ว!
        req.user = rows[0];
        delete req.user.password; // ลบรหัสผ่านออกเพื่อความปลอดภัย

        // แปลงค่า 1/0 เป็น Boolean (เพื่อให้ Role ทำงานถูกต้อง)
        req.user.isAdmin = req.user.isAdmin === 1;
        req.user.isStaff = req.user.isStaff === 1;
        req.user.isStore = req.user.isStore === 1;
        req.user.isPCBAdmin = req.user.isPCBAdmin === 1;

        next();
      } else {
        console.error("❌ User not found in SQL Database for ID:", userId);
        res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
        res.status(401);
        throw new Error("User not found");
      }
    } catch (error) {
      if (!res.headersSent) {
        res.status(res.statusCode === 200 ? 401 : res.statusCode);
      }
      throw error;
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Role Middleware (เช็ค Boolean หรือ 1)
const staff = (req, res, next) => {
  if (req.user && (req.user.isStaff === true || req.user.isStaff === 1)) next();
  else {
    res.status(403);
    throw new Error("Not authorized as Staff");
  }
};

const store = (req, res, next) => {
  if (req.user && (req.user.isStore === true || req.user.isStore === 1)) next();
  else {
    res.status(403);
    throw new Error("Not authorized as Store");
  }
};

const pcbadmin = (req, res, next) => {
  if (req.user && (req.user.isPCBAdmin === true || req.user.isPCBAdmin === 1))
    next();
  else {
    res.status(403);
    throw new Error("Not authorized as PCB Admin");
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin === true || req.user.isAdmin === 1)) next();
  else {
    res.status(403);
    throw new Error("Not authorized as Admin");
  }
};

module.exports = { protect, staff, store, pcbadmin, admin };
