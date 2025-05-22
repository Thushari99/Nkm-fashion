const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    currentID: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    ptype: { type: String, required: true },
    discount: { type: Number}, 
    specialDiscount : { type: Number},
    variationValue: { type: String},
    quantity: { type: Number, required: true },
    stockQty: { type: Number },
    taxRate: { type: Number},
    subtotal: { type: Number, required: true },
    productProfit: {type: Number, required: true, default: 0},
    warehouse: { type: String, required: true },
});

const saleSchema = new mongoose.Schema({
    refferenceId : { type: String, required: true, unique: true }, 
    customer: { type: String},
    date: { type: Date, default: Date.now },
    discountType:{ type: String},
    discount: { type: String},
    grandTotal: { type: Number, required: true },
    pureProfit: {type: Number, required: true, default: 0 },
    orderStatus: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    paymentType: [
        {
            type: { type: String, required: true },
            amount: { type: Number, required: true }
        }
    ],
    paidAmount: { type: Number, default: 0 }, 
    productsData: { type: [productSchema], required: true },
    shipping: { type: String},
    tax: { type: String},
    warehouse: { type: String, required: true, default: null },
    offerPercentage: {type: Number, default: 0},
    cashierUsername: { 
        type: String, 
        default: "unknown" 
    },
    saleType: { type: String, enum: ['POS', 'Non-POS'], required: true }, 
    invoiceNumber: { type: String, default: null },
    returnStatus:{type:Boolean, required:true, default: false},
     note: { type: String },
    cashBalance: { type: Number, default: 0 },
},
{ timestamps: true } 
);

const Sale = mongoose.model('sale', saleSchema);

module.exports = Sale;
