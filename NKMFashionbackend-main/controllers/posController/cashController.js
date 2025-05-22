const Cash = require('../../models/posModel/cashModel');

// CREATING REGISTRY
const cashHandIn = async (req, res) => {
    const { cashAmount, username, name, openTime,
        oneRupee, twoRupee, fiveRupee, tenRupee, twentyRupee, fiftyRupee, hundredRupee, fiveHundredRupee, thousandRupee, fiveThousandRupee } = req.body;

    // Validate input data
    if (!cashAmount || !username || !name || !openTime) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing required fields: cashAmount, username, name, openTime'
        });
    }
    if (cashAmount <= 500) {
        return res.status(400).json({
            status: 'fail',
            message: 'Cash amount must be more than 500.'
        });
    }

    else {
        try {
            // Check if the username already exists
            const existingUser = await Cash.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Username already exists. Please use a different username.'
                });
            }
            else {
                const currentCash = await Cash.findOne();

                if (currentCash) {
                    currentCash.totalBalance += cashAmount;
                    currentCash.cashHandIn = cashAmount; // Keep track of the total cash added
                    await currentCash.save();
                    return res.status(200).json({
                        status: 'success',
                        message: 'Cash updated successfully',
                        cash: currentCash
                    });
                } else {
                    const newCash = new Cash({
                        username,
                        name,
                        openTime,
                        cashHandIn: cashAmount,
                        totalBalance: cashAmount,
                        oneRupee, twoRupee, fiveRupee, tenRupee, twentyRupee, fiftyRupee, hundredRupee, fiveHundredRupee, thousandRupee, fiveThousandRupee
                    });
                    await newCash.save();
                    return res.status(201).json({
                        status: 'success',
                        message: 'New cash record created successfully',
                        cash: newCash
                    });
                }
            }

        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error while updating cash.',
                error: error.message
            });
        }

    }
};

// CLOSING REGISTRY
const closeRegister = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            status: 'fail',
            message: 'ID is required'
        });
    }

    try {
        const deletedRegister = await Cash.findByIdAndDelete(id);
        if (!deletedRegister) {
            return res.status(404).json({
                status: 'fail',
                message: 'Registry not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Registry deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting cash.',
            error: error.message
        });
    }
};

const getCashRegister = async (req, res) => {
    const { id } = req.query;
    try {
        let cashRegister;

        if (id) {
            cashRegister = await Cash.findById(id);
        } else {
            cashRegister = await Cash.find();
        }

        if (!cashRegister || (Array.isArray(cashRegister) && cashRegister.length === 0)) {
            return res.status(404).json({
                status: 'fail',
                message: 'No cash registers found'
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Cash register(s) retrieved successfully',
            data: cashRegister
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while retrieving cash registers',
            error: error.message
        });
    }
};

module.exports = { cashHandIn, closeRegister, getCashRegister };