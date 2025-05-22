const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    currentID: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    variationValue: { type: String},
    ptype: { type: String, required: true }, 
    quantity: { type: Number, required: true },
    taxRate: { type: Number},
    subtotal: { type: Number, required: true },
});

const purchaseSchema = new mongoose.Schema({
    refferenceId : { type: String, required: true, unique: true }, 
    supplier: { type: String, required: true },
    invoiceNumber: { type: String},
    date: { type: Date, default: Date.now },
    discountType:{ type: String, required: true },
    discount: { type: String},
    grandTotal: { type: Number, required: true },
    orderStatus: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    paymentType: { type: String, required: true,required: true },
    paidAmount: { type: Number, default: 0 }, 
    productsData: { type: [productSchema], required: true },
    shipping: { type: String },
    tax: { type: String},
    warehouse: { type: String, required: true, default: null },
},
{ timestamps: true } 
);

const Purchase = mongoose.model('purchase', purchaseSchema);

module.exports = Purchase;
