const mongoose = require('mongoose');

const offersSchema = new mongoose.Schema({
    offerName: { 
        type: String, 
        required: true,
        unique: true,
    },
    percentage: { 
        type: String,
        required: true,
    },
    createdBy: { 
        type: String,
        required: true,
    },
    endDate: { 
        type: String,
    },
});

offersSchema.index({ offerName: 1 }, { unique: true });
const Offers = mongoose.model('Offers', offersSchema);
module.exports = Offers;
