const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchasePaymentSchema = new Schema({
    purchaseId: {
        type: String,
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
});

const PurchasePayment = mongoose.model('purchase_payment', PurchasePaymentSchema);

module.exports = PurchasePayment;
