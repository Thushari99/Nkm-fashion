const mongoose = require('mongoose');

// Product Schema (for items sold in staff refreshments)
const productSchema = new mongoose.Schema({
    currentId: { type: String, required: true },  // Changed to match frontend key
    name: { type: String, required: true },
    issuedQty: { type: Number, required: true },
    returnQty: { type: Number, default: 0 },
    productCost: { type: Number, required: true },
    stockQty: {type:Number, required:true},
    totalCost: { type: Number, required: true },
    variation: { type: String },
    warehouseId: { type: String, required: true },  // Ensure warehouseId is part of the product schema
});

// Sale Schema (staff refreshments sales)
const saleSchema = new mongoose.Schema({
    totalAmount: { type: String, required: true }, // Added totalAmount field to match the frontend
    date: { type: Date, default: Date.now },
    productsData: { type: [productSchema], required: true },  // Reference to the products array
    warehouse: { type: String, required: true, default: null },
}, { timestamps: true });

const Sale = mongoose.model('staffRefreshmentSale', saleSchema);

module.exports = Sale;
