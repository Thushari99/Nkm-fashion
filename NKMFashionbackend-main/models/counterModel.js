const mongoose = require('mongoose');

// Counter schema for reference ID generation
const counterSchema = new mongoose.Schema({
    category: { type: String, required: true, unique: true }, // e.g., 'TRN', 'SL', 'PUR'
    currentValue: { type: Number, default: 1 }, // Start with 1, increment for each new reference ID
});

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;