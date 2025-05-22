const mongoose = require('mongoose');

const baseUnitSchema = new mongoose.Schema({
    BaseUnitName: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('BaseUnit', baseUnitSchema);
