const mongoose = require('mongoose');
const variationSchema = mongoose.Schema({
    variationName: {
        type: String,
        required: true
    },
    variationType: {
        type: [String],
        required: true
    },
});

const variation = mongoose.model('Variation', variationSchema);
module.exports = variation;
