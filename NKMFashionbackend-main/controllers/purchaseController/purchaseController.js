const Purchase = require('../../models/purchaseModel')
const PurchasePayment = require("../../models/purchasePaymentModel")
const Product = require('../../models/products/product');
const posController = require('../posController/posController')
const mongoose = require('mongoose');
const Cash = require('../../models/posModel/cashModel');
const { isEmpty } = require('lodash');
const generateReferenceId = require('../../utils/generateReferenceID');

//Create purchase
const createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchaseData = req.body;

        // Generate a reference ID for the sale
        const refferenceId = await generateReferenceId('PURCHASE');
        purchaseData.refferenceId = refferenceId;

        // Validation checks using isEmpty
        if (isEmpty(purchaseData.warehouse)) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }
        if (isEmpty(purchaseData.supplier)) {
            return res.status(400).json({ message: 'Supplier is required.', status: 'unsuccess' });
        }
        if (isEmpty(purchaseData.date)) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }
        if (isEmpty(purchaseData.paymentStatus)) {
            return res.status(400).json({ message: 'Payment Status is required.', status: 'unsuccess' });
        }
        if (isEmpty(purchaseData.orderStatus)) {
            return res.status(400).json({ message: 'Order Status is required.', status: 'unsuccess' });
        }
        if (isEmpty(purchaseData.paymentType)) {
            return res.status(400).json({ message: 'Payment Type is required.', status: 'unsuccess' });
        }

        purchaseData.paymentType = purchaseData.paymentType || 'cash';
        purchaseData.orderStatus = purchaseData.orderStatus || 'ordered';

        const newPruchase = new Purchase(purchaseData);
        const productsData = purchaseData.productsData; // Extracting productsData from the sale data

        // Prepare update promises for product quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, ptype } = product;
            const quantity = Number(product.quantity); // Convert quantity to a number

            // Validate the current ID
            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                return res.status(404).json({ message: `Invalid product ID: ${currentID}`, status: 'unsuccess' });
            }

            // Check for valid quantity
            if (isNaN(quantity) || quantity < 0) {
                return res.status(400).json({ message: `Invalid Product Quantity for Product Id:  ${currentID}`, status: 'unsuccess' });
            }

            // Check for valid quantity
            if (typeof quantity !== 'number' || quantity < 0) {
                return res.status(400).json({ message: `Invalid Product Quantity for Product Id:  ${currentID}`, status: 'unsuccess' });
            }

            // Update logic based on product type
            if (ptype === 'Single') {
                // For Single products, reduce productQty by the purchasing quantity
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return res.status(400).json({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }

                const warehouseKey = purchaseData.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return res.status(400).json({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                SelectedWarehouse.productQty += quantity;
                await updatedProduct.save();
                return updatedProduct; // Return updated single product
            } else if (ptype === 'Variation') {
                // For Variation products, update the quantity in variationValues
                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    return res.status(400).json({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
                }

                const warehouseKey = purchaseData.warehouse;
                const SelectedWarehouse = updatedProduct.warehouse.get(warehouseKey);

                if (!SelectedWarehouse) {
                    return res.status(400).json({ message: `Warehouse ${warehouseKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }
                // Assuming you have a field to identify the specific variation
                const variationKey = product.variationValue;
                const variation = SelectedWarehouse.variationValues.get(variationKey);
                if (!variation) {
                    return res.status(400).json({ message: `Variation ${variationKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }
                variation.productQty += quantity;
                updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                await updatedProduct.save();

                return updatedProduct; // Return updated variation product
            } else {
                return res.status(400).json({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
            }
        });

        // Wait for all product updates to complete
        await Promise.all(updatePromises);

        // Save the sale after updating product quantities
        await newPruchase.save();
        await session.commitTransaction();
        res.status(201).json({ message: 'Purchase saved successfully!', purchase: newPruchase });
    } catch (error) {
        console.error('Error saving Purchase:', error);
        res.status(500).json({ message: 'Error saving Purchase', error: error.message });
    }
};


// Delete purchase
const deletePurchase = async (req, res) => {
    const { id } = req.params; // Get the ID from the request parameters

    try {
        const deletedPurchase = await Purchase.findByIdAndDelete(id); // Delete the by ID
        if (!deletedPurchase) {
            return res.status(404).json({ message: 'Purchase not found' }); // If no sale is found, send 404
        }
        res.status(200).json({ message: 'Purchase deleted successfully!', purchase: deletedPurchase }); // Send success response
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({ message: 'Error deleting purchase', error });
    }
};

//Get purchase by ID
// const findPurchaseById = async (req, res) => {
//     const { id } = req.params;

//     // Validate the sale ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: 'Invalid purchase ID format' });
//     }

//     try {
//         // Find the sale by ID
//         const purchase = await Purchase.findById(id);
//         if (!purchase) {
//             return res.status(404).json({ message: 'Purchase not found' });
//         }
//         // Extract product IDs from the sale's productsData
//         const productIds = purchase.productsData.map(product => product.currentID);

//         // Fetch corresponding base products using product IDs
//         const products = await Product.find({ _id: { $in: productIds } });

//         // Map through the sale's productsData and attach the base product details (including stock quantities)
//         const updatedProductsData = purchase.productsData.map(productData => {
//             const baseProduct = products.find(p => p._id.toString() === productData.currentID);

//             const warehouseKey = purchase.warehouse;
//             if (baseProduct) {
//                 let stokeQty = "";
//                 const SelectedWarehouse = products.warehouse.get(warehouseKey);
//                 const variationKey = purchase.productsData.map(product => product.variationValue);
//                 // Check if the product has variations and find the correct variation stock
//                 if (baseProduct.warehouse && baseProduct.warehouse[warehouseKey]) {
//                     const variation = SelectedWarehouse.variationValues.get(variationKey);

//                     if (variation) {
//                         stokeQty = variation.productQty || ""; // Get stock quantity for this variation
//                     }
//                 } else {
//                     // For single products, directly assign stock quantity from base product
//                     stokeQty = SelectedWarehouse.productQty || "";
//                 }

//                 // Return product data with the attached stock quantity
//                 return {
//                     currentID: productData.currentID,
//                     variationValue: productData.variationValue,
//                     name: productData.name,
//                     ptype: productData.ptype,
//                     price: productData.price,
//                     quantity: productData.quantity,
//                     stokeQty, // Attach stock quantity
//                     taxRate: productData.taxRate,
//                     subtotal: productData.subtotal,
//                     _id: productData._id
//                 };
//             }

//             // Return original product data if no base product found
//             return productData;
//         });

//         // Combine sale with the updated product details
//         const purchaseWithUpdatedProducts = {
//             ...purchase.toObject(), // Spread existing sale fields
//             productsData: updatedProductsData // Attach updated products data
//         };

//         // Send the updated sale data
//         res.status(200).json(purchaseWithUpdatedProducts);

//     } catch (error) {
//         console.error('Error finding purchase by ID:', error);
//         res.status(500).json({ message: 'Error fetching purchase by ID', error });
//     }
// };

// Get purchase by ID
const findPurchaseById = async (req, res) => {
    const { id } = req.params;

    // Validate the purchase ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid purchase ID format' });
    }

    try {
        // Find the purchase by ID
        const purchase = await Purchase.findById(id).lean();
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

            const warehouseKey = purchase.warehouse;
            if (baseProduct) {
                let stockQty = "";

                const selectedWarehouse = baseProduct.warehouse[warehouseKey];
                if (!selectedWarehouse) {
                    console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                    return {
                        ...productData,
                        stockQty: "N/A" // Indicate warehouse not found
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

                // Return product data with the attached stock quantity
                return {
                    ...productData,
                    stockQty // Attach stock quantity
                };
            }

            // Return original product data if no base product found
            return {
                ...productData,
                stockQty // Attach stock quantity
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

// Update a purchase
const updatePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchaseID = req.params.id; 
        const updateData = req.body; 

        // Validation checks
        if (isEmpty(updateData.date)) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }
        if (isEmpty(updateData.paymentStatus)) {
            return res.status(400).json({ message: 'Payment Status is required.', status: 'unsuccess' });
        }
        if (isEmpty(updateData.orderStatus)) {
            return res.status(400).json({ message: 'Order Status is required.', status: 'unsuccess' });
        }
        if (isEmpty(updateData.paymentType)) {
            return res.status(400).json({ message: 'Payment Type is required.', status: 'unsuccess' });
        }

        const existingPurchase = await Purchase.findById(purchaseID);
        if (!existingPurchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        const existingProducts = existingPurchase.productsData;
        const updatedProducts = updateData.productsData;

        // Process product updates
        await Promise.all(
            updatedProducts.map(async (product) => {
                const { currentID, quantity: newQuantity, ptype, variationValue } = product;

                const existingProduct = existingProducts.find(p => p.currentID === currentID);
                const previousQuantity = existingProduct ? existingProduct.quantity : 0;
                const quantityDifference = newQuantity - previousQuantity;

                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    throw new Error(`Invalid product ID: ${currentID}`);
                }

                const warehouseKey = updateData.warehouse || existingPurchase.warehouse;

                if (ptype === 'Single') {
                    const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);
                    if (!selectedWarehouse) {
                        throw new Error(`Warehouse ${warehouseKey} not found for product with ID: ${currentID}`);
                    }
                    if (quantityDifference < 0 && selectedWarehouse.productQty < Math.abs(quantityDifference)) {
                        throw new Error(`Insufficient stock for product ID: ${currentID}`);
                    }
                    selectedWarehouse.productQty += quantityDifference; // Add or subtract based on the difference
                } else if (ptype === 'Variation') {
                    const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);
                    if (!selectedWarehouse) {
                        throw new Error(`Warehouse ${warehouseKey} not found for product with ID: ${currentID}`);
                    }
                    const variation = selectedWarehouse.variationValues.get(variationValue);
                    if (!variation) {
                        throw new Error(`Variation ${variationValue} not found for product ID: ${currentID}`);
                    }
                    if (quantityDifference < 0 && variation.productQty < Math.abs(quantityDifference)) {
                        throw new Error(`Insufficient variation stock for product ID: ${currentID}`);
                    }
                    variation.productQty += quantityDifference; // Add or subtract based on the difference
                    updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                } else {
                    throw new Error(`Invalid product type for product ID: ${currentID}`);
                }
                await updatedProduct.save();
            })
        );

        // Update the purchase document
        const updatedFields = {
            ...updateData, // Incoming update data
            warehouse: existingPurchase.warehouse, // Preserve existing warehouse
            supplier: existingPurchase.supplier, // Preserve existing supplier
        };

        console.log('Updated Fields for Purchase:', JSON.stringify(updatedFields, null, 2));

        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseID,
            updatedFields,
            { new: true, runValidators: true } // Return updated document and validate
        );

        console.log('Updated Purchase Document:', JSON.stringify(updatedPurchase, null, 2));

        await session.commitTransaction();
        res.status(200).json({
            message: 'Purchase updated successfully',
            purchase: updatedPurchase,
        });
    } catch (error) {
        console.error('Error updating Purchase return:', error.message);
        await session.abortTransaction();
        res.status(500).json({ message: 'Failed to update Purchase return', error: error.message });
    } finally {
        session.endSession();
    }
};

const fetchPaymentByPurchaseId = async (req, res) => {
    const { purchaseId } = req.params;
    try {
        const paymentData = await PurchasePayment.find({ purchaseId: purchaseId });
        if (!paymentData || paymentData.length === 0) {
            return res.status(404).json({ message: 'No payments found for this purchase ID' });
        }
        res.status(200).json({ payments: paymentData });
    } catch (error) {
        console.error('Error fetching purchase payment data:', error);
        res.status(500).json({ error: 'An error occurred while fetching purchase payment data' });
    }
};

const deletePaymentOfPurchase = async (req, res) => {
    const { id } = req.params; // Payment ID
    try {
        // Find the payment to delete
        const payment = await PurchasePayment.findById(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const purchaseId = payment.purchaseId;

        // Find the associated purchase
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // Subtract the payment amount from the purchase's paidAmount
        purchase.paidAmount -= payment.payingAmount;

        // Ensure paidAmount doesn't fall below 0
        if (purchase.paidAmount < 0) {
            purchase.paidAmount = 0;
        }

        // Recalculate the payment status
        if (purchase.paidAmount === 0) {
            purchase.paymentStatus = 'Unpaid';
        } else if (purchase.paidAmount >= purchase.grandTotal) {
            purchase.paymentStatus = 'Paid';
        } else {
            purchase.paymentStatus = 'Partial';
        }

        // Save the updated purchase
        await purchase.save();

        // Delete the payment
        await PurchasePayment.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Payment deleted successfully',
            purchase: {
                purchaseId: purchase._id,
                paidAmount: purchase.paidAmount,
                paymentStatus: purchase.paymentStatus,
            },
        });
    } catch (error) {
        console.error('Error deleting purchase payment:', error);
        res.status(500).json({ error: 'An error occurred while deleting the purchase payment' });
    }
};

const payingForPurchase = async (req, res) => {
    const { purchaseId, amountToPay, payingAmount, paymentType, currentDate } = req.body;
    try {
        // Find the purchase by ID
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        // Ensure grandTotal and paidAmount are numbers
        if (typeof purchase.grandTotal !== 'number' || typeof purchase.paidAmount !== 'number') {
            return res.status(400).json({ message: 'Invalid purchase amount data' });
        }

        // Calculate the new total paid amount
        const newTotalPaidAmount = purchase.paidAmount + Number(payingAmount);

        // Ensure payment does not exceed amount to pay
        if (newTotalPaidAmount > Number(amountToPay)) {
            return res.status(400).json({ message: 'Payment exceeds the amount to pay.' });
        }

        // Create a new payment entry for the purchase
        const newPayment = new PurchasePayment({
            purchaseId,
            amountToPay: Number(amountToPay),
            payingAmount: Number(payingAmount),
            currentDate: currentDate || Date.now(),
            paymentType: paymentType || 'Default',
        });

        await newPayment.save();

        // Update the paid amount in the Purchase model
        purchase.paidAmount = newTotalPaidAmount;

        // Calculate total paid amount by summing all payments for the purchase
        const allPayments = await PurchasePayment.find({ purchaseId });
        const totalPaidAmount = allPayments.reduce((sum, payment) => sum + payment.payingAmount, 0);

        // Calculate due amount
        const dueAmount = Number(amountToPay) - totalPaidAmount;

        // Determine and set the payment status
        if (totalPaidAmount === 0) {
            purchase.paymentStatus = 'unpaid';
        } else if (totalPaidAmount >= purchase.grandTotal) {
            purchase.paymentStatus = 'paid';
        } else if (totalPaidAmount > 0 && totalPaidAmount < purchase.grandTotal) {
            purchase.paymentStatus = 'partial';
        }

        await purchase.save();

        return res.status(201).json({
            message: 'Purchase payment recorded successfully',
            payment: newPayment,
            purchase: {
                purchaseId: purchase._id,
                paidAmount: totalPaidAmount,
                dueAmount: dueAmount,
                paymentStatus: purchase.paymentStatus,
            }
        });
    } catch (error) {
        console.error('Error processing purchase payment:', error);
        res.status(500).json({ error: 'An error occurred while processing the purchase payment' });
    }
};


//Delete a product from purchase
const deleteProductFromPurchase = async (req, res) => {
    const { purchaseID, productID, total } = req.query; // `productID` refers to `currentID` in `productsData`

    try {
        // Step 1: Find the Purchase by PurchaseID
        const purchase = await Purchase.findById(purchaseID);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // Step 2: Check if the product exists in the Purchase's productsData
        const productToDelete = purchase.productsData.find(product => product.currentID === productID);
        if (!productToDelete) {
            return res.status(404).json({ message: 'Product not found in Purchase' });
        }

        // Step 3: Calculate the new grandTotal after removing the product's subtotal
        const newGrandTotal = purchase.grandTotal - productToDelete.subtotal;

        // Step 4: Update the sale by pulling the product out of productsData and updating grandTotal
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseID,
            {
                $pull: { productsData: { currentID: productID } }, // Remove the product from the array
                grandTotal: newGrandTotal // Update the grandTotal
            },
            { new: true } // Return the updated document
        );

        // Step 5: Respond with success if the purchase was updated
        if (updatedPurchase) {
            res.status(200).json({ message: "Product deleted successfully", purchase: updatedPurchase });
        } else {
            res.status(404).json({ message: "purchase not found" });
        }
    } catch (error) {
        console.error("Error deleting product from purchase:", error);
        res.status(500).json({ message: "An error occurred while deleting the product" });
    }
};

//Get purchase by reference ID or customer name and fetch all purchases combined function
const fetchPurchases = async (req, res) => {
    const { id, supplierName, purchaseId } = req.query;

    try {
        // Fetch purchase by purchaseId (refferenceId)
        if (purchaseId) {

            const purchase = await Purchase.findOne({ refferenceId: purchaseId }); 
            if (!purchase) {
                return res.status(404).json({ message: "Purchase not found" });
            }
            return res.status(200).json(purchase);
        }

        // Fetch purchase by MongoDB ObjectId
        if (id) {

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid purchase ID format" });
            }

            const purchase = await Purchase.findById(id);
            if (!purchase) {
                return res.status(404).json({ message: "Purchase not found" });
            }
            return res.status(200).json(purchase);
        }

        // Search purchases by customerName
        if (supplierName) {
            if (supplierName.length < 1) {
                return res.status(400).json({ message: "Please provide at least one character." });
            }

            const purchases = await Purchase.find({
                supplier: { $regex: `^${supplierName}`, $options: "i" },
            });

            if (purchases.length === 0) {
                return res.status(404).json({ message: "No purchases found for this customer" });
            }
            return res.status(200).json(purchases);
        }
        // Fetch all purchases with or without pagination
        const size = parseInt(req.query?.page?.size) || 10; // Default size is 10
        const number = parseInt(req.query?.page?.number) || 1; // Default page number is 1
        const offset = (number - 1) * size; // Calculate the offset for pagination

        if (req.query?.page) {
            const purchases = await Purchase.find()
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(size);

            if (!purchases || purchases.length === 0) {
                return res.status(404).json({ message: "No purchases found." });
            }
            const total = await Purchase.countDocuments();
            const totalPages = Math.ceil(total / size);

            return res.status(200).json({
                message: "Purchases fetched successfully with pagination",
                data: purchases,
                total,
                totalPages,
                currentPage: number,
                pageSize: size
            });
        }
        // Fetch all without pagination if no pagination queries are provided
        const purchases = await Purchase.find();
        return res.status(200).json(purchases);
    } catch (error) {
        console.error("Error handling purchases:", error);
        res.status(500).json({ message: "Error handling purchases", error });
    }
};

const searchPurchase = async (req, res) => {
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
                { supplier: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search
                { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } },
                { invoiceNumber: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }
            ]
        };

        // Fetch purchases based on the query
        const purchases = await Purchase.find(query).populate('productsData.currentID', 'productName productQty');

        if (!purchases || purchases.length === 0) {
            return res.status(404).json({
                status: "unsuccess",
                message: "No purchases found for the provided keyword."
            });
        }

        // Format purchase data if additional processing is needed
        const formattedPurchases = purchases.map((purchase) => {
            const purchaseObj = purchase.toObject();

            return {
                _id: purchaseObj._id,
                refferenceId: purchaseObj.refferenceId,
                invoiceNumber: purchaseObj.invoiceNumber,
                supplier: purchaseObj.supplier,
                totalAmount: purchaseObj.totalAmount,
                purchaseDate: purchaseObj.purchaseDate,
                paymentStatus: purchaseObj.paymentStatus,
                paymentType: purchaseObj.paymentType,
                grandTotal: purchaseObj.grandTotal,
                discount: purchaseObj.discount,
                orderStatus: purchaseObj.orderStatus,
                discountType: purchaseObj.discountType,
                paidAmount: purchaseObj.paidAmount,
                shipping: purchaseObj.shipping,
                tax: purchaseObj.tax,
                warehouse: purchaseObj.warehouse,
                date: purchaseObj.date,
                productsData: purchaseObj.productsData, // Include product details
                createdAt: purchaseObj.createdAt
                    ? purchaseObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({
            status: "success",
            purchases: formattedPurchases
        });
    } catch (error) {
        console.error("Search purchases error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};


module.exports = {
    createPurchase, deletePurchase, findPurchaseById, updatePurchase, fetchPaymentByPurchaseId, deletePaymentOfPurchase, payingForPurchase, deleteProductFromPurchase, fetchPurchases, searchPurchase
};