const express = require('express');
const Currency = require('../../models/currencyModel');

// Create a currency
const createCurrency = async (req, res) => {
    const { currencyName, currencyCode, currencySymbole } = req.body;
    // Validate required fields
    if (!currencyName) {
        return res.status(400).json({ message: 'Currency name is required.', status: 'unsuccess' });
    }
    if (!currencyCode) {
        return res.status(400).json({ message: 'Currency code is required.', status: 'unsuccess' });
    }
    try {
        // Check if the currency name already exists
        const existingCurrency = await Currency.findOne({ currencyCode: { $regex: new RegExp(`^${currencyCode}$`, 'i') } });
        if (existingCurrency) {
            return res.status(400).json({ message: 'Currency Code already exists.', status: 'unsuccess'});
        }        
        const newCurrency = new Currency({
            currencyName,
            currencyCode,
            currencySymbole,
        });
        await newCurrency.save();
        res.status(201).json({ message: 'Currency created successfully', data: newCurrency });
    } catch (error) {
        // Log error for debugging
        console.error("Error creating currency:", error);

        // Return a more generic error message for unexpected issues
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};


//Delete a currency
const deleteCurrency = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Not found ID in your Request.', status: 'unsuccess' });
    }
    try {
        const deletedCurrency = await Currency.findByIdAndDelete(id);
        if (!deletedCurrency) {
            return res.status(404).json({ message: 'Currency not found' });
        }
        res.status(200).json({ message: 'Currency deleted successfully', data: deletedCurrency ,status: 'success'});
    } catch (error) {
        // Log error for debugging
        console.error("Error deleting currency:", error);

        // Return a more generic error message for unexpected issues
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

// Update a currency
const updateCurrency = async (req, res) => {
    const { id } = req.params; // Extract currency ID from the URL parameters
    const { editcurrencyName, editcurrencyCode, editcurrencySymbole } = req.body; // Extract updated data from the request body
    const currencyName = editcurrencyName;
    const currencyCode = editcurrencyCode
    const currencySymbole = editcurrencySymbole

    if (!id) {
        return res.status(400).json({ message: 'Not found ID in your Request.', status: 'unsuccess' });
    }
    if (!currencyName) {
        return res.status(400).json({ message: 'Currency name is required.', status: 'unsuccess' });
    }
    if (!currencyCode) {
        return res.status(400).json({ message: 'Currency code is required.', status: 'unsuccess' });
    }

    try {
        // Check if the currency code already exists for another currency
        const existingCurrency = await Currency.findOne({ 
            currencyCode, 
            _id: { $ne: id } // Exclude the current currency being updated
        });

        if (existingCurrency) {
            return res.status(400).json({ message: 'Currency code already exists.', status: 'unsuccess' });
        }
        // Find the currency by ID and update it
        const updatedCurrency = await Currency.findByIdAndUpdate(
            id,
            { currencyName, currencyCode, currencySymbole }, // Updated fields
            { new: true, runValidators: true } // Options: return the updated document and run validation
        );

        // Check if the currency was found and updated
        if (!updatedCurrency) {
            return res.status(404).json({ message: 'Currency not found' });
        }

        // Respond with the updated currency data
        res.status(200).json({ message: 'Currency updated successfully', data: updatedCurrency });
    } catch (error) {
        // Log error for debugging
        console.error("Errorupdating currency:", error);

        // Return a more generic error message for unexpected issues
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};


//getAllCurrencies, ,findCurrencyByName,findCurrencyById combined function
const fetchCurrencies = async (req, res) => {
    const { id, currencyName } = req.query;

    try {
        let query = {};

        // Check if an ID is provided, to fetch currency by ID
        if (id) {
            const currency = await Currency.findById(id);
            if (!currency) {
                return res.status(404).json({ message: 'Currency not found' });
            }
            return res.status(200).json({ data: currency });
        }

        // Check if a currencyName is provided, to search by currency name
        if (currencyName) {
            query.currencyName = { $regex: new RegExp(currencyName, 'i') };
        }
        if (req.query.page) {
            const size = parseInt(req.query.page.size) || 10; // Default size is 10
            const number = parseInt(req.query.page.number) || 1; // Default page number is 1
            const offset = (number - 1) * size; // Calculate the offset for pagination

            const currencies = await Currency.find(query)
                .skip(offset)
                .limit(size)

            if (!currencies || currencies.length === 0) {
                return res.status(404).json({ message: 'No currencies found' });
            }

            const total = await Currency.countDocuments();
            const totalPages = Math.ceil(total / size);

            return res.status(200).json({ 
                data: currencies,
                total,
                totalPages,
                currentPage: number,
                pageSize: size
            });
        }

        // Fetch all currencies without pagination
        const currencies = await Currency.find(query);
        if (!currencies || currencies.length === 0) {
            return res.status(404).json({ message: 'No currencies found' });
        }

        res.status(200).json({ data: currencies });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const searchCurrency = async (req, res) => {
    const { keyword } = req.query;

    try {
        if (!keyword) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Keyword is required for searching currencies.' 
            });
        }

        // Escape special regex characters in the keyword to prevent regex injection
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build a query to search by currencyName or currencyCode
        const query = {
            $or: [
                { currencyName: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive match
                { currencyCode: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }
            ]
        };

        // Fetch currencies based on the query
        const currencies = await Currency.find(query).limit(20); // Optional: Limit the number of results

        if (!currencies || currencies.length === 0) {
            return res.status(404).json({ 
                status: 'unsuccess', 
                message: 'No currencies found for the provided keyword.' 
            });
        }

        return res.status(200).json({ 
            status: 'success', 
            currencies 
        });
    } catch (error) {
        console.error('Error searching currencies:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Server error while searching currencies.', 
            error: error.message 
        });
    }
};



module.exports = { createCurrency, deleteCurrency, updateCurrency, fetchCurrencies, searchCurrency };