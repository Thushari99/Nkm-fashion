const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    currentID: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    ptype: { type: String, required: true }, 
    variationValue: { type: String},
    quantity: { type: Number, required: true },
    taxRate: { type: Number},
    discount: { type: Number},
    subtotal: { type: Number, required: true },
    warehouse: { type: String, required: true },
});

const quatationSchema = new mongoose.Schema({
    customer: { type: String, required: true },
    date: { type: Date, default: Date.now },
    discountType:{ type: String},
    discount: { type: String},
    grandTotal: { type: Number, required: true },
    orderStatus: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    paymentType: { type: String, required: true },
    paidAmount: { type: Number, default: 0 }, 
    productsData: { type: [productSchema], required: true },
    shipping: { type: String},
    tax: { type: String},
    warehouse: { type: String, default: null },
    statusOfQuatation:{type:Boolean, required:true}
},
{ timestamps: true } 
);

const Quatation = mongoose.model('quatation', quatationSchema);
module.exports = Quatation;
