const variation = require('../../models/products/productVariation');
const ProductVariation = require('../../models/products/productVariation');

// Create a new product variation
const createProductVariation = async (req, res) => {
    const { variationName, variationType } = req.body;

    if (!variationName) {
        return res.status(400).json({ message: 'variation Name name is required' });
    }

    if (!variationType) {
        return res.status(400).json({ message: 'variation Type is required' });
    }

    try {
         //  Case-insensitive duplicate check
        const existingVariation = await ProductVariation.findOne({
            variationName: { $regex: `^${variationName}$`, $options: 'i' }
        });

        if (existingVariation) {
            return res.status(409).json({ message: 'This variation already exists' });
        }

        const newVariation = new ProductVariation({
            variationName,
            variationType
        });

    
        await newVariation.save();
        res.status(201).json({ status: "Success", variation: newVariation });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message, message: "Variation not added internal error" });
        console.error("Variation not added", err);
    }
};

// Search for product variations based on a keyword
const findVariation = async (req, res) => {
    const { variationName } = req.body;
    console.log(variationName)
    if (!variationName || typeof variationName !== 'string') {
        return res.status(400).json({ message: 'Invalid variationName' });
    }
    try {
        // Construct the regex pattern
        const pattern = {$regex: new RegExp(`${variationName}`, 'i')}; // 'i' for case-insensitive search

        // Query the database
        const variation = await ProductVariation.findOne({ variationName: pattern });

        if (!variation) {
            return res.status(404).json({ message: 'Variation not found' });
        }

        res.status(200).json({ variation });
    } catch (error) {
        console.error('Error finding variation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const searchVariations = async (req, res) => {
    const { variationName } = req.query;

    // Escape special regex characters
    const escapedVariationName = variationName.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

    try {
        const variation = await ProductVariation.find({
            variationName: { $regex: new RegExp(`${escapedVariationName}`, 'i') },
        }).limit(20);  // Optional: Limit the number of results

        if (!variation) {
            return res.status(404).json({ status: 'unsuccess', message: 'No variations found.' });
        }
        return res.status(200).json({ status: 'success', variation });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// Fetch data of a specific product variation for updating
const getVariationForUpdate = async (req, res) => {
    const { id } = req.params;
    try {
        const variation = await ProductVariation.findById(id);
        if (!variation) {
            return res.status(404).json({ status: "Not Found", message: "Variation not found" });
        }
        res.json({ status: "success", variation });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Variation not fetched", err);
    }
};

// Update an existing product variation
const updateProductVariation = async (req, res) => {
    const { id } = req.params;
    const { variationName, variationType } = req.body;
    if (!variationName || !variationType) {
        return res.status(400).json({ status: "Unsuccessful", message: "Variation name and type are required" });
    }
    try {
         //  Check for case-insensitive duplicate (excluding itself)
         const duplicateVariation = await ProductVariation.findOne({
            variationName: { $regex: `^${variationName}$`, $options: 'i' },
            _id: { $ne: id }
        });

        if (duplicateVariation) {
            return res.status(409).json({ status: "Conflict", message: "This variation name already exists" });
        }

        const updatedVariation = await ProductVariation.findByIdAndUpdate(id, { variationName, variationType }, { new: true });
        if (!updatedVariation) {
            return res.status(404).json({ status: "Not Found", message: "Variation not found" });
        }
        res.json({ status: "success", variation: updatedVariation });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message, message: "Variation not updated internal error" });
        console.error("Variation not updated", err);
    }
};


// Delete a product variation
const deleteProductVariation = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedVariation = await ProductVariation.findByIdAndDelete(id);
        if (!deletedVariation) {
            return res.status(404).json({ status: "Not Found", message: "Variation not found" });
        }
        res.json({ status: "Success", message: "Variation deleted" });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Variation not deleted,try again", err);
    }
};

// Fetch all product variations
const findAllProductVariations = async (req, res) => {
    try{
        // Check if pagination and sorting parameters are provided
        const hasPaginationParams = req.query.page && req.query.page.size && req.query.page.number;
        const hasSortParam = req.query.sort;

        let variations, totalItems, totalPages;

        if (hasPaginationParams || hasSortParam) {
            // Extract pagination parameters if provided
            const size = parseInt(req.query.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query.page?.number) || 1; // Default page number is 1
            const offset = (number - 1) * size; // Calculate the offset for pagination

            // Get the total number of items (products)
            totalItems = await ProductVariation.countDocuments();

            // Calculate total pages
            totalPages = Math.ceil(totalItems / size);

            // Fetch paginated and sorted results
            variations = await ProductVariation.find()
                .skip(offset)
                .limit(size);
        } else {
            // Fetch all product units without pagination or sorting
            variations = await ProductVariation.find();
            totalItems = variations.length;
            totalPages = 1; // All data on a single page
        }

        // Return the response with formatted data
        return res.status(200).json({
            status: 'Variations fetched successfully',
            variations,
            totalItems,
            totalPages,
            currentPage: hasPaginationParams ? parseInt(req.query.page.number) || 1 : 1,
        });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Variations not fetched", err);
    }
};

const fetchVariations = async (req, res) => {
    const { id, variationName } = req.query;

    try {
        // Fetch variation by ID
        if (id) {

            const variation = await ProductVariation.findById(id);
            if (!variation) {
                return res.status(404).json({ status: "Not Found", message: "Variation not found" });
            }

            return res.json({ status: "Success", variation });
        }

        // Search variation by name
        if (variationName) {

            if (typeof variationName !== 'string') {
                return res.status(400).json({ message: "Invalid variationName" });
            }

            const pattern = new RegExp(variationName, 'i'); // Case-insensitive regex
            const variation = await ProductVariation.findOne({ variationName: pattern });

            if (!variation) {
                return res.status(404).json({ message: "Variation not found" });
            }

            return res.json({ status: "Success", variation });
        }

        // Fetch all variations
        const variations = await ProductVariation.find();

        return res.json({ status: "Success", variations });
    } catch (err) {
        console.error("Error handling product variations:", err);
        res.status(500).json({ status: "Unsuccessful", error: err.message });
    }
};



module.exports={createProductVariation, updateProductVariation, deleteProductVariation,findVariation, findAllProductVariations,getVariationForUpdate, fetchVariations, searchVariations};
