const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Folio = sequelize.define('Folio', {
  // กำหนดคอลัมน์ให้ตรงกับตารางใน Database ของคุณ
  // ตัวอย่าง (คุณต้องไปดูใน phpMyAdmin ว่าตาราง Folio/Showcase มีคอลัมน์ชื่ออะไรบ้างแล้วแก้ตามนี้)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  image: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING
  }
  // ... ใส่ให้ครบทุกคอลัมน์ที่มีในตาราง
}, {
  tableName: 'showcase', // ⚠️ สำคัญ: ใส่ชื่อตารางจริงใน phpMyAdmin (เช่น showcase หรือ folios)
  timestamps: false
});

module.exports = Folio;