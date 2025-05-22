const mongoose = require('mongoose');
const cashsSchema = new mongoose.Schema({
    cashHandIn:{
        type:Number
    },
    cashDeposit:{
        type:Number
    },
    cashWithdraw:{
        type:Number
    },
    totalBalance:{
        type:Number,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    name:{
        type:String,
    },
    openTime:{
        type:String,
        required:true
    },
    oneRupee:{ type:String, required:true, default:0 },
    twoRupee:{type:String, required:true, default:0 },
    fiveRupee:{type:String, required:true, default:0 },
    tenRupee:{type:String, required:true, default:0 },
    twentyRupee:{type:String, required:true, default:0 },
    fiftyRupee:{type:String, required:true, default:0 },
    hundredRupee:{type:String, required:true, default:0 },
    fiveHundredRupee:{type:String, required:true, default:0 },
    thousandRupee:{type:String, required:true, default:0 },
    fiveThousandRupee:{type:String, required:true, default:0 }
})
const Cash = mongoose.model('cash',cashsSchema)
module.exports= Cash;

