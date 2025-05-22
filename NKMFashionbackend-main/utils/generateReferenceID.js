const Counter = require('../models/counterModel');
const PrefixSettings = require('../models/prefixSettingsModel');

const generateReferenceId = async (category) => {
    // Fetch the prefix settings from the database
    const prefixSettings = await PrefixSettings.findOne();

    if (!prefixSettings) {
        throw new Error('Prefix settings not found in the database');
    }

    // Determine the prefix dynamically based on the category
    let prefix;
    switch (category) {
        case 'SALE':
            prefix = prefixSettings.salePrefix;
            break;
        case 'SALE_RETURN':
            prefix = prefixSettings.saleReturnPrefix;
            break;
        case 'PURCHASE':
            prefix = prefixSettings.purchasePrefix;
            break;
        case 'PURCHASE_RETURN':
            prefix = prefixSettings.purchaseReturnPrefix;
            break;
        case 'EXPENSE':
            prefix = prefixSettings.expensePrefix;
            break;
        case 'TRN':
            prefix = 'TRN'; 
            break;
        case 'ADJ':
            prefix = 'ADJ';
            break;
        default:
            throw new Error(`Unknown category: ${category}`);
    }

    // Use findOneAndUpdate with the $inc operator to atomically increment the counter
    const counter = await Counter.findOneAndUpdate(
        { category },
        { $inc: { currentValue: 1 } },
        { new: true, upsert: true } // Create a new counter if it doesn't exist
    );

    if (!counter) {
        throw new Error(`Failed to generate reference ID for category: ${category}`);
    }

    // Generate the reference ID
    return `${prefix}_${String(counter.currentValue).padStart(4, '0')}`;
};

module.exports = generateReferenceId;