const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    currentID: { type: String, required: true },
    name: { type: String, required: true },
    AdjustmentType: { type: String, required: true },
    price: { type: String, required: true },
    ptype: { type: String, required: true }, 
    variationValue: { type: String },
    quantity: { type: Number, required: true }, //
    taxRate: { type: Number },
    subtotal: { type: Number, required: true },
});

// Adjustment Schema
const adjustmentSchema = new mongoose.Schema({
    refferenceId: { type: String, required: true, unique: true }, // Changed to String and made unique
    date: { type: Date, default: Date.now },
    grandTotal: { type: Number, required: true },
    productsData: { type: [productSchema], required: true },
    warehouse: { type: String, default: null },
},
{ timestamps: true } 
);

const Adjustment = mongoose.model('adjustment', adjustmentSchema);
module.exports = Adjustment;
