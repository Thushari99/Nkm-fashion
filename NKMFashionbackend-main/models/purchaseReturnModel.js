const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    currentID: { type: String, required: true },
    variationValue: { type: String},
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    taxRate: { type: Number},
    subtotal: { type: Number, required: true },
    warehouse: { type: String,},
});

const purchaseReturnScheema = new Schema({
    refferenceId : { type: String, required: true, unique: true }, 
    date: { type: Date, required: true },
    supplier: { type: String, required: true },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    note: {type: String, required: true},
    productsData: [productSchema],
    warehouse: { type: String, required: true },
    returnType: { type: String, required: true },
},
{ timestamps: true } 
);

const PurchaseReturn = mongoose.model('purchaseReturn', purchaseReturnScheema);

module.exports = PurchaseReturn;
