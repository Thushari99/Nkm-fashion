const mongoose = require('mongoose');

// Variation schema
const variationSchema = new mongoose.Schema({
  productQty: { type: Number, default: 0 },
  code: { type: String ,},
  orderTax: { type: Number , default: 0 },
  productCost: { type: Number , default: 0},
  productPrice: { type: Number , default: 0 },
  stockAlert: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxType: { type: String , default: 'Exclusive' },
}, { _id: false });

// Warehouse schema
const warehouseSchema = new mongoose.Schema({
  warehouseName: { type: String,},
  productQty: { type: Number},
  code: { type: String },
  orderTax: { type: Number},
  productCost: { type: Number},
  productPrice: { type: Number},
  discount: { type: Number, default: 0},
  stockAlert: { type: Number},
  taxType: { type: String},
  variationType: { type: String},
  variationValues: { type: Map, of: variationSchema },
}, { _id: false });

// Product schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  barcode: { type: String },
  image: { type: String },
  unit: { type: String, required: true },
  saleUnit: { type: String, required: true },
  purchase: { type: String, required: true },
  ptype: { type: String, required: true },
  quantityLimit: { type: Number },
  supplier: { type: String, required: true },
  warehouse: { type: Map, of: warehouseSchema },
  variation: { type: String },
  status: { type: String, default: 'Pending' },
  note: { type: String }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
