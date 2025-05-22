const mongoose = require('mongoose');
const newExpenses = new mongoose.Schema({
    expensesName:{
        type:String,
        required:true
    },
})
const Expenses = mongoose.model('expensescategories',newExpenses);
module.exports = Expenses;
