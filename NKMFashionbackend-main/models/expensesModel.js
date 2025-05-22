const mongoose = require('mongoose');

const newExpensesData = new mongoose.Schema({
    refferenceId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    warehouse: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
},
{ timestamps: true } 
);

const ExpensesData = mongoose.model('Expenses', newExpensesData);
module.exports = ExpensesData;