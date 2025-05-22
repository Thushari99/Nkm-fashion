const Quatation = require('../../models/quatationModel')
const Product = require('../../models/products/product');
const mongoose = require('mongoose');

//Create a quotation
const createQuatation = async (req, res) => {
    try {
        const qatationData = req.body;
        const newQuatation = new Quatation(qatationData);
        const productsData = qatationData.productsData; // Extracting productsData from the sale data

        // Validate required fields
        if (!qatationData.warehouse) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }
        if (!qatationData.productsData) {
            return res.status(400).json({ message: 'productsData is required.', status: 'unsuccess' });
        }
        if (!qatationData.date) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }

        // Prepare update promises for product quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype } = product; // Extract details from product

            // Validate the current ID
            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                throw new Error(`Invalid product ID: ${currentID}`);
            }

            // Check for valid quantity
            if (typeof quantity !== 'number' || quantity < 0) {
                throw new Error(`Invalid Product Quantity for Product Id: ${currentID}`);
            }
        });

        // Wait for all updates to complete and handle any errors
        const results = await Promise.allSettled(updatePromises);

        // Check for any failed updates
        const failedUpdates = results.filter(result => result.status === 'rejected');
        if (failedUpdates.length > 0) {
            // Collect the error messages and return the first error encountered
            return res.status(400).json({
                message: failedUpdates[0].reason.message,
                status: 'unsuccess',
            });
        }

        // Save the quatation after successful updates
        await newQuatation.save();
        return res.status(201).json({ message: 'Quatation saved successfully!', sale: newQuatation });
    } catch (error) {
        console.error('Error saving quatation:', error);
        return res.status(400).json({ message: error.message, status: 'unsuccess' });
    }
};

// Delete a quotation
const DeleteQuatation = async (req, res) => {
    const { id } = req.params; // Get the sale ID from the request parameters

    // Check for valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Quatation ID format' });
    }

    try {
        const deletedQuatation = await Quatation.findByIdAndDelete(id); // Delete the sale by ID
        if (!deletedQuatation) {
            return res.status(404).json({ message: 'Quatation not found' }); // If no sale is found, send 404
        }
        res.status(200).json({ message: 'Quatation deleted successfully!', quatation: deletedQuatation }); // Send success response
    } catch (error) {
        console.error('Error deleting quatation:', error);

        // Check if it's a specific known error, e.g., CastError
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Quatation ID' });
        }

        res.status(500).json({ message: 'Server error occurred while deleting quatation' });
    }
};

//Find quatation by id
const findQuatationById = async (req, res) => {
    const { id } = req.params;

    // Validate the sale ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid sale ID format' });
    }

    try {
        // Find the sale by ID
        const quatation = await Quatation.findById(id);
        if (!quatation) {
            return res.status(404).json({ message: 'quatation not found' });
        }

        // Extract product IDs from the sale's productsData
        const productIds = quatation.productsData.map(product => product.currentID);

        // Fetch corresponding base products using product IDs
        const products = await Product.find({ _id: { $in: productIds } });

        // Map through the sale's productsData and attach the base product details (including stock quantities)
        const updatedProductsData = quatation.productsData.map(productData => {
            const baseProduct = products.find(p => p._id.toString() === productData.currentID);
            const warehouseKey = productData.warehouse;

            if (baseProduct) {
                let stockQty = "";

                // Check if the product has variations and find the correct variation stock
                const selectedWarehouse = baseProduct.warehouse.get(warehouseKey);
                console.log(`Warehouse data for product ${baseProduct._id}:`, baseProduct.warehouse);

                if (!selectedWarehouse) {
                    console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                    return {
                        ...productData,
                        stockQty: "N/A" 
                    };
                }

                // Check if the product has variations and find the correct variation stock
                if (productData.variationValue && selectedWarehouse.variationValues) {
                    const variation = selectedWarehouse.variationValues.get(productData.variationValue);
                    if (variation) {
                        stockQty = variation.productQty || ""; // Get stock quantity for this variation
                    } else {
                        console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                    }
                } else {
                    // For single products, directly assign stock quantity from base product
                    stockQty = selectedWarehouse.productQty || "";
                }

                // Return product data with the attached stock quantity
                return {
                    currentID: productData.currentID,
                    variationValue: productData.variationValue,
                    name: productData.name,
                    price: productData.price,
                    ptype: productData.ptype,
                    discount: productData.discount,
                    quantity: productData.quantity,
                    stockQty,
                    taxRate: productData.taxRate,
                    subtotal: productData.subtotal,
                    warehouse: productData.warehouse,
                    _id: productData._id
                };
            }

            // Return original product data if no base product found
            return productData;
        });

        // Combine sale with the updated product details
        const quatationWithUpdatedProducts = {
            ...quatation.toObject(), // Spread existing sale fields
            productsData: updatedProductsData // Attach updated products data
        };

        // Send the updated sale data
        res.status(200).json(quatationWithUpdatedProducts);

    } catch (error) {
        console.error('Error finding quatation by ID:', error);
        res.status(500).json({ message: 'Error fetching quatation by ID', error });
    }
};


// Update a quotation
const updateQuatation = async (req, res) => {
    try {
        const QuatationId = req.params.id;
        const updateData = req.body;

        // Validate QuatationId
        if (!QuatationId || !QuatationId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid Quatation ID' });
        }

        // Validate update data
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        // Fetch the existing Quatation document
        const existingQuatation = await Quatation.findById(QuatationId);
        if (!existingQuatation) {
            return res.status(404).json({ message: 'Quatation not found' });
        }

        // Preserve existing fields and update only specified ones
        const updatedFields = {
            ...existingQuatation.toObject(), // Spread existing Quatation fields
            ...updateData,                  // Overwrite with update data
            warehouse: existingQuatation.warehouse, // Preserve warehouse
            customer: existingQuatation.customer,   // Preserve customer
        };

        // Update the Quatation document
        const updatedQuatation = await Quatation.findByIdAndUpdate(
            QuatationId,
            updatedFields,
            { new: true, runValidators: true } // Return the updated document and validate
        );

        res.status(200).json({
            message: 'Quatation updated successfully',
            quatation: updatedQuatation,
        });
    } catch (error) {
        console.error('Error updating Quatation:', error);

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', error: error.message });
        } else if (error.name === 'MongoError') {
            return res.status(500).json({ message: 'Database error', error: error.message });
        }

        // Handle unexpected errors
        res.status(500).json({ message: 'Failed to update Quatation', error: 'Unexpected error occurred' });
    }
};

//Delete a product from quotation
const deleteProductFromQuatation = async (req, res) => {
    const { quatationID, productID, total } = req.query; // `productID` refers to `currentID` in `productsData`

    try {
        // Step 1: Find the Quatation by QuatationID
        const quatation = await Quatation.findById(quatationID);
        if (!quatation) {
            return res.status(404).json({ message: 'Quatation not found' });
        }

        // Step 2: Check if the product exists in the Quatation's productsData
        const productToDelete = quatation.productsData.find(product => product.currentID === productID);
        if (!productToDelete) {
            return res.status(404).json({ message: 'Product not found in Quatation' });
        }

        // Step 3: Calculate the new grandTotal after removing the product's subtotal
        const newGrandTotal = quatation.grandTotal - productToDelete.subtotal;

        // Step 4: Update the sale by pulling the product out of productsData and updating grandTotal
        const updatedQuatation = await Quatation.findByIdAndUpdate(
            quatationID,
            {
                $pull: { productsData: { currentID: productID } }, // Remove the product from the array
                grandTotal: newGrandTotal // Update the grandTotal
            },
            { new: true } // Return the updated document
        );

        // Step 5: Respond with success if the Quatation was updated
        if (updatedQuatation) {
            res.status(200).json({ message: "Product deleted successfully", quatation: updatedQuatation });
        } else {
            res.status(404).json({ message: "Quatation not found" });
        }
    } catch (error) {
        console.error("Error deleting product from Quatation:", error);
        res.status(500).json({ message: "An error occurred while deleting the product" });
    }
};

// Find quotation by ID or customer name and fetch all quotations combined function
const getQuatation = async (req, res) => {
    const { id, customerName } = req.query;

    try {
        if (id) {
            // Fetch quotation by ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid quotation ID format' });
            }

            const quatation = await Quatation.findById(id);
            if (!quatation) {
                return res.status(404).json({ message: 'Quotation not found' });
            }

            // Fetch base product details and attach stock quantities
            const productIds = quatation.productsData.map(product => product.currentID);
            const products = await Product.find({ _id: { $in: productIds } });

            const updatedProductsData = quatation.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                let stokeQty = "";

                if (baseProduct) {
                    if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
                        const variation = baseProduct.variationValues.get(productData.variationValue);
                        stokeQty = variation ? variation.productQty || "" : "";
                    } else {
                        stokeQty = baseProduct.productQty || "";
                    }
                }

                return {
                    ...productData,
                    stokeQty,
                };
            });

            const quatationWithUpdatedProducts = {
                ...quatation.toObject(),
                productsData: updatedProductsData,
            };

            return res.status(200).json(quatationWithUpdatedProducts);

        } else if (customerName) {
            // Fetch quotations by customer name
            if (customerName.length < 1) {
                return res.status(400).json({ message: 'Please provide at least one character.' });
            }

            const quatations = await Quatation.find({ customer: { $regex: `^${customerName}`, $options: 'i' } });
            if (quatations.length === 0) {
                return res.status(404).json({ message: 'No quotations found for this customer' });
            }

            return res.status(200).json(quatations);

        } else {
            // Fetch all quotations with or without pagination
            console.log('Received query parameters:', req.query);
            const size = parseInt(req.query?.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query?.page?.number) || 1; // Default page number is 1
            const offset = (number - 1) * size; // Calculate the offset for pagination

            if (req.query?.page) {
                const quatations = await Quatation.find()
    .sort({ createdAt: -1 }) // Sorting by createdAt in descending order
    .skip(offset)
    .limit(size);


                if (!quatations || quatations.length === 0) {
                    return res.status(404).json({ message: "No quotations found." });
                }

                const total = await Quatation.countDocuments();
                const totalPages = Math.ceil(total / size);

                return res.status(200).json({
                    message: 'Quotations fetched successfully with pagination',
                    data: quatations,
                    total,
                    totalPages,
                    currentPage: number,
                    pageSize: size
                });
            }

            const quatations = await Quatation.find();
            return res.status(200).json({
                message: 'Quotations fetched successfully',
                data: quatations
            });
        }
    } catch (error) {
        console.error('Error fetching quotation:', error);
        res.status(500).json({ message: 'Error fetching quotation', error });
    }
};

const searchQuotation = async (req, res) => {
    const { keyword } = req.query; // Extract the keyword from query parameters

    try {
        if (!keyword) {
            return res.status(400).json({
                status: "error",
                message: "Keyword is required for search."
            });
        }

        // Escape special regex characters in the keyword to prevent regex injection
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by warehouse or customer
        const query = {
            $or: [
                { warehouse: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search
                { customer: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }
            ]
        };

        // Fetch quotations based on the query
        const quotations = await Quatation.find(query).populate('productsData.currentID', 'productName productQty');

        if (!quotations || quotations.length === 0) {
            return res.status(404).json({
                status: "unsuccess",
                message: "No quotations found for the provided keyword."
            });
        }

        // Format quotation data if additional processing is needed
        const formattedQuotations = quotations.map((quotation) => {
            const quotationObj = quotation.toObject();

            return {
                _id: quotationObj._id,
                customer: quotationObj.customer,
                warehouse: quotationObj.warehouse,
                quotationDate: quotationObj.quotationDate, // Replace with the appropriate date field, if exists
                totalAmount: quotationObj.totalAmount,
                productsData: quotationObj.productsData, // Include product details
                status: quotationObj.status, // Example field, adjust based on your schema
                date: quotationObj.date,
                discount: quotationObj.discount,
                discountType: quotationObj.discountType,
                grandTotal: quotationObj.grandTotal,
                orderStatus: quotationObj.grandTotal,
                paidAmount: quotationObj.paidAmount,
                paymentStatus: quotationObj.paymentStatus,
                paymentType: quotationObj.paymentType,
                shipping: quotationObj.shipping,
                tax: quotationObj.tax,
                createdAt: quotationObj.createdAt
                    ? quotationObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({
            status: "success",
            quotations: formattedQuotations
        });
    } catch (error) {
        console.error("Search quotations error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};



module.exports = { createQuatation, getQuatation, DeleteQuatation, updateQuatation, deleteProductFromQuatation,findQuatationById, searchQuotation };