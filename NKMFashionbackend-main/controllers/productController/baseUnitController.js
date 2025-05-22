const express = require('express');
const mongoose = require('mongoose')
const BaseUnit = require('../../models/products/productBaseUnits');

// Create a new base unit
const createBaseUnit = async (req, res) => {
    const { BaseUnitName, description } = req.body;
    if (!BaseUnitName) {
        return res.status(400).json({ message: 'Base Unit Name name is required' });
    }
    try {
        //  Case-insensitive check if base unit already exists
        const existingBaseUnit = await BaseUnit.findOne({
            BaseUnitName: { $regex: `^${BaseUnitName}$`, $options: 'i' }
        });
        if (existingBaseUnit) {
            return res.status(400).json({ message: 'This base unit alredy exists' });
        }

        const newBaseUnit = new BaseUnit({
            BaseUnitName,
            description
        });
    
    
        await newBaseUnit.save();
        res.status(201).json({ status: "Success", baseUnit: newBaseUnit });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message, message: 'Base Unit not added internal server error' });
        console.error("Base Unit not added", err);
    }

};

// Get base unit to update
const getBaseUnitForUpdate = async (req, res) => {
    const { id } = req.params;
    // Ensure the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ status: 'unsuccess', message: 'Invalid ID format' });
    }
    try {
        const BU = await BaseUnit.findOne({ _id: id });
        if (BU) {
            return res.status(200).json({ status: 'success', BU });
        } else {
            console.error('Base unit not found');
            return res.status(404).json({ status: 'unsuccess', message: 'Base unit not found' });
        }
    } catch (error) {
        console.error('Internal server error:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};;

// Update an existing base unit
const updateBaseUnit = async (req, res) => {
    const { id, BaseUnitName, description } = req.body;

    // Ensure that both ID, BaseUnitName, and description are provided
    if (!id || !BaseUnitName || !description) {
        return res.status(400).json({ status: 'unsuccess', message: 'ID, BaseUnitName, and description are required' });
    }

    try {

        // ✅ Check if the updated base unit name already exists (case-insensitive, exclude itself)
        const duplicateBaseUnit = await BaseUnit.findOne({
            BaseUnitName: { $regex: `^${BaseUnitName}$`, $options: 'i' },
            _id: { $ne: id } // exclude itself
        });

        if (duplicateBaseUnit) {
            return res.status(409).json({ status: "Conflict", message: "This base unit name already exists" });
        }

        // Find and update the base unit with the new values
        const updatedBaseUnit = await BaseUnit.findByIdAndUpdate(
            id, 
            { BaseUnitName, description }, // Update both BaseUnitName and description
            { new: true }
        );

        // If the base unit is not found, return an error
        if (!updatedBaseUnit) {
            return res.status(404).json({ status: "Not Found", message: "Base Unit not found" });
        }

        // Return the updated base unit
        res.json({ status: "success", baseUnit: updatedBaseUnit });
    } catch (err) {
        // Handle any errors during the update process
        res.status(400).json({ status: "Unsuccessful", error: err.message , message: 'Base Unit not updated internal server error' });
        console.error("Base Unit not updated", err);
    }
};

// Find base unit by keyword
const findBaseUnit = async (req, res) => {
    const { BaseUnitName } = req.body;
    try {
        const baseUnits = await BaseUnit.find({
            BaseUnitName: { $regex: new RegExp(BaseUnitName, 'i') }
        });
        res.json({ baseUnits });
    } catch (error) {
        console.error('Find base unit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Delete a base unit
const deleteBaseUnit = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBaseUnit = await BaseUnit.findByIdAndDelete(id);
        if (!deletedBaseUnit) {
            return res.status(404).json({ status: "Not Found", message: "Base Unit not found" });
        }
        res.json({ status: "Success", message: "Base Unit deleted" });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Base Unit not deleted", err);
    }
};

// Fetch all base units
const findAllBaseUnits = async (req, res) => {
    try {

        // if pagination and sorting parameters are provided
        const hasPaginationParams = req.query.page && req.query.page.size && req.query.page.number;
        const hasSortParam = req.query.sort;

        let baseUnits, totalItems, totalPages;

        if (hasPaginationParams || hasSortParam) {
            // Extracting pagination parameters if provided
            const size = parseInt(req.query.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query.page?.number) || 1; // Default page number is 1
            const offset = (number - 1) * size; // Calculate the offset for pagination

            // Get the total number of items (products)
            totalItems = await BaseUnit.countDocuments();

            // Calculate total pages
            totalPages = Math.ceil(totalItems / size);
    
            // Fetch paginated and sorted results
            baseUnits = await BaseUnit.find()
                .skip(offset)
                .limit(size);
        } else {
            // Fetch all base units without pagination or sorting
            baseUnits = await BaseUnit.find();
            totalItems = baseUnits.length;
            totalPages = 1; // All data on a single page
        }

        // Return the response with formatted data
        return res.status(200).json({
            status: 'Base units fetched successfully',
            baseUnits,
            totalItems,
            totalPages,
            currentPage: hasPaginationParams ? parseInt(req.query.page.number) || 1 : 1,
        });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Base Units not fetched", err);
    }
};

const fetchBaseUnits = async (req, res) => {
    const { id, BaseUnitName } = req.query; // Extract query parameter

    try {
        // Case 1: Fetch by ID for update
        if (id) {
            // Ensure the ID is a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ status: 'unsuccess', message: 'Invalid ID format' });
            }

            const BU = await BaseUnit.findById(id);
            if (!BU) {
                return res.status(404).json({ status: 'unsuccess', message: 'Base unit not found' });
            }

            return res.status(200).json({ status: 'success', BU });
        }

        // Case 2: Search by BaseUnitName
        if (BaseUnitName) {
            const baseUnits = await BaseUnit.find({
                BaseUnitName: {$regex: new RegExp(`${BaseUnitName}`, 'i')},
            });

            if (baseUnits.length === 0) {
                return res.status(404).json({ status: 'unsuccess', message: 'No base units found.' });
            }

            return res.status(200).json({ status: 'success', baseUnits });
        }

        // Case 3: Fetch all base units if no specific query parameters provided
        const baseUnits = await BaseUnit.find();
        if (baseUnits.length === 0) {
            return res.status(404).json({ status: 'unsuccess', message: 'No base units found.' });
        }

        return res.status(200).json({ status: 'success', baseUnits });
    } catch (error) {
        console.error('Error in fetchBaseUnits:', error.message || error);
        return res.status(500).json({ status: 'unsuccess', message: 'Internal server error', error });
    }
};

const searchBaseunits = async (req, res) => {
    const { BaseUnitName } = req.query;

    // Escape special regex characters
    const escapedBaseUnitName = BaseUnitName.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

    try {
        const baseUnits = await BaseUnit.find({
            BaseUnitName: { $regex: new RegExp(`${escapedBaseUnitName}`, 'i') },
        }).limit(20);  // Optional: Limit the number of results

        if (baseUnits.length === 0) {
            return res.status(404).json({ status: 'unsuccess', message: 'No base units found.' });
        }
        return res.status(200).json({ status: 'success', baseUnits });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};




module.exports = { createBaseUnit, updateBaseUnit, findAllBaseUnits, deleteBaseUnit, getBaseUnitForUpdate, findBaseUnit, fetchBaseUnits, searchBaseunits }