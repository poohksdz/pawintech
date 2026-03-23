const mongoose = require('mongoose')

const serviceSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String }, // เผื่อเก็บชื่อไอคอน
    image: { type: String },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Service', serviceSchema)