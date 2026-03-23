const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db'); // ⚠️ เช็คว่า path นี้ตรงกับไฟล์ connect DB ของคุณ

const User = sequelize.define('User', {
  // map ให้ตรงกับตาราง users ใน phpMyAdmin ของคุณทุกช่อง
  _id: { 
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.TINYINT, // MySQL ใช้ TINYINT แทน Boolean
    defaultValue: 0
  },
  isPCBAdmin: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  isStore: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  isStaff: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users', // ชื่อตารางใน Database
  timestamps: false   // ✅✅ คำสั่งสำคัญ: ปิดไม่ให้หา created_at/updated_at
});

// --- Method สำหรับเช็ค Password (ใช้ตอน Login) ---
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- Hook สำหรับเข้ารหัส Password ก่อนบันทึก (Register/Update) ---
User.beforeSave(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

module.exports = User;