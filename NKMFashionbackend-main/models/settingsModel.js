const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    email: { type: String, required: true },
    currency: { type: String, required: true },
    companyName: { type: String, required: true },
    companyMobile: { type: String, required: true },
    developerBy: { type: String },
    footer: { type: String },
    country: { type: String },
    city: { type: String },
    dateFormat: { type: String },
    postalCode: { type: String },
    address: { type: String },
    defaultWarehouse: { type: String },
    logo: String,
});

module.exports = mongoose.model('Settings', settingsSchema);
