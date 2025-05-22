const mongoose = require('mongoose');
const newCustomer = new mongoose.Schema({
    username: {
        type: String,
        required: false, // Optional for walk-in customers
        sparse: true,
    },
    name: {
        type: String,
        required: true, // Always required
    },
    nic: {
        type: String,
        required: true, // Optional for walk-in
        unique: true,
    },
    mobile: {
        type: String,
        required: true, // Optional for walk-in
        unique: true,
    },
    country: {
        type: String,
        required: false, // Optional for walk-in
    },
    city: {
        type: String,
        required: false, // Optional for walk-in
    },
    address: {
        type: String,
        required: false, // Optional for walk-in
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Customers = mongoose.model('customers', newCustomer);
module.exports = Customers;