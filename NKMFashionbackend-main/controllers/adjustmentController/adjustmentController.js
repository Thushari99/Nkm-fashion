const Adjustment = require('../../models/adjustmentModel')
const Product = require('../../models/products/product');
const mongoose = require('mongoose');
const generateReferenceId = require('../../utils/generateReferenceID');

// CREATE ADJUSTMENT
const createAdjustment = async (req, res) => {
    try {
        const adjustmentData = req.body;

        // Generate a reference ID for the adjustment
        const referenceId = await generateReferenceId('ADJ');
        adjustmentData.refferenceId = referenceId;

        const newAdjustment = new Adjustment(adjustmentData);
        const productsData = adjustmentData.productsData;

        // Validation
        if (!adjustmentData.warehouse) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }
        if (!adjustmentData.refferenceId) {
            return res.status(400).json({ message: 'Reference ID is required.', status: 'unsuccess' });
        }
        if (!adjustmentData.date) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }
        if (!Array.isArray(productsData) || productsData.length === 0) {
            return res.status(400).json({ message: 'No products provided for adjustment.', status: 'unsuccess' });
        }

        // Update product quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype, AdjustmentType, variationValue } = product;

            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                throw new Error(`Invalid product ID: ${currentID}`);
            }

            // Fetch the product document
            const updatedProduct = await Product.findById(currentID);
            if (!updatedProduct) {
                throw new Error(`Product not found: ${currentID}`);
            }

            const numericQuantity = Number(quantity); 

            if (ptype === 'Single') {
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return res.status(400).json({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }
                const warehouseKey = adjustmentData.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return res.status(400).json({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                const currentQty = Number(SelectedWarehouse.productQty? SelectedWarehouse.productQty : 0);

                if (AdjustmentType === 'addition') {
                    SelectedWarehouse.productQty = currentQty + numericQuantity;
                } else if (AdjustmentType === 'subtraction') {
                    if (currentQty < numericQuantity) {
                        throw new Error(`Insufficient stock for Product ID: ${currentID}`);
                    }
                    SelectedWarehouse.productQty = currentQty - numericQuantity;
                }
                await updatedProduct.save();
                return updatedProduct;

            } else if (ptype === 'Variation') {
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return res.status(400).json({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }

                const warehouseKey = adjustmentData.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return res.status(400).json({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                const variationKey = product.variationValue;
                const variation = SelectedWarehouse.variationValues.get(variationKey);
                if (!variation) {
                    return res.status(400).json({ message: `Variation ${variationKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                const currentVariationQty = Number(variation.productQty ? variation.productQty : 0)
                if (AdjustmentType === 'addition') {
                    variation.productQty = currentVariationQty + numericQuantity;
                } else if (AdjustmentType === 'subtraction') {
                    if (currentVariationQty < numericQuantity) {
                        throw new Error(`Insufficient stock for Variation ${variationValue} of Product ID: ${currentID}`);
                    }
                    variation.productQty = currentVariationQty - numericQuantity;
                }

                updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                await updatedProduct.save();
                return updatedProduct; 
            }

            // Save the updated product
            await updatedProduct.save();
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);
        await newAdjustment.save();  


        res.status(201).json({ message: 'Adjustment saved successfully!', adjustment: newAdjustment });
    } catch (error) {
        console.error('Error saving adjustment:', error);
        res.status(500).json({ message: 'Error saving adjustment', error: error.message });
    } finally {
    }
};


// DELETE ADJUSTMENT
const deleteAdjustment = async (req, res) => {
    const { id } = req.params; // Get the sale ID from the request parameters
    try {
        const deletedAdjustment = await Adjustment.findByIdAndDelete(id);
        if (!deletedAdjustment) {
            return res.status(404).json({ message: 'Adjustment not found' });
        }
        res.status(200).json({ message: 'Adjustment deleted successfully!', adjustment: deletedAdjustment });
    } catch (error) {
        console.error('Error in deleteAdjustment:', error.message);
        res.status(500).json({ message: `Error deleting adjustment: ${error.message}` });
    }
};


//FIND ADJUSTMENT BY ID FOR UPDATE
const findAdjustmentByIdForUpdate = async (req, res) => {
    const { id } = req.params;

    // Validate the sale ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid sale ID format' });
    }
    try {
        // Find the sale by ID
        const sale = await Adjustment.findById(id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Extract product IDs from the sale's productsData
        const productIds = sale.productsData.map(product => product.currentID);

        // Fetch corresponding base products using product IDs
        const products = await Product.find({ _id: { $in: productIds } });

        // Map through the sale's productsData and attach the base product details
        const updatedProductsData = sale.productsData.map(productData => {
            const baseProduct = products.find(p => p._id.toString() === productData.currentID);
            const warehouseKey = sale.warehouse;
            if (baseProduct) {
                let stockQty = "";

                const selectedWarehouse = baseProduct.warehouse.get(warehouseKey);
                console.log(`Warehouse data for product ${baseProduct._id}:`, baseProduct.warehouse);

                if (!selectedWarehouse) {
                    console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                    return {
                        ...productData,
                        stockQty: "N/A"
                    };
                }

                if (productData.variationValue && selectedWarehouse.variationValues) {
                    const variation = selectedWarehouse.variationValues.get(productData.variationValue);
                    if (variation) {
                        stockQty = variation.productQty || "";
                    } else {
                        console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                    }
                } else {
                    stockQty = selectedWarehouse.productQty || "";
                }

                // Return product data with the attached stock quantity
                return {
                    currentID: productData.currentID,
                    variationValues: selectedWarehouse.variationValues,
                    selectedVariation: productData.variationValue,
                    AdjustmentType: productData.AdjustmentType,
                    name: productData.name,
                    productPrice: productData.price,
                    ptype: productData.ptype,
                    quantity: productData.quantity,
                    productQty: stockQty, // Attach stock quantity
                    oderTax: productData.taxRate,
                    subtotal: productData.subtotal,
                    _id: productData._id
                };
            }

            console.warn(`Base product with currentID ${productData.currentID} not found.`);
            // Return original product data if no base product found
            return productData;
        });

        // Combine sale with the updated product details
        const saleWithUpdatedProducts = {
            ...sale.toObject(), // Spread existing sale fields
            productsData: updatedProductsData // Attach updated products data
        };

        // Send the updated sale data
        res.status(200).json(saleWithUpdatedProducts);

    } catch (error) {
        console.error('Error finding sale by ID:', error);
        res.status(500).json({ message: 'Error fetching sale by ID', error });
    }
};

// Retry logic function
const retryOperation = async (operation, retries = 3) => {
    while (retries > 0) {
        try {
            return await operation();
        } catch (error) {
            if (error.code === 112) { // WriteConflict
                retries -= 1;
                console.warn('Retrying operation due to write conflict. Retries left:', retries);
                if (retries === 0) throw error;
            } else {
                throw error; // Other errors should not be retried
            }
        }
    }
};


const updateAdjustment = async (req, res) => {
    try {
        const adjustmentId = req.params.id;
        const updateData = req.body;

        // Validate AdjustmentType for each product
        for (const productData of updateData.productsData) {
            const { AdjustmentType } = productData;
            if (AdjustmentType !== 'addition' && AdjustmentType !== 'subtraction') {
                return res.status(400).json({ message: `Invalid AdjustmentType: ${AdjustmentType}. It must be either 'addition' or 'subtraction'.` });
            }
        }

        const filteredProducts = updateData.productsData.filter((product) => product.currentID);
        const productIds = filteredProducts.map((product) => product.currentID);

        await retryOperation(async (session) => {
            // Fetch the adjustment and products within the session
            const existingAdjustment = await Adjustment.findById(adjustmentId).session(session);
            if (!existingAdjustment) {
                throw new Error('Adjustment not found'); // ✅ Throw error instead of sending response
            }

            const products = await Product.find({ _id: { $in: productIds } }).session(session);

            let errors = []; // ✅ Store errors instead of sending responses inside the loop

            // Process products and update them
            for (const productData of filteredProducts) {
                const { currentID, quantity, ptype, AdjustmentType, variationValue } = productData;
                let product = products.find(p => p._id.toString() === currentID);

                if (!product) {
                    errors.push(`Product not found: ${currentID}`);
                    continue; // ✅ Skip this iteration instead of returning response
                }

                const numericQuantity = Number(quantity); // New adjustment quantity
                const previousAdjustment = existingAdjustment.productsData.find(
                    (p) => p.currentID === currentID
                );
                const previousQuantity = previousAdjustment ? Number(previousAdjustment.quantity) : 0;
                const quantityDifference = numericQuantity - previousQuantity;

                if (ptype === 'Single') {
                    const warehouseKey = updateData.warehouse;
                    const selectedWarehouse = product.warehouse.get(warehouseKey);

                    if (!selectedWarehouse) {
                        errors.push(`Warehouse ${warehouseKey} not found for product ID: ${currentID}`);
                        continue;
                    }

                    const currentQty = Number(selectedWarehouse.productQty || 0);

                    if (AdjustmentType === 'subtraction' && currentQty - quantityDifference < 0) {
                        errors.push(`Insufficient stock for Product ID: ${currentID}. Cannot have negative stock.`);
                        continue;
                    }

                    selectedWarehouse.productQty = AdjustmentType === 'addition' 
                        ? currentQty + quantityDifference 
                        : currentQty - quantityDifference;

                    product.markModified(`warehouse.${warehouseKey}`);
                } 
                
                else if (ptype === 'Variation') {
                    const warehouseKey = updateData.warehouse;
                    const selectedWarehouse = product.warehouse.get(warehouseKey);

                    if (!selectedWarehouse) {
                        errors.push(`Warehouse ${warehouseKey} not found for product ID: ${currentID}`);
                        continue;
                    }

                    const variationKey = variationValue;
                    const variation = selectedWarehouse.variationValues.get(variationKey);
                    if (!variation) {
                        errors.push(`Variation ${variationKey} not found for product ID: ${currentID}`);
                        continue;
                    }

                    const currentVariationQty = Number(variation.productQty || 0);
                    if (AdjustmentType === 'subtraction' && currentVariationQty - quantityDifference < 0) {
                        errors.push(`Insufficient stock for Variation ${variationValue} of Product ID: ${currentID}.`);
                        continue;
                    }

                    variation.productQty = AdjustmentType === 'addition'
                        ? currentVariationQty + quantityDifference
                        : currentVariationQty - quantityDifference;

                    product.markModified(`warehouse.${warehouseKey}.variationValues`);
                }

                await product.save({ session });
            }

            // If there are errors, throw them to be handled outside retryOperation
            if (errors.length > 0) {
                throw new Error(errors.join(' | ')); // ✅ Throw errors instead of sending response inside loop
            }

            // Now update the adjustment document with the new quantities
            existingAdjustment.productsData = updateData.productsData;
            existingAdjustment.updatedAt = new Date();

            await existingAdjustment.save({ session });
        });

        res.status(200).json({ message: 'Product quantities and adjustment updated successfully' });
    } catch (error) {
        console.error('Error updating adjustment:', error.message);
        res.status(500).json({ message: 'Failed to update adjustment', error: error.message });
    }
};


//DELETE PRODUCT FROM ADJUSTMENT
const deleteProductFromAdjustment = async (req, res) => {
    const { adjustmentID, productID } = req.query; // Use only relevant fields

    try {
        // Find the adjustment by ID
        const adjustment = await Adjustment.findById(adjustmentID);
        if (!adjustment) {
            return res.status(404).json({ message: 'Adjustment not found' });
        }

        // Check if `productsData` exists and find the product
        if (!adjustment.productsData || adjustment.productsData.length === 0) {
            return res.status(404).json({ message: 'No products found in adjustment' });
        }

        const productToDelete = adjustment.productsData.find(product => product.currentID === productID);
        if (!productToDelete) {
            return res.status(404).json({ message: 'Product not found in adjustment' });
        }

        // Calculate the new grandTotal
        const newGrandTotal = adjustment.grandTotal - productToDelete.subtotal;

        // Update the adjustment document
        const updatedAdjustment = await Adjustment.findByIdAndUpdate(
            adjustmentID,
            {
                $pull: { productsData: { currentID: productID } },
                $set: { grandTotal: newGrandTotal },
            },
            { new: true }
        );

        if (updatedAdjustment) {
            console.log('Updated Adjustment after product deletion:', updatedAdjustment);
            res.status(200).json({ message: "Product deleted successfully", adjustment: updatedAdjustment });
        } else {
            res.status(404).json({ message: "Adjustment not found" });
        }
    } catch (error) {
        console.error("Error deleting product from Adjustment:", error);
        res.status(500).json({ message: "An error occurred while deleting the product" });
    }
};

const fetchAdjustments = async (req, res) => {
    const { refferenceId, id } = req.query;
    try {
        // Fetch all adjustments with or without pagination
        if (!refferenceId && !id) {
            console.log('Received query parameters:', req.query);
            if (req.query.page) {
                const size = parseInt(req.query.page.size) || 10; // Default size is 10
                const number = parseInt(req.query.page.number) || 1; // Default page number is 1
                console.log(`Fetching adjustments with size: ${size} and page: ${number}`);
                const offset = (number - 1) * size; // Calculate the offset for pagination
                // const sort = req.query.sort || ''; // Handle sorting if provided

                const adjustments = await Adjustment.find()
                    .skip(offset)
                    .limit(size)
                    .sort({ createdAt: -1 })

                if (!adjustments || adjustments.length === 0) {
                    return res.status(404).json({ message: 'No adjustments found' });
                }

                const total = await Adjustment.countDocuments();
                const totalPages = Math.ceil(total / size);

                return res.status(200).json({
                    data: adjustments,
                    total,
                    totalPages,
                    currentPage: number,
                    pageSize: size
                });
            }

            // Fetch all adjustments without pagination
            const adjustments = await Adjustment.find();
            if (!adjustments || adjustments.length === 0) {
                return res.status(404).json({ message: 'No adjustments found' });
            }
            return res.status(200).json(adjustments);
        }

        // Fetch adjustments by reference ID
        if (refferenceId) {
            if (refferenceId.length < 1) {
                return res.status(400).json({ message: 'Please provide at least one character.' });
            }

            const adjustments = await Adjustment.find({
                refferenceId: { $regex: `^${refferenceId}`, $options: 'i' }
            });

            if (!adjustments || adjustments.length === 0) {
                return res.status(404).json({ message: 'No adjustments found for this reference ID.' });
            }
            return res.status(200).json(adjustments);
        }

        // Fetch adjustment by ID for update
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid adjustment ID format.' });
            }

            const adjustment = await Adjustment.findById(id);
            if (!adjustment) {
                return res.status(404).json({ message: 'Adjustment not found.' });
            }

            // Extract product IDs from the adjustment's `productsData`
            const productIds = adjustment.productsData.map(product => product.currentID);

            // Fetch corresponding base products using product IDs
            const products = await Product.find({ _id: { $in: productIds } });

            // Map and enrich `productsData` with stock quantity
            const updatedProductsData = adjustment.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);

                if (baseProduct) {
                    let stockQty = "";

                    // Handle product variations
                    if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
                        const variation = baseProduct.variationValues.get(productData.variationValue);
                        stockQty = variation ? variation.productQty || "" : "";
                    } else {
                        // Single product stock quantity
                        stockQty = baseProduct.productQty || "";
                    }

                    return {
                        ...productData,
                        stockQty, // Attach stock quantity
                    };
                }

                console.warn(`Base product with currentID ${productData.currentID} not found.`);
                return productData;
            });

            // Combine adjustment with updated product details
            const adjustmentWithUpdatedProducts = {
                ...adjustment.toObject(),
                productsData: updatedProductsData,
            };

            return res.status(200).json(adjustmentWithUpdatedProducts);
        }

        // Invalid query parameters
        return res.status(400).json({ message: 'Invalid query parameters.' });
    } catch (error) {
        console.error('Error handling adjustments:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};

const searchAdjustment = async (req, res) => {
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

        // Build query to search by referenceId or warehouse
        const query = {
            $or: [
                { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search by referenceId
                { warehouse: { $regex: new RegExp(`${escapedKeyword}`, 'i') } } // Case-insensitive search by warehouse
            ]
        };

        // Fetch adjustments based on the query
        const adjustments = await Adjustment.find(query).populate('productsData.currentID', 'productName productQty');

        if (!adjustments || adjustments.length === 0) {
            return res.status(404).json({
                status: "unsuccess",
                message: "No adjustments found for the provided keyword."
            });
        }

        // Format adjustment data if additional processing is needed
        const formattedAdjustments = adjustments.map((adjustment) => {
            const adjustmentObj = adjustment.toObject();

            return {
                _id: adjustmentObj._id,
                refferenceId: adjustmentObj.refferenceId,
                warehouse: adjustmentObj.warehouse,
                adjustmentDate: adjustmentObj.adjustmentDate, // Replace with the appropriate date field, if exists
                totalAmount: adjustmentObj.totalAmount,
                productsData: adjustmentObj.productsData, // Include product details
                status: adjustmentObj.status, // Example field, adjust based on your schema
                date: adjustmentObj.date,
                discount: adjustmentObj.discount,
                discountType: adjustmentObj.discountType,
                grandTotal: adjustmentObj.grandTotal,
                orderStatus: adjustmentObj.grandTotal,
                paidAmount: adjustmentObj.paidAmount,
                paymentStatus: adjustmentObj.paymentStatus,
                paymentType: adjustmentObj.paymentType,
                shipping: adjustmentObj.shipping,
                tax: adjustmentObj.tax,
                createdAt: adjustmentObj.createdAt
                    ? adjustmentObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({
            status: "success",
            adjustments: formattedAdjustments
        });
    } catch (error) {
        console.error("Search adjustments error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};




module.exports = { createAdjustment, deleteAdjustment, findAdjustmentByIdForUpdate, updateAdjustment, deleteProductFromAdjustment, fetchAdjustments, searchAdjustment }
