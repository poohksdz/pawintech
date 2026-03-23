const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  // Map ให้ตรงกับ Frontend ที่เคยใช้ _id และ Backend จริงที่เป็น ID
  _id: { 
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID' // ชื่อจริงใน Database
  },
  // 👇 แก้ชื่อ field ด้านล่างให้ตรงกับตาราง products ใน phpMyAdmin ของคุณ
  name: { type: DataTypes.STRING }, 
  image: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING },
  brand: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  countInStock: { type: DataTypes.INTEGER, defaultValue: 0 },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  showFront: { type: DataTypes.TINYINT, defaultValue: 1 } // ถ้ามี
}, {
  tableName: 'products',
  timestamps: false
});

module.exports = Product;