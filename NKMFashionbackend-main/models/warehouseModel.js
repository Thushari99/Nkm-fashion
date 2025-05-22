const mongoose = require('mongoose');

const newWherehouseSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    mobile: {
        type: String, 
        required: true,
        unique: true
    },
    country: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    manager: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Wherehouse = mongoose.model('Wherehouse', newWherehouseSchema);  // Capitalized the model name
module.exports = Wherehouse;
