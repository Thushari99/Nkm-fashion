const Registry = require('../../models/posModel/cashModel');

// Controller to get all registry
const getAllRegistry = async (req, res) => {
    try {
        const registry  = await Registry.find(); // Fetch all registry documents
        res.status(200).json({ data: registry });
    } catch (error) {
        // Log error for debugging
        console.error("Error getting all registry:", error);

        // Return a more generic error message for unexpected issues
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

module.exports = {getAllRegistry}