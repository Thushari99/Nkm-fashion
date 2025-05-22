const mongoose = require('mongoose');
const brandSchema = mongoose.Schema({
    brandName: {
        type: String,
        required: true
    },
    logo: {
        type:String
    },
});
const Brands = mongoose.model('Brand', brandSchema);
module.exports = Brands;
