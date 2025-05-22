// models/PrefixSettings.js
const mongoose = require('mongoose');

// Define the schema
const prefixSettingsSchema = new mongoose.Schema({
    salePrefix: {
        type: String,
        required: true,
    },
    saleReturnPrefix: {
        type: String,
        required: true,
    },
    purchasePrefix: {
        type: String,
        required: true,
    },
    purchaseReturnPrefix: {
        type: String,
        required: true,
    },
    expensePrefix: {
        type: String,
        required: true,
    },
});

const PrefixSettings = mongoose.model('PrefixSettings', prefixSettingsSchema);
module.exports = PrefixSettings;
