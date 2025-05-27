const PurchaseReturn = require('../../models/purchaseReturnModel')
const Purchase = require('../../models/purchaseModel')
const Product = require('../../models/products/product');
const mongoose = require('mongoose');
const generateReferenceId = require('../../utils/generateReferenceID');
const { isEmpty } = require('lodash')

//Return the purchase
const returnPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { _id, ...returnData } = req.body;

        const referenceId = await generateReferenceId('PURCHASE_RETURN');
        returnData.refferenceId = referenceId;
        returnType = 'company';
        returnData.returnType = returnType;

        if (isEmpty(returnData.warehouse)) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }
        if (isEmpty(returnData.supplier)) {
            return res.status(400).json({ message: 'Supplier is required.', status: 'unsuccess' });
        }
        if (isEmpty(returnData.date)) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }

        // Save the purchase return data in the PurchaseReturn collection
        const newPurchaseReturn = new PurchaseReturn(returnData);
        const savedReturn = await newPurchaseReturn.save();

        // Remove the purchase from the Purchase collection using its _id
        const deletedPurchase = await Purchase.findByIdAndDelete(_id);
        if (!deletedPurchase) {
            return res.status(404).json({ message: 'Original purchase not found for return' });
        }

        // Extract the product data from the returned purchase to update the stock
        const productsData = deletedPurchase.productsData;

        // Prepare update promises for product quantities (to undo the purchase)
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype, variationValue } = product; // Extract details from product

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

                const warehouseKey = deletedPurchase.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return Promise.reject({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                // Deduct the stock quantity to reverse the purchase
                if (SelectedWarehouse.productQty < quantity) {
                    return Promise.reject({ message: `Not enough stock to deduct for product ID: ${currentID}`, status: 'unsuccess' });
                }
                SelectedWarehouse.productQty -= quantity; // Deduct the quantity that was returned
                await updatedProduct.save(); // Save the changes to the product
                return updatedProduct; // Return updated single product
            } else if (ptype === 'Variation') {
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }

                const warehouseKey = deletedPurchase.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return Promise.reject({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                const variation = SelectedWarehouse.variationValues.get(variationValue);

                if (!variation) {
                    return Promise.reject({ message: `Variation ${variationValue} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                // Deduct the quantity of the variation to reverse the purchase
                if (variation.productQty < quantity) {
                    return Promise.reject({ message: `Not enough stock to deduct for product variation ${variationValue} of product ID: ${currentID}`, status: 'unsuccess' });
                }

                variation.productQty -= quantity; // Deduct the quantity that was returned
                updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                await updatedProduct.save(); // Save the changes made to the variations
                return updatedProduct; // Return updated variation product
            } else {
                return Promise.reject({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
            }
        });

        // Wait for all product updates to complete
        await Promise.all(updatePromises);
        await session.commitTransaction();
        res.status(201).json({
            message: 'Purchase return saved successfully and original purchase removed',
            purchaseReturn: savedReturn,
        });
    } catch (error) {
        console.error('Error processing purchase return:', error);
        await session.abortTransaction();
        res.status(500).json({ message: 'Failed to process purchase return', error });
    } finally {
        session.endSession();
    }
};

// View all purchase returns with pagination
const fetchAllPurchaseReturns = async (req, res) => {
    try {
        const size = parseInt(req.query?.page?.size) || 10; // Default size is 10
        const number = parseInt(req.query?.page?.number) || 1; // Default page number is 1
        const offset = (number - 1) * size; // Calculate the offset for pagination

        // Check if pagination query is provided
        if (req.query?.page) {
            const purchaseReturns = await PurchaseReturn.find()
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(size);

            if (!purchaseReturns || purchaseReturns.length === 0) {
                return res.status(404).json({ message: "No purchase returns found." });
            }

            const total = await PurchaseReturn.countDocuments();
            const totalPages = Math.ceil(total / size);

            return res.status(200).json({
                message: 'Purchase returns fetched successfully with pagination',
                data: purchaseReturns,
                total,
                totalPages,
                currentPage: number,
                pageSize: size
            });
        }

        // Fetch all without pagination if no pagination queries are provided
        const purchaseReturns = await PurchaseReturn.find();
        return res.status(200).json({
            message: 'Purchase returns fetched successfully',
            data: purchaseReturns
        });
    } catch (error) {
        console.error('Error fetching purchase returns:', error);
        res.status(500).json({ message: 'Failed to fetch purchase returns', error });
    }
};


//Delete a purchase return
const deletePurchaseReturn = async (req, res) => {
    try {
        const purchaseReturnId = req.params.id;
        const deletedPurchaseReturn = await PurchaseReturn.findByIdAndDelete(purchaseReturnId);
        if (!deletedPurchaseReturn) {
            return res.status(404).json({
                message: 'Purchase return not found',
            });
        }
        res.status(200).json({
            message: 'Purchase return deleted successfully',
            purchaseReturn: deletedPurchaseReturn,
        });
    } catch (error) {
        console.error('Error deleting purchase return:', error);
        res.status(500).json({ message: 'Failed to delete purchase return', error });
    }
};


const findPurchaseReturnById = async (req, res) => {
    const { id } = req.params;

    // Validate the purchase ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid purchase ID format' });
    }

    try {
        // Find the purchase by ID
        const purchase = await PurchaseReturn.findById(id).lean();
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // Extract product IDs from the purchase's productsData
        const productIds = purchase.productsData.map(product => product.currentID);

        // Fetch corresponding base products using product IDs
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        // Map through the purchase's productsData and attach the base product details (including stock quantities)
        const updatedProductsData = purchase.productsData.map(productData => {
            const baseProduct = products.find(p => p._id.toString() === productData.currentID);
            const ptype = baseProduct.ptype

            const warehouseKey = purchase.warehouse;
            if (baseProduct) {
                let stockQty = "";

                const selectedWarehouse = baseProduct.warehouse[warehouseKey];
                if (!selectedWarehouse) {
                    console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                    return {
                        ...productData,
                        stockQty: "N/A", // Indicate warehouse not found
                        ptype
                    };
                }

                // Check if the product has variations and find the correct variation stock
                if (productData.variationValue && selectedWarehouse.variationValues) {
                    const variation = selectedWarehouse.variationValues[productData.variationValue];
                    if (variation) {
                        stockQty = variation.productQty || ""; // Get stock quantity for this variation
                    } else {
                        console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                    }
                } else {
                    // For single products, directly assign stock quantity from base product
                    stockQty = selectedWarehouse.productQty || "";
                }

                // Log the stock quantity for debugging
                console.log(`Product ID: ${productData.currentID}, Stock Quantity: ${stockQty}`);

                // Return product data with the attached stock quantity
                return {
                    ...productData,
                    stockQty, // Attach stock quantity
                    ptype
                };
            }

            // Return original product data if no base product found
            return {
                ...productData,
                stockQty, // Attach stock quantity
                ptype: "N/A"
            };
        });

        // Combine purchase with the updated product details
        const purchaseWithUpdatedProducts = {
            ...purchase, // Spread existing purchase fields
            productsData: updatedProductsData // Attach updated products data
        };

        // Send the updated purchase data
        res.status(200).json(purchaseWithUpdatedProducts);

    } catch (error) {
        console.error('Error finding purchase by ID:', error);
        res.status(500).json({ message: 'Error fetching purchase by ID', error: error.message });
    }
};


const updatePurchaseReturn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchaseReturnId = req.params.id; // Get the purchase return ID from the request parameters
        const updateData = req.body; // Get the new data for updating from the request body

        // Validate that the purchase return ID is valid
        if (!mongoose.Types.ObjectId.isValid(purchaseReturnId)) {
            return res.status(400).json({ message: 'Invalid purchase return ID format' });
        }

        // Fetch the existing purchase return document
        const existingPurchaseReturn = await PurchaseReturn.findById(purchaseReturnId);
        if (!existingPurchaseReturn) {
            return res.status(404).json({ message: 'Purchase return not found' });
        }

        // Validate necessary fields
        if (isEmpty(updateData.warehouse)) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }
        if (isEmpty(updateData.supplier)) {
            return res.status(400).json({ message: 'Supplier is required.', status: 'unsuccess' });
        }
        if (isEmpty(updateData.date)) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }

        // Extract product data to update the stock
        const productsData = updateData.productsData;

        // Prepare update promises for product quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype, variationValue } = product;

            // Validate the current ID
            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                return Promise.reject({ message: `Invalid product ID: ${currentID}`, status: 'unsuccess' });
            }

            // Extract existing purchase quantity from the existing purchase return
            const existingProductData = existingPurchaseReturn.productsData.find(p => p.currentID === currentID);
            const existingPurchaseQty = existingProductData ? Number(existingProductData.quantity) : 0;

            // Update logic based on product type
            if (ptype === 'Single') {
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }

                const warehouseKey = existingPurchaseReturn.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return Promise.reject({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                // Calculate the new stock quantity
                const newStockQty = SelectedWarehouse.productQty - existingPurchaseQty + quantity;
                if (newStockQty < 1) {
                    return Promise.reject({ message: `Stock quantity cannot be less than 1 for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                // Update the stock quantity
                SelectedWarehouse.productQty = newStockQty;
                await updatedProduct.save(); // Save the changes to the product
                return updatedProduct; // Return updated single product
            } else if (ptype === 'Variation') {
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }

                const warehouseKey = existingPurchaseReturn.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return Promise.reject({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                const variation = SelectedWarehouse.variationValues.get(variationValue);

                if (!variation) {
                    return Promise.reject({ message: `Variation ${variationValue} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                // Calculate the new stock quantity for the variation
                const newVariationStockQty = variation.productQty - existingPurchaseQty + quantity;
                if (newVariationStockQty < 1) {
                    return Promise.reject({ message: `Stock quantity cannot be less than 1 for variation ${variationValue} of product with ID: ${currentID}`, status: 'unsuccess' });
                }

                // Update the quantity of the variation
                variation.productQty = newVariationStockQty;
                updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                await updatedProduct.save(); // Save the changes made to the variations
                return updatedProduct; // Return updated variation product
            } else {
                return Promise.reject({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
            }
        });

        // Wait for all product updates to complete
        await Promise.all(updatePromises);

        // Only update the fields that are sent from the frontend
        const updatedFields = {
            ...updateData, // Spread the incoming update data
        };

        // Update the purchase return document
        const updatedPurchaseReturn = await PurchaseReturn.findByIdAndUpdate(
            purchaseReturnId,
            updatedFields,
            { new: true, runValidators: true } // Return the updated document and validate
        );

        await session.commitTransaction();
        res.status(200).json({
            message: 'Purchase return updated successfully.',
            purchaseReturn: updatedPurchaseReturn,
        });
    } catch (error) {
        console.error('Error updating purchase return:', error);
        await session.abortTransaction();
        res.status(500).json({ message: 'Failed to update purchase return', error: error.message });
    } finally {
        session.endSession();
    }
};


const fetchPurchaseReturns = async (req, res) => {
    const { keyword } = req.query;

    try {
        let purchaseReturns;

        if (keyword) {

            let purchaseReturn;
            if (/^\d+$/.test(keyword)) {
                purchaseReturn = await PurchaseReturn.findOne({ refferenceId: keyword });
            } else if (mongoose.Types.ObjectId.isValid(keyword)) {
                purchaseReturn = await PurchaseReturn.findById(keyword);
            } else {
                purchaseReturns = await PurchaseReturn.find({
                    customer: { $regex: `^${keyword}`, $options: 'i' }
                });

                if (purchaseReturns.length === 0) {
                    return res.status(404).json({ message: 'No purchase returns found for this customer' });
                }

                return res.status(200).json(purchaseReturns);
            }

            if (purchaseReturn) {
                const productIds = purchaseReturn.productsData.map(product => product.currentID);
                const products = await Product.find({ _id: { $in: productIds } });

                const updatedProductsData = purchaseReturn.productsData.map(productData => {
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

                purchaseReturns = {
                    ...purchaseReturn.toObject(),
                    productsData: updatedProductsData
                };

                return res.status(200).json(purchaseReturns);
            }
        }

        // If no keyword, fetch all purchase returns
        purchaseReturns = await PurchaseReturn.find();
        return res.status(200).json({
            message: 'Purchase returns fetched successfully',
            purchaseReturns
        });

    } catch (error) {
        console.error('Error fetching purchase returns:', error);
        res.status(500).json({ message: 'Failed to fetch purchase returns', error });
    }
};


const removeProductFromPurchaseReturn = async (req, res) => {
    const { id, currentID } = req.body; // Extract purchase return ID and product's currentID
    if (!id || !currentID) {
        return res.status(400).json({ message: 'Both purchase return ID and product currentID are required' });
    }

    try {
        // Find the purchase return by ID
        const purchaseReturn = await PurchaseReturn.findById(id);

        if (!purchaseReturn) {
            return res.status(404).json({ message: 'Purchase return not found' });
        }

        // Remove the product from productsData
        const productIndex = purchaseReturn.productsData.findIndex(
            product => product.currentID === currentID
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in purchase return' });
        }

        // Remove the product and recalculate grandTotal
        const [removedProduct] = purchaseReturn.productsData.splice(productIndex, 1);

        purchaseReturn.grandTotal -= removedProduct.subtotal;

        // Save the updated document
        await purchaseReturn.save();

        res.status(200).json({
            message: 'Product removed successfully',
            updatedPurchaseReturn: purchaseReturn,
        });
    } catch (error) {
        console.error('Error removing product from purchase return:', error);
        res.status(500).json({
            message: 'Failed to remove product from purchase return',
            error: error.message,
        });
    }
};

const searchPurchaseReturns = async (req, res) => {
    const { keyword, returnType } = req.query; // Get returnType from query

    try {
        if (!keyword) {
            return res.status(400).json({
                status: "error",
                message: "Keyword is required for search."
            });
        }

        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Add returnType to the query if provided
        const query = {
            $and: [
                {
                    $or: [
                        { customer: { $regex: new RegExp(`${escapedKeyword}`, 'i') } },
                        { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }
                    ]
                }
            ]
        };
        if (returnType) {
            query.$and.push({ returnType });
        }

        const purchaseReturns = await PurchaseReturn.find(query).populate('productsData.currentID', 'productName productQty');

        if (!purchaseReturns || purchaseReturns.length === 0) {
            return res.status(404).json({
                status: "unsuccess",
                message: "No purchase returns found for the provided keyword."
            });
        }

        // Format purchase return data if additional processing is needed
        const formattedPurchaseReturns = purchaseReturns.map((purchaseReturn) => {
            const returnObj = purchaseReturn.toObject();

            return {
                _id: returnObj._id,
                refferenceId: returnObj.refferenceId,
                customer: returnObj.customer,
                returnDate: returnObj.returnDate, // Replace with the appropriate date field, if exists
                totalAmount: returnObj.totalAmount,
                productsData: returnObj.productsData, // Include product details
                paidAmount: returnObj.paidAmount,
                grandTotal: returnObj.grandTotal,
                date: returnObj.date,
                warehouse: returnObj.warehouse,
                status: returnObj.status, // Example field, adjust based on your schema
                createdAt: returnObj.createdAt
                    ? returnObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({
            status: "success",
            purchaseReturns: formattedPurchaseReturns
        });
    } catch (error) {
        console.error("Search purchase returns error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// const searchPurchaseReturn = async (query, returnType) => {
//     setLoading(true);
//     setError("");

//     try {
//         if (!query.trim()) {
//             setSearchedSuplierPurchased(purchaseReturnData);
//             setSuccessStatus("");
//             return;
//         }

//         const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchPurchaseReturn`, {
//             params: { keyword: query, returnType }, // Always pass returnType
//         });
//         if (response.data.purchaseReturns && response.data.purchaseReturns.length > 0) {
//             setSearchedSuplierPurchased(response.data.purchaseReturns);
//             setSuccessStatus("");
//         } else {
//             setSearchedSuplierPurchased([]);
//             setError("No purchase returns found for the given query.");
//         }
//     } catch (error) {
//         console.error("Search product error:", error);
//         setSearchedSuplierPurchased([]);
//         setError("No purchase returns found for the given query.");
//     } finally {
//         setLoading(false);
//     }
// };


module.exports = { returnPurchase, fetchAllPurchaseReturns, deletePurchaseReturn, updatePurchaseReturn, fetchPurchaseReturns, findPurchaseReturnById, removeProductFromPurchaseReturn, searchPurchaseReturns };