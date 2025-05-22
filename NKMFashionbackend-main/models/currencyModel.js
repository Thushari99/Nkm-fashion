const mongoose = require('mongoose');
const newCurrency = new mongoose.Schema({
    currencyName:{
        type:String,
        required:true
    },
    currencyCode:{
        type:String,
        required:true,
        unique: true,
    },
    currencySymbole:{
        type:String,
        required:true
    }
})
const Currency = mongoose.model('currency', newCurrency);
module.exports = Currency;
