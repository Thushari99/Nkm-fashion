const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    saleId: {
        type:String,
        required: true
    },
    amountToPay: {
        type: Number,
        required: true
    },
    payingAmount: {
        type: Number,
        required: true
    },
    currentDate: {
        type: Date,
        default: Date.now
    },
    paymentType: {
        type: String,
        required: true
    }
})

const Payment = mongoose.model('sale_payment', PaymentSchema);

module.exports = Payment;
