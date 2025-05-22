const mongoose = require('mongoose');

const DenominationSchema = new mongoose.Schema({
  denomination: { type: Number, required: true },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true }
});

const ZReadingSchema = new mongoose.Schema({
  cardPaymentAmount: { type: Number, required: true },
  cashPaymentAmount: { type: Number, required: true },
  bankTransferPaymentAmount: { type: Number, required: true },
  totalDiscountAmount: { type: Number, required: true },
  inputs: [DenominationSchema],
  registerData: {
    type: Map, 
    of: mongoose.Schema.Types.Mixed, 
    default: {}
  },
  cashVariance: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ZReading', ZReadingSchema);