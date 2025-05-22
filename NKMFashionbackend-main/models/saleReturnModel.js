const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    currentID: { type: String, required: true },
    variationValue: { type: String},
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    returnQty: {type: Number, required: true},
    taxRate: { type: Number},
    subtotal: { type: Number, required: true },
    warehouse: { type: String, required: true },
    discount: { type: String, default:0},
    returnStatus:{type:Boolean, required:true, default: false},
});

const saleReturnScheema = new Schema({
    refferenceId : { type: String, required: true, unique: true }, 
    date: { type: Date, required: true },
    customer: { type: String, required: true },
    warehouse: { type: String, required: true },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    returnAmount: { type: Number, required: true },
    note: {type: String, required: true},
    productsData: [productSchema]
},
{ timestamps: true } 
);

const SaleReturn = mongoose.model('saleReturn', saleReturnScheema);

module.exports = SaleReturn;
