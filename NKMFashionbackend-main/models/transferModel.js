const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    currentID: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    ptype: { type: String, required: true }, 
    variationValue: { type: String },
    quantity: { type: Number, required: true },
    taxRate: { type: Number },
    subtotal: { type: Number, required: true },
    warehouse: { type: String, required: true } 
});

// Transfer Schema
const transferSchema = new mongoose.Schema({
    refferenceId: { type: String, required: true, unique: true }, 
    date: { type: Date, default: Date.now },
    warehouseFrom: { type: String, default: null },
    warehouseTo: { type: String, default: null },
    discountType:{ type: String },
    discount: { type: String},
    shipping: { type: String},
    tax: { type: String},
    orderStatus: { type: String, required: true },
    grandTotal: { type: Number, required: true },
    productsData: { type: [productSchema], required: true },
});

const Transfer = mongoose.model('transfer', transferSchema);
module.exports = Transfer;
