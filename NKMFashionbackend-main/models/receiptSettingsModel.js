// models/ReceiptSettings.js

const mongoose = require('mongoose');

const receiptSettingsSchema = new mongoose.Schema({
    note: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    customer: { type: Boolean, default: false },
    address: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    taxDiscountShipping: { type: Boolean, default: false },
    barcode: { type: Boolean, default: false },
    productCode: { type: Boolean, default: false },
    logo: { type: Boolean, default: false },
});

// Create a model from the schema
const ReceiptSettings = mongoose.model('ReceiptSettings', receiptSettingsSchema);

module.exports = ReceiptSettings;
