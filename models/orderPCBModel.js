const mongoose = require('mongoose')

const orderPCBSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // ข้อมูลเกี่ยวกับไฟล์ PCB
    gerberFile: { type: String },
    pcbSpecifications: { type: Object }, 
    
    // ราคาและสถานะ
    quoted_price_to_customer: { type: Number, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    paymentSlip: { type: String },
    status: { type: String, default: 'Pending' }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('OrderPCB', orderPCBSchema)