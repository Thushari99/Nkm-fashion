const Sale = require('../../models/saleModel')
const SalePayment = require('../../models/salePaymentModel')
const Product = require('../../models/products/product');
const SaleReturn = require('../../models/saleReturnModel')
const posController = require('../posController/posController')
const mongoose = require('mongoose');
const generateReferenceId = require('../../utils/generateReferenceID');

// Return a sale
const returnSale = async (req, res) => {
    try {
        const returnData = req.body;
        // Validate return data before saving
        if (!returnData || !returnData.productsData || returnData.productsData.length === 0) {
            return res.status(400).json({ message: 'Invalid data: Missing product information.' });
        }
        if (!returnData.note) {
            return res.status(400).json({ message: 'Invalid data: Missing Note' });
        }
        if (!returnData.warehouse) {
            return res.status(400).json({ message: 'Invalid data: Missing warehouse' });
        }
        if (!returnData.customer) {
            return res.status(400).json({ message: 'Invalid data: Missing customer' });
        }
        const refferenceId = await generateReferenceId('SALE_RETURN');
        returnData.refferenceId = refferenceId;

        returnData.productsData = returnData.productsData.map(product => ({
            ...product,
            warehouse: product.warehouse || null
        }));

        const updatePromises = returnData.productsData.map(async (product) => {
            const { currentID, returnQty, ptype, variationValue, restocking } = product; // Extract details from product

            if (restocking) {
                // Validate the current ID
                if (!mongoose.Types.ObjectId.isValid(currentID)) {
                    return Promise.reject({ message: `Invalid product ID: ${currentID}`, status: 'unsuccess' });
                }
                // Update logic based on product type
                if (ptype === 'Single') {
                    const updatedProduct = await Product.findById(currentID);
                    if (!updatedProduct) {
                        return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                    }

                    const warehouseKey = product.warehouse;
                    const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                    if (!selectedWarehouse) {
                        return Promise.reject({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                    }

                    // Add the stock quantity to reverse the sale return
                    selectedWarehouse.productQty += returnQty; // Add the quantity that was returned
                    await updatedProduct.save(); // Save the changes to the product
                    return updatedProduct; // Return updated single product
                } else if (ptype === 'Variation') {
                    const updatedProduct = await Product.findById(currentID);
                    if (!updatedProduct) {
                        return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                    }

                    const warehouseKey = product.warehouse;
                    const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                    if (!selectedWarehouse) {
                        return Promise.reject({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                    }

                    const variation = selectedWarehouse.variationValues.get(variationValue);

                    if (!variation) {
                        return Promise.reject({ message: `Variation ${variationValue} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                    }

                    // Add the quantity of the variation to reverse the sale return
                    variation.productQty += returnQty; // Add the quantity that was returned
                    updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                    await updatedProduct.save(); // Save the changes made to the variations
                    return updatedProduct; // Return updated variation product
                } else {
                    return Promise.reject({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
                }
            }
        });

        await Sale.findOneAndUpdate(
            { _id: returnData.id }, // Find sale by reference ID
            { $set: { returnStatus: true } }, // Update returnStatus to true
            { new: true } // Use session for transaction and return updated sale
        );
        
        await Promise.all(updatePromises);
        const newSaleReturn = new SaleReturn(returnData);
        const savedReturn = await newSaleReturn.save();
        res.status(201).json({
            message: 'Sale return saved successfully',
            saleReturn: savedReturn
        });
    } catch (error) {
        console.error('Error saving sale return:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error during sale return creation.', error: error.message });
        }
        res.status(500).json({ message: 'Failed to save sale return', error: error.message });
    }
};


// Delete a sale return
const deleteSaleReturn = async (req, res) => {
    try {
        const saleReturnId = req.params.id;
        // Check for valid ID format
        if (!mongoose.Types.ObjectId.isValid(saleReturnId)) {
            return res.status(400).json({ message: 'Invalid sale return ID format' });
        }
        const deletedSaleReturn = await SaleReturn.findByIdAndDelete(saleReturnId);
        if (!deletedSaleReturn) {
            return res.status(404).json({
                message: 'Sale return not found',
            });
        }
        res.status(200).json({
            message: 'Sale return deleted successfully',
            saleReturn: deletedSaleReturn,
        });
    } catch (error) {
        console.error('Error deleting sale return:', error);
        res.status(500).json({ message: 'Failed to delete sale return', error });
    }
};

//Find a sale return by ID
const findSaleReturnById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'sale ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid sale return ID format' });
    }
    try {
        // Find the sale return by ID
        const saleReturn = await SaleReturn.findById(id);

        if (!saleReturn) {
            return res.status(404).json({ message: 'Sale return not found' });
        }

        // Extract product IDs from sale return
        const productIds = saleReturn.productsData.map(product => product.currentID);

        // Find base products using the extracted product IDs
        const products = await Product.find({ _id: { $in: productIds } });

        // Create a new array for updated product data
        const updatedProductsData = saleReturn.productsData.map(productData => {
            // Find the corresponding base product using currentID
            const baseProduct = products.find(p => p._id.toString() === productData.currentID);

            if (baseProduct) {
                let stokeQty = "";

                // Check if the product has variations and find the correct variation stock
                if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
                    // Find the correct variation
                    const variation = baseProduct.variationValues.get(productData.variationValue);

                    if (variation) {
                        stokeQty = variation.productQty || ""; // Get stock quantity for this variation
                    }
                } else {
                    // For single products, directly assign stock quantity from base product
                    stokeQty = baseProduct.productQty || "";
                }
                // Return updated product data with stock quantity
                return {
                    currentID: productData.currentID,
                    variationValue: productData.variationValue,
                    name: productData.name,
                    price: productData.price,
                    ptype: productData.ptype,
                    quantity: productData.quantity,
                    stokeQty, // Add stock quantity here
                    taxRate: productData.taxRate,
                    discount: productData.discount,
                    subtotal: productData.subtotal,
                    _id: productData._id
                };
            }

            // Return the original product data if no base product is found
            return {
                currentID: productData.currentID,
                variationValue: productData.variationValue,
                name: productData.name,
                price: productData.price,
                quantity: productData.quantity,
                discount: productData.discount,
                taxRate: productData.taxRate,
                subtotal: productData.subtotal,
                _id: productData._id
            };
        });

        // Combine sale return with the updated product data
        const saleReturnWithUpdatedProducts = {
            _id: saleReturn._id,
            date: saleReturn.date,
            customer: saleReturn.customer,
            warehouse: saleReturn.warehouse,
            grandTotal: saleReturn.grandTotal,
            paidAmount: saleReturn.paidAmount,
            returnAmount: saleReturn.returnAmount,
            productsData: updatedProductsData // Attach updated products data
        };

        // Send the updated sale return object as response
        res.status(200).json(saleReturnWithUpdatedProducts);

    } catch (error) {
        console.error('Error finding sale return by ID:', error);
        res.status(500).json({ message: 'Error fetching sale return by ID', error });
    }
};

// Update a sale return
const updateReturnSale = async (req, res) => {
    try {
        const saleReturnId = req.params.id; // Get the sale return ID from the request parameters
        const updateData = req.body; // Get the new data for updating from the request body

        // Fetch the existing sale return document
        const existingSaleReturn = await SaleReturn.findById(saleReturnId);

        if (!existingSaleReturn) {
            return res.status(404).json({
                message: 'Sale return not found',
            });
        }

        // Only update the fields that are sent from the frontend
        const updatedFields = {
            ...updateData, // Spread the incoming update data
            warehouse: existingSaleReturn.warehouse, // Preserve the existing warehouse value
            customer: existingSaleReturn.customer,
            // Preserve the existing customer value
        };

        // Find the sale return by ID and update it with the new data
        const updatedSaleReturn = await SaleReturn.findByIdAndUpdate(
            saleReturnId,
            updatedFields,
            { new: true, runValidators: true } // Return the updated document and validate
        );

        res.status(200).json({
            message: 'Sale return updated successfully',
            saleReturn: updatedSaleReturn,
        });
    } catch (error) {
        console.error('Error updating sale return:', error);
        res.status(500).json({ message: 'Failed to update sale return', error });
    }
};

// Remove a product from sale return
const removeProductFromSaleReturn = async (req, res) => {
    const { id, currentID } = req.body; // Extract saleReturn id and product's currentID from the request body
    if (!id || !currentID) {
        return res.status(400).json({ message: 'Both sale return ID and product currentID are required' });
    }

    try {
        // Find the sale return by ID
        const saleReturn = await SaleReturn.findById(id);

        if (!saleReturn) {
            return res.status(404).json({ message: 'Sale return not found' });
        }

        // Find the index of the product to be removed based on currentID
        const productIndex = saleReturn.productsData.findIndex(
            product => product.currentID === currentID
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in sale return' });
        }

        // Remove the product from the productsData array
        saleReturn.productsData.splice(productIndex, 1);

        // Save the updated sale return document
        await saleReturn.save();

        res.status(200).json({
            message: 'Product removed successfully from sale return',
            updatedSaleReturn: saleReturn,
        });
    } catch (error) {
        console.error('Error removing product from sale return:', error);
        res.status(500).json({
            message: 'Failed to remove product from sale return',
            error: error.message,
        });
    }
};


// Backend Controller to Fetch Sale Returns
const fetchSaleReturns = async (req, res) => {
    const { id, keyword } = req.query;

    try {
        let saleReturns;

        // Fetch by ID if 'id' is provided in query
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid sale return ID format' });
            }

            const saleReturn = await SaleReturn.findById(id);
            if (!saleReturn) {
                return res.status(404).json({ message: 'Sale return not found' });
            }

            // Extract product IDs and fetch products
            const productIds = saleReturn.productsData.map(product => product.currentID);
            const products = await Product.find({ _id: { $in: productIds } });

            // Update product data with stock quantities
            const updatedProductsData = saleReturn.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                let stockQty = "";

                if (baseProduct) {
                    if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
                        const variation = baseProduct.variationValues.get(productData.variationValue);
                        stockQty = variation ? variation.productQty || "" : "";
                    } else {
                        stockQty = baseProduct.productQty || "";
                    }
                }

                return {
                    ...productData,
                    stockQty
                };
            });

            const saleReturnWithUpdatedProducts = {
                ...saleReturn.toObject(),
                productsData: updatedProductsData
            };

            return res.status(200).json(saleReturnWithUpdatedProducts);
        }

        // Fetch by keyword (matches customer name or other criteria)
        if (keyword) {
            if (keyword.length < 1) {
                return res.status(400).json({ message: 'Please provide a valid keyword.' });
            }

            saleReturns = await SaleReturn.find({
                $or: [
                    { customer: { $regex: new RegExp(keyword, 'i') } },
                    { refferenceId: { $regex: new RegExp(keyword, 'i') } }
                ]
            });

            if (!saleReturns || saleReturns.length === 0) {
                return res.status(404).json({ message: 'No sale returns found matching the provided keyword.' });
            }

            return res.status(200).json(saleReturns);
        }
        const size = parseInt(req.query?.page?.size) || 10; // Default size is 10
        const number = parseInt(req.query?.page?.number) || 1; // Default page number is 1
        const offset = (number - 1) * size; // Calculate the offset for pagination

        if (req.query?.page) {
            saleReturns = await SaleReturn.find()
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(size);

            if (!saleReturns || saleReturns.length === 0) {
                return res.status(404).json({ message: 'No sale returns found.' });
            }

            const total = await SaleReturn.countDocuments();
            const totalPages = Math.ceil(total / size);

            return res.status(200).json({
                message: 'Sale returns fetched successfully with pagination',
                data: saleReturns,
                total,
                totalPages,
                currentPage: number,
                pageSize: size
            });
        }

        // Fetch all without pagination if no pagination queries are provided
        saleReturns = await SaleReturn.find();
        if (!saleReturns || saleReturns.length === 0) {
            return res.status(404).json({ message: 'No sale returns found.' });
        }

        res.status(200).json({
            message: 'Sale returns fetched successfully',
            saleReturns
        });

    } catch (error) {
        console.error('Error fetching sale returns:', error);
        res.status(500).json({ message: 'Error fetching sale returns', error: error.message });
    }
};

const searchSaleReturns = async (req, res) => {
    const { keyword } = req.query; // Get keyword from query params

    try {
        if (!keyword) {
            return res.status(400).json({
                status: "error",
                message: "Keyword is required for search."
            });
        }

        // Escape special regex characters in the keyword to prevent regex injection
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by customer or refferenceId
        const query = {
            $or: [
                { customer: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search
                { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }
            ]
        };

        // Fetch sale returns based on the query
        const saleReturns = await SaleReturn.find(query).populate('productsData.currentID', 'productName productQty');

        if (!saleReturns || saleReturns.length === 0) {
            return res.status(404).json({
                status: "unsuccess",
                message: "No sale returns found for the provided keyword."
            });
        }

        // Format sale returns data if additional processing is needed
        const formattedSaleReturns = saleReturns.map((saleReturn) => {
            const saleReturnObj = saleReturn.toObject();

            return {
                _id: saleReturnObj._id,
                refferenceId: saleReturnObj.refferenceId,
                customer: saleReturnObj.customer,
                grandTotal: saleReturnObj.grandTotal,
                warehouse: saleReturnObj.warehouse,
                paidAmount: saleReturnObj.paidAmount,
                returnAmount: saleReturnObj.returnAmount,
                date: saleReturnObj.date,
                productsData: saleReturnObj.productsData, // Include product details
                createdAt: saleReturnObj.createdAt
                    ? saleReturnObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({
            status: "success",
            saleReturns: formattedSaleReturns
        });
    } catch (error) {
        console.error("Search sale returns error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// Get total return amount for products where restocking is false
const getTotalReturnAmount = async (req, res) => {
    try {
        const saleReturns = await SaleReturn.find(); // Fetch all sale return documents
        const detailedReturns = saleReturns.map(sale => {
            const returnAmount = sale.productsData
                .filter(product => !product.restocking) // Only consider products where restocking is false
                .reduce((sum, product) => sum + (product.price * product.returnQty), 0); // Calculate total return amount
            return {
                date: sale.date,
                returnAmount: returnAmount
            };
        });

        const totalReturnAmount = detailedReturns.reduce((total, saleReturn) => total + saleReturn.returnAmount, 0);

        res.status(200).json({ totalReturnAmount, detailedReturns });
    } catch (error) {
        console.error('Error calculating total return amount:', error);
        res.status(500).json({ message: 'Failed to calculate total return amount', error: error.message });
    }
};

const getTodayReturnAmount = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const saleReturns = await SaleReturn.find({
            date: {
                $gte: new Date(`${today}T00:00:00.000Z`),
                $lte: new Date(`${today}T23:59:59.999Z`)
            }
        });

        const detailedReturns = saleReturns.map(sale => {
            const returnAmount = sale.productsData
                .filter(product => !product.restocking)
                .reduce((sum, product) => sum + (product.price * product.returnQty), 0);
            return {
                date: sale.date,
                returnAmount: returnAmount
            };
        });

        const totalReturnAmount = detailedReturns.reduce((total, saleReturn) => total + saleReturn.returnAmount, 0);

        res.status(200).json({ totalReturnAmount, detailedReturns });
    } catch (error) {
        console.error('Error calculating todays return amount:', error);
        res.status(500).json({ message: 'Failed to calculate todays return amount', error: error.message });
    }
};


const getLastWeekReturnAmount = async (req, res) => {
    try {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        const saleReturns = await SaleReturn.find({
            date: {
                $gte: lastWeek,
                $lte: today
            }
        });

        const detailedReturns = saleReturns.map(sale => {
            const returnAmount = sale.productsData
                .filter(product => !product.restocking)
                .reduce((sum, product) => sum + (product.price * product.returnQty), 0);

            const products = sale.productsData.map(product => ({
                name: product.name,
                price: product.price,
                returnQty: product.returnQty,
                restocking: product.restocking
            }));

            return {
                date: sale.date,
                returnAmount: returnAmount,
                products: products
            };
        });

        const totalReturnAmount = detailedReturns.reduce((total, saleReturn) => total + saleReturn.returnAmount, 0);

        res.status(200).json({ totalReturnAmount, detailedReturns });
    } catch (error) {
        console.error('Error calculating last week\'s return amount:', error);
        res.status(500).json({ message: 'Failed to calculate last week\'s return amount', error: error.message });
    }
};


const getLastMonthReturnAmount = async (req, res) => {
    try {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);

        const saleReturns = await SaleReturn.find({
            date: {
                $gte: lastMonth,
                $lte: today
            }
        });

        const detailedReturns = saleReturns.map(sale => {
            const returnAmount = sale.productsData
                .filter(product => !product.restocking)
                .reduce((sum, product) => sum + (product.price * product.returnQty), 0);
            return {
                date: sale.date,
                returnAmount: returnAmount
            };
        });

        const totalReturnAmount = detailedReturns.reduce((total, saleReturn) => total + saleReturn.returnAmount, 0);

        res.status(200).json({ totalReturnAmount, detailedReturns });
    } catch (error) {
        console.error('Error calculating last months return amount:', error);
        res.status(500).json({ message: 'Failed to calculate last months return amount', error: error.message });
    }
};

const getLastYearReturnAmount = async (req, res) => {
    try {
        const today = new Date();
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);

        const saleReturns = await SaleReturn.find({
            date: {
                $gte: lastYear,
                $lte: today
            }
        });

        const detailedReturns = saleReturns.map(sale => {
            const returnAmount = sale.productsData
                .filter(product => !product.restocking)
                .reduce((sum, product) => sum + (product.price * product.returnQty), 0);
            return {
                date: sale.date,
                returnAmount: returnAmount
            };
        });

        const totalReturnAmount = detailedReturns.reduce((total, saleReturn) => total + saleReturn.returnAmount, 0);

        res.status(200).json({ totalReturnAmount, detailedReturns });
    } catch (error) {
        console.error('Error calculating last years return amount:', error);
        res.status(500).json({ message: 'Failed to calculate last years return amount', error: error.message });
    }
};

module.exports = { returnSale, deleteSaleReturn, getTotalReturnAmount, findSaleReturnById, updateReturnSale, removeProductFromSaleReturn, fetchSaleReturns, searchSaleReturns,  getTodayReturnAmount,
    getLastWeekReturnAmount, getLastMonthReturnAmount, getLastYearReturnAmount };
