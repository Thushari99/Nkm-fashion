// models/heldProduct.js
const mongoose = require('mongoose');

// Define the schema for a single held product
const heldProductSchema = new mongoose.Schema({
    currentID:{ type: String, required: true },
    name: { type: String, required: true },
    tax: {type: String},
    ptype:{type:String, required:true},
    variation:{type: String},
    price: { type: String, required: true },
    qty: { type: Number, required: true },
    subTotal: { type: String, required: true },
    warehouse: {type: String, required: true },
    discount: { type: Number, required: true },
});

// Define the schema for the collection of held products
const heldProductsSchema = new mongoose.Schema({
    referenceNo: { type: String, required: true },
    products: [heldProductSchema] // Array of held products
});

// Create the model from the schema
const HeldProducts = mongoose.model('HoldProducts', heldProductsSchema);

module.exports = HeldProducts;
