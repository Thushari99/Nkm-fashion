const Offers = require('../../models/offersModel');

const CreateOffer = async (req, res) => {
    const { offerName, percentage, createdBy, endDate } = req.body;
    try {
        // Validate input fields
        const missingFields = [];
        if (!offerName) missingFields.push('offerName');
        if (!percentage) missingFields.push('percentage');
        if (!createdBy) missingFields.push('createdBy');

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `The following fields are required: ${missingFields.join(', ')}`,
                missingFields,
            });
        }
        // Check if username already exists
        const existingOffer = await Offers.findOne({
            offerName: { $regex: new RegExp(`^${offerName}$`, 'i') }
        });
        if (existingOffer) {
            return res.status(400).json({
                status: 'error',
                message: 'This offer already exists',
            });
        }

        // Create a new offer
        const newOffer = new Offers({
            offerName, percentage, createdBy, endDate
        });
        await newOffer.save();

        return res.status(201).json({
            status: 'success',
            message: 'Offer created successfully',
        });

    } catch (error) {
        console.error('Error creating offer:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation Error: Please check your input.',
                status: 'fail',
                error: error.message
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later.',
        });
    }
};

const fetchOffers = async (req, res) => {
    try {
        const searchQuery = req.query.search;
        let offers;
        if (searchQuery && searchQuery.trim() !== "") {
            offers = await Offers.find({
                offerName: { $regex: searchQuery.trim(), $options: 'i' }
            });
        } else {
            offers = await Offers.find();
        }

        if (offers.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No offers found'
            });
        }
        return res.status(200).json({
            status: 'success',
            offers
        });

    } catch (error) {
        console.error('Error fetching offers:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later.'
        });
    }
};

const searchOffers = async (req, res) => {
    const { keyword, searchBy } = req.query;
    try {
        if (!keyword || keyword.trim() === '') {
            return res.status(200).json({ offers: [] });
        }
        const regex = new RegExp(keyword, 'i');
        const query = {};
        if (searchBy === 'offerName') {
            query.offerName = regex;
        } else {
            query.offerName = regex;
        }
        const offers = await Offers.find(query).sort({ createdAt: -1 });
        console.log(offers)
        res.status(200).json({ offers });
    } catch (error) {
        console.error('Error searching offers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const offerFindById = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offers.findById(id);
        if (!offer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Offer not found',
            });
        }
        return res.status(200).json({ status: 'success', offer,});

    } catch (error) {
        console.error('Error finding offer by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid offer ID format',
            });
        }
        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later.',
        });
    }
};

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offers.findById(id);
        if (!offer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Offer not found',
            });
        }
        await Offers.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'success',
            message: 'Offer deleted successfully',
        });

    } catch (error) {
        console.error('Error deleting offer:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later.',
        });
    }
};

const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { offerName, percentage, createdBy, endDate } = req.body;

        // Validate input fields
        const missingFields = [];
        if (!offerName) missingFields.push('offerName');
        if (!percentage) missingFields.push('percentage');
        if (!createdBy) missingFields.push('createdBy');

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `The following fields are required: ${missingFields.join(', ')}`,
                missingFields,
            });
        }

        // Find the existing offer by ID
        const existingOffer = await Offers.findById(id);
        if (!existingOffer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Offer not found',
            });
        }

        // Check if offerName is already taken by another offer
        const offerWithSameName = await Offers.findOne({
            offerName: { $regex: new RegExp(`^${offerName}$`, 'i') },
            _id: { $ne: id }
        });
        if (offerWithSameName && offerWithSameName._id.toString() !== id) {
            return res.status(400).json({
                status: 'fail',
                message: 'This offer name is already in use',
            });
        }

        // Update the offer
        existingOffer.offerName = offerName;
        existingOffer.percentage = percentage;
        existingOffer.createdBy = createdBy;
        existingOffer.endDate = endDate;

        await existingOffer.save();

        return res.status(200).json({
            status: 'success',
            message: 'Offer updated successfully',
            updatedOffer: existingOffer,
        });

    } catch (error) {
        console.error('Error updating offer:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                status: 'fail',
                message: 'Validation Error: Please check your input.',
                error: error.message,
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later.',
        });
    }
};

module.exports = { CreateOffer, fetchOffers, offerFindById, searchOffers, deleteOffer, updateOffer };
