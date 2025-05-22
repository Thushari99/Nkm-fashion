const ProductUnit = require('../../models/products/productUnits');
const mongoose = require('mongoose')
// Create a new product unit
const createProductUnit = async (req, res) => {
    const { unitName, shortName, baseUnit } = req.body;
    if (!unitName) {
        return res.status(400).json({ message: 'Unit Name is required' });
    }
    if (!baseUnit) {
        return res.status(400).json({ message: 'Base Unit is required' });
    }
    try {
    //  Case-insensitive duplicate check
    const existingUnit = await ProductUnit.findOne({
        unitName: { $regex: `^${unitName}$`, $options: 'i' }
    });

    if (existingUnit) {
        return res.status(409).json({ message: 'This unit already exists' });
    }

    const newUnit = new ProductUnit({
        unitName,
        shortName,
        baseUnit
    });
    
        await newUnit.save();
        res.status(201).json({ status: "Success", unit: newUnit });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message, message: "Unit not added internal server error" });
        console.error("Unit not added", err);
    }
};

// Fetch a specific product unit for update
const getUnitForUpdate = async (req, res) => {
    const { id } = req.params;
    console.log('Received ID:', id); // Debug log

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid ObjectId format:', id); // Debug log
        return res.status(400).json({ status: "Bad Request", message: "Invalid ID format" });
    }

    try {
        const unit = await ProductUnit.findById(id);
        console.log('Fetched unit:', unit); // Debug log
        if (!unit) {
            return res.status(404).json({ status: "Not Found", message: "Unit not found" });
        }
        res.json({ status: "Success", unit });
    } catch (err) {
        console.error("Unit not fetched", err);
        res.status(400).json({ status: "Unsuccessful", error: err.message });
    }
};

// Find base unit by keyword
const findUnit = async (req, res) => {
    const { unitName } = req.body;
    console.log("Received UnitName:", unitName);

    if (!unitName || typeof unitName !== 'string') {
        return res.status(400).json({ message: 'Invalid unitName' });
    }
    try {
        const regex = new RegExp(`${unitName}`, 'i');
        console.log("Regex used for search:", regex);

        const Units = await ProductUnit.find({
            unitName: { $regex: regex }
        });
        console.log("Found Units:", Units);
        res.json({ Units });
    } catch (error) {
        console.error('Find base unit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing product unit
const updateProductUnit = async (req, res) => {
    const { id } = req.params;
    const { unitName, shortName, baseUnit } = req.body;

    if (!unitName || !baseUnit) {
        return res.status(400).json({ status: "Unsuccessful", message: "Unit Name and Base Unit are required" });
    }

    try {

         // ✅ Check for case-insensitive duplicate (exclude itself)
         const duplicateUnit = await ProductUnit.findOne({
            unitName: { $regex: `^${unitName}$`, $options: 'i' },
            _id: { $ne: id }
        });

        if (duplicateUnit) {
            return res.status(409).json({ status: "Conflict", message: "This unit name already exists" });
        }

        const updatedUnit = await ProductUnit.findByIdAndUpdate(id, { unitName, shortName, baseUnit }, { new: true });
        if (!updatedUnit) {
            return res.status(404).json({ status: "Not Found", message: "Unit not found" });
        }
        res.json({ status: "success", unit: updatedUnit });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message  , message: "Unit not updated internal server error"});
        console.error("Unit not updated", err);
    }
};

// Delete a product unit
const deleteProductUnit = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUnit = await ProductUnit.findByIdAndDelete(id);
        if (!deletedUnit) {
            return res.status(404).json({ status: "Not Found", message: "Brand not found" });
        }
        res.json({ status: "Success", message: "Unit deleted" });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Unit not deleted", err);
    }
};

// Fetch all product unit
const findAllProductUnit = async (req, res) => {
    try {

        // Check if pagination and sorting parameters are provided
        const hasPaginationParams = req.query.page && req.query.page.size && req.query.page.number;
        const hasSortParam = req.query.sort;

        let units, totalItems, totalPages;

        if (hasPaginationParams || hasSortParam) {
            // Extract pagination parameters if provided
            const size = parseInt(req.query.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query.page?.number) || 1; // Default page number is 1
            const offset = (number - 1) * size; // Calculate the offset for pagination
        
            // Get the total number of items (products)
            totalItems = await ProductUnit.countDocuments();

            // Calculate total pages
            totalPages = Math.ceil(totalItems / size);

            // Fetch paginated and sorted results
            units = await ProductUnit.find()
                .skip(offset)
                .limit(size);
        } else {
            // Fetch all product units without pagination or sorting
            units = await ProductUnit.find();
            totalItems = units.length;
            totalPages = 1; // All data on a single page
        }

        // Return the response with formatted data
        return res.status(200).json({
            status: 'Units fetched successfully',
            units,
            totalItems,
            totalPages,
            currentPage: hasPaginationParams ? parseInt(req.query.page.number) || 1 : 1,
        });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Units not fetched", err);
    }
};


//newly added combined function

const fetchUnits = async (req, res) => {
    const { id, unitName } = req.query;

    try {
        // Fetch by ID
        if (id) {
            console.log('Received ID:', id);

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.log('Invalid ObjectId format:', id);
                return res.status(400).json({ status: "Bad Request", message: "Invalid ID format" });
            }

            const unit = await ProductUnit.findById(id);
            console.log('Fetched unit:', unit);

            if (!unit) {
                return res.status(404).json({ status: "Not Found", message: "Unit not found" });
            }

            return res.json({ status: "Success", unit });
        }

        // Search by unitName
        if (unitName) {
            console.log("Received UnitName:", unitName);

            if (typeof unitName !== 'string') {
                return res.status(400).json({ message: 'Invalid unitName' });
            }

            const regex = new RegExp(unitName, 'i');
            console.log("Regex used for search:", regex);

            const units = await ProductUnit.find({
                unitName: { $regex: regex },
            });
            console.log("Found Units:", units);

            return res.json({ status: "Success", units });
        }

        // Fetch all units
        const units = await ProductUnit.find();
        console.log("Fetched all units:", units);
        res.json({ status: "Success", units });
    } catch (err) {
        console.error('Error handling product units:', err);
        res.status(500).json({ status: "Unsuccessful", error: err.message });
    }
};

const searchUnits = async (req, res) => {
    const { unitName } = req.query;

    // Escape special regex characters
    const escapedUnitName = unitName.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

    try {
        const units = await ProductUnit.find({
            unitName: { $regex: new RegExp(`${escapedUnitName}`, 'i') },
        }).limit(20);  // Optional: Limit the number of results

        if (units.length === 0) {
            return res.status(404).json({ status: 'unsuccess', message: 'No units found.' });
        }
        return res.status(200).json({ status: 'success', units });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};




module.exports = {createProductUnit,updateProductUnit,deleteProductUnit,findAllProductUnit, getUnitForUpdate, findUnit, fetchUnits, searchUnits};
