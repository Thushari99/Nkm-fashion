const mongoose = require('mongoose');
const newSuplier = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    companyName:{
        type:String,
        required:true
    },
    nic:{
        type:String,
        required:true,
    },
    mobile:{
        type:String,
        required:true,
        unique:true
    },
    country:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    createdAt: {
        type: Date,
        default: Date.now 
    }
})
const Suplier = mongoose.model('suplier',newSuplier);
module.exports =Suplier;