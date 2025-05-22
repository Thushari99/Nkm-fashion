const Transfer = require('../../models/transferModel')
const Product = require('../../models/products/product');
const generateReferenceId = require('../../utils/generateReferenceID')
const mongoose = require('mongoose');

const createTransfer = async (req, res) => {
    try {
        const transferData = req.body;
        const { warehouseFrom, warehouseTo, productsData } = transferData;

        // Generate reference ID before saving the transfer
        const referenceId = await generateReferenceId('TRN');

        const newTransfer = new Transfer({
            ...transferData,
            refferenceId: referenceId,
        });

        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype, variationValue } = product;

            const existingProduct = await Product.findById(currentID);
            if (!existingProduct) {
                throw new Error(`Product not found with ID: ${currentID}`);
            }

            if (!existingProduct.warehouse || !(existingProduct.warehouse instanceof Map)) {
                existingProduct.warehouse = new Map(Object.entries(existingProduct.warehouse || {}));
            }

            if (ptype === 'Single') {

                if (!existingProduct.warehouse.has(warehouseFrom)) {
                    throw new Error(`Source warehouse '${warehouseFrom}' missing for product ID: ${currentID}`);
                }

                if (!existingProduct.warehouse.has(warehouseTo)) {
                    existingProduct.warehouse.set(warehouseTo, { productQty: 0 });
                }

                const stockFrom = existingProduct.warehouse.get(warehouseFrom)?.productQty || 0;
                if (stockFrom < quantity) {
                    throw new Error(`Insufficient stock in ${warehouseFrom} for product ID: ${currentID}`);
                }

                // Update quantities
                existingProduct.warehouse.get(warehouseFrom).productQty -= quantity;
                const destinationWarehouse = existingProduct.warehouse.get(warehouseTo);
                destinationWarehouse.productQty = (destinationWarehouse.productQty || 0) + quantity;

            } else if (ptype === 'Variation') {

                // Get warehouseFrom and warehouseTo data
                const warehouseFromData = existingProduct.warehouse.get(warehouseFrom);
                const warehouseToData = existingProduct.warehouse.get(warehouseTo);

                if (!warehouseFromData) {
                    throw new Error(`Source warehouse '${warehouseFrom}' missing for product ID: ${currentID}`);
                }
                if (!warehouseToData) {
                    throw new Error(`Destination warehouse '${warehouseTo}' missing for product ID: ${currentID}`);
                }

                if (!warehouseFromData.variationValues || !(warehouseFromData.variationValues instanceof Map)) {
                    warehouseFromData.variationValues = new Map(Object.entries(warehouseFromData.variationValues || {}));
                }
                if (!warehouseToData.variationValues || !(warehouseToData.variationValues instanceof Map)) {
                    warehouseToData.variationValues = new Map(Object.entries(warehouseToData.variationValues || {}));
                }


                const variationFrom = warehouseFromData.variationValues.get(variationValue);
                const variationTo = warehouseToData.variationValues.get(variationValue);

                if (!variationFrom) {
                    throw new Error(`Variation '${variationValue}' not found in '${warehouseFrom}' for product ID: ${currentID}`);
                }

                if (variationFrom.productQty < quantity) {
                    throw new Error(`Insufficient stock in '${warehouseFrom}' for variation '${variationValue}' of product ID: ${currentID}`);
                }

                // Deduct from source warehouse
                variationFrom.productQty -= quantity;

                // Add to destination warehouse
                if (!variationTo) {
                    // If variation doesn't exist in destination warehouse, create it
                    warehouseToData.variationValues.set(variationValue, { productQty: quantity });
                } else {
                    variationTo.productQty += quantity;
                }

            } else {
                throw new Error(`Invalid product type for product ID: ${currentID}`);
            }

            // Save the updated product
            await existingProduct.save();
        });

        // Wait for all product stock updates
        await Promise.all(updatePromises);

        // Save the transfer record
        await newTransfer.save();

        res.status(201).json({ message: 'Transfer saved successfully!', transfer: newTransfer });

    } catch (error) {
        console.error('Error saving Transfer:', error);
        res.status(500).json({ message: 'Error saving Transfer', error: error.message });
    }
};


//CREATE TRANSFER
// const createTransfer = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {
//         const transferData = req.body;
//         const { warehouseFrom, warehouseTo, productsData } = transferData;
//         const newTransfer = new Transfer({ ...transferData });

//         // Step 2: Generate the referenceId (before saving the transfer)
//         const referenceId = await generateReferenceId('TRN');
//         newTransfer.refferenceId = referenceId;

//         // Prepare update or create product promises
//         const updatePromises = productsData.map(async (product) => {
//             const { currentID, quantity, ptype, variationValue } = product; // Extract product details
//             const existingProduct = await Product.findById(currentID);

//             if (!existingProduct) {
//                 throw new Error(`Product not found with ID: ${currentID}`);
//             }

//             if (ptype === 'Single') {
//                 // Handle single product transfer
//                 const productInWarehouseFrom = existingProduct.warehouse === warehouseFrom;
//                 const productInWarehouseTo = existingProduct.warehouse === warehouseTo;

//                 if (productInWarehouseFrom) {
//                     if (existingProduct.productQty < quantity) {
//                         throw new Error(`Insufficient stock in ${warehouseFrom} for product with ID: ${currentID}`);
//                     }

//                     // Update the stock
//                     existingProduct.productQty -= quantity;
//                     existingProduct.warehouse = warehouseTo; // Transfer to the new warehouse
//                     await existingProduct.save();
//                 } else {
//                     throw new Error(`Product with ID: ${currentID} not found in the source warehouse ${warehouseFrom}`);
//                 }
//             } else if (ptype === 'Variation') {
//                 // Handle variations of the product
//                 const variation = existingProduct.variationValues.get(variationValue);

//                 if (!variation) {
//                     throw new Error(`Variation ${variationValue} not found for product with ID: ${currentID}`);
//                 }

//                 if (!variation.warehouses) {
//                     variation.warehouses = {};
//                 }

//                 const variationInWarehouseFrom = variation.warehouses[warehouseFrom];
//                 const variationInWarehouseTo = variation.warehouses[warehouseTo];

//                 if (variationInWarehouseFrom < quantity) {
//                     throw new Error(`Insufficient stock in ${warehouseFrom} for variation ${variationValue} of product with ID: ${currentID}`);
//                 }

//                 // Update stock for variation
//                 variation.warehouses[warehouseFrom] -= quantity;
//                 variation.warehouses[warehouseTo] = (variationInWarehouseTo || 0) + quantity;

//                 await existingProduct.save();  // Save the updated variation
//             } else {
//                 throw new Error(`Invalid product type for product with ID: ${currentID}`);
//             }

//             return existingProduct;  // Return the updated product
//         });

//         // Wait for all update promises to resolve
//         await Promise.all(updatePromises);
//         await newTransfer.save();  // Save the transfer record

//         await session.commitTransaction();

//         res.status(201).json({ message: 'Transfer saved successfully!', adjustment: newTransfer });

//     } catch (error) {
//         await session.abortTransaction();
//         console.error('Error saving Transfer:', error);
//         res.status(500).json({ message: 'Error saving Transfer', error: error.message });
//     }
// };

//VIEW TRAnSFER
const getTransfer = async (req, res) => {
    try {
        const transfer = await Transfer.find(); // Fetch all adjustment from the database
        res.status(200).json(transfer); // Send the transfer data back to the client
    } catch (error) {
        console.error('Error fetching transfer:', error);
        res.status(500).json({ message: 'Error fetching transfer', error });
    }
};

// DELETE TRANSFER
const deleteTransfer = async (req, res) => {
    const { id } = req.params; // Get the sale ID from the request parameters
    try {
        const deletedTransfer = await Transfer.findByIdAndDelete(id);
        if (!deletedTransfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }
        res.status(200).json({ message: 'Transfer deleted successfully!', transfer: deletedTransfer });
    } catch (error) {
        console.error('Error deleting Transfer:', error);
        res.status(500).json({ message: 'Error deleting Transfer', error });
    }
};

//FETCH TRANSFER BY SEARCH ID
const findTransferById = async (req, res) => {
    const { refferenceId } = req.query;

    // Check if id is provided and is at least one character long
    if (!refferenceId || refferenceId.length < 1) {
        return res.status(400).json({ message: 'Please provide at least one character.' });
    }
    try {
        // Use a regular expression to find id starting with the provided letters
        const transfer = await Transfer.find({ refferenceId: { $regex: `^${refferenceId}`, $options: 'i' } });
        if (transfer.length === 0) {
            return res.status(404).json({ message: 'No transfer found for this id' });
        }
        res.status(200).json(transfer); // Send found transfer back to the client
    } catch (error) {
        console.error('Error fetching transfer by id:', error);
        res.status(500).json({ message: 'Error fetching transfer by id', error });
    }
};

//GET TRANSFER FOR UPDATE
const findTransferByIdForUpdate = async (req, res) => {
    const { id } = req.params;

    // Validate the sale ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid sale ID format' });
    }
    try {
        // Find the sale by ID
        const transfer = await Transfer.findById(id);
        if (!transfer) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        // Extract product IDs from the sale's productsData
        const productIds = transfer.productsData.map(product => product.currentID);

        // Fetch corresponding base products using product IDs
        const products = await Product.find({ _id: { $in: productIds } });

        // Map through the sale's productsData and attach the base product details
        const updatedProductsData = transfer.productsData.map(productData => {
            const baseProduct = products.find(p => p._id.toString() === productData.currentID);
            if (!baseProduct) {
                console.warn(`Base product with ID ${productData.currentID} not found.`);
                return productData;
            }

            let warehouseFromQty = 0;
            let warehouseToQty = 0;
            if (baseProduct.warehouse) {
                // Get stock from warehouseFrom
                warehouseFromQty = baseProduct.warehouse.get(transfer.warehouseFrom)?.productQty || 0;
                // Get stock from warehouseTo
                warehouseToQty = baseProduct.warehouse.get(transfer.warehouseTo)?.productQty || 0;
            }
                let stokeQty = 0;

                // Check if the product has variations and find the correct variation stock
                if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
                    const variation = baseProduct.variationValues.get(productData.variationValue);

                    if (variation) {
                        stokeQty = variation.productQty || 0; // Get stock quantity for this variation

                        warehouseFromQty = variation.warehouse?.get(transfer.warehouseFrom)?.productQty || 0;
                    warehouseToQty = variation.warehouse?.get(transfer.warehouseTo)?.productQty || 0;
                    }
                } else {
                    // For single products, directly assign stock quantity from base product
                    stokeQty = baseProduct.productQty || "";
                }
                // Return product data with the attached stock quantity
                return {
                    currentID: productData.currentID,
                    variationValue: productData.variationValue,
                    AdjustmentType: productData.AdjustmentType,
                    name: productData.name,
                    price: productData.price,
                    ptype: productData.ptype,
                    quantity: productData.quantity,
                    stokeQty, // Attach stock quantity
                    warehouseFromQty,
                    warehouseToQty,
                    taxRate: productData.taxRate,
                    subtotal: productData.subtotal,
                    _id: productData._id
                };
            });


        // Combine sale with the updated product details
        const transferWithUpdatedProducts = {
            ...transfer.toObject(), // Spread existing sale fields
            productsData: updatedProductsData // Attach updated products data
        };

        // Send the updated sale data
        res.status(200).json(transferWithUpdatedProducts);

    } catch (error) {
        console.error('Error finding sale by ID:', error);
        res.status(500).json({ message: 'Error fetching sale by ID', error });
    }
};

const updateTransfer = async (req, res) => {
    const { id } = req.params;
    const transferData = req.body;

    try {
        // Validate the transfer ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid transfer ID format' });
        }

        // Find the existing transfer
        const existingTransfer = await Transfer.findById(id);
        if (!existingTransfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }

        // Extract product IDs from transferData
        const productIds = transferData.productsData.map(product => product.currentID);

        // Fetch all products related to the transfer
        const products = await Product.find({ _id: { $in: productIds } });

        // Prepare update promises for each product
        const updatePromises = transferData.productsData.map(async (newProductData) => {
            const { currentID, quantity: newQuantity, ptype, variationValue } = newProductData;

            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                throw new Error(`Invalid product ID: ${currentID}`);
            }

            // Find the corresponding product
            const updatedProduct = products.find(p => p._id.toString() === currentID);
            if (!updatedProduct) {
                throw new Error(`Product not found with ID: ${currentID}`);
            }

            // Find the old product data from the existing transfer
            const oldProductData = existingTransfer.productsData.find(p => p.currentID === currentID);
            const oldQuantity = oldProductData ? oldProductData.quantity : 0; // Default to 0 if not found

            // Calculate the quantity difference
            const quantityChange = newQuantity - oldQuantity;

            if (ptype === 'Variation') {
                const variation = updatedProduct.variationValues.get(variationValue);
                if (!variation) {
                    throw new Error(`Variation ${variationValue} not found for product with ID: ${currentID}`);
                }

                let variationWarehouseFrom = variation.warehouse.get(existingTransfer.warehouseFrom) || {};
                let variationWarehouseTo = variation.warehouse.get(existingTransfer.warehouseTo) || {};

                if (quantityChange > 0 && (variationWarehouseFrom.productQty || 0) < quantityChange) {
                    throw new Error(`Insufficient stock in warehouseFrom for variation ${variationValue} of product with ID: ${currentID}`);
                }

                // Update only by the difference
                variationWarehouseFrom.productQty = (variationWarehouseFrom.productQty || 0) - quantityChange;
                variationWarehouseTo.productQty = (variationWarehouseTo.productQty || 0) + quantityChange;

                variation.warehouse.set(existingTransfer.warehouseFrom, variationWarehouseFrom);
                variation.warehouse.set(existingTransfer.warehouseTo, variationWarehouseTo);

            } else {
                let warehouseFromData = updatedProduct.warehouse.get(existingTransfer.warehouseFrom) || {};
                let warehouseToData = updatedProduct.warehouse.get(existingTransfer.warehouseTo) || {};

                if (quantityChange > 0 && (warehouseFromData.productQty || 0) < quantityChange) {
                    throw new Error(`Insufficient stock in warehouseFrom for product with ID: ${currentID}`);
                }

                // Update only by the difference
                warehouseFromData.productQty = (warehouseFromData.productQty || 0) - quantityChange;
                warehouseToData.productQty = (warehouseToData.productQty || 0) + quantityChange;

                updatedProduct.warehouse.set(existingTransfer.warehouseFrom, warehouseFromData);
                updatedProduct.warehouse.set(existingTransfer.warehouseTo, warehouseToData);
            }

            // Save the updated product
            await updatedProduct.save();
            return updatedProduct;
        });

        await Promise.all(updatePromises); // Wait for all updates to complete

        // Update only necessary fields in transferData without replacing nested objects
        Object.assign(existingTransfer, transferData);

        await existingTransfer.save(); // Save the updated transfer

        res.status(200).json({ message: 'Transfer updated successfully', transfer: existingTransfer });
    } catch (error) {
        console.error('Error updating transfer:', error);
        res.status(500).json({ message: 'Error updating transfer', error: error.message });
    }
};


// // Update a transfer
// const updateTransfer = async (req, res) => {
//     const { id } = req.params;
//     const transferData = req.body;

//     try {
//         // Validate the transfer ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ message: 'Invalid transfer ID format' });
//         }

//         // Find the transfer by ID
//         const existingTransfer = await Transfer.findById(id);
//         if (!existingTransfer) {
//             return res.status(404).json({ message: 'Transfer not found' });
//         }

//         // Prepare update promises for each product in the transfer
//         const updatePromises = transferData.productsData.map(async (product) => {
//             const { currentID, quantity, ptype } = product;

//             if (!mongoose.Types.ObjectId.isValid(currentID)) {
//                 throw new Error(`Invalid product ID: ${currentID}`);
//             }

//             // Find the product by ID
//             const updatedProduct = await Product.findById(currentID);
//             if (!updatedProduct) {
//                 throw new Error(`Product not found with ID: ${currentID}`);
//             }

//             // Update based on product type
//             if (ptype === 'Single') {
//                 if (updatedProduct.productQty < quantity) {
//                     throw new Error(`Insufficient stock for product with ID: ${currentID}`);
//                 }
//                 // Update quantity as needed
//                 updatedProduct.productQty -= quantity;
//             } else if (ptype === 'Variation') {
//                 const variationKey = product.variationValue;
//                 const variation = updatedProduct.variationValues.get(variationKey);

//                 if (!variation) {
//                     throw new Error(`Variation ${variationKey} not found for product with ID: ${currentID}`);
//                 }
//                 if (variation.productQty < quantity) {
//                     throw new Error(`Insufficient stock for variation ${variationKey} of product with ID: ${currentID}`);
//                 }
//                 // Update variation quantity
//                 variation.productQty -= quantity;
//             } else {
//                 throw new Error(`Invalid product type for product with ID: ${currentID}`);
//             }

//             await updatedProduct.save(); // Save each updated product
//             return updatedProduct;
//         });

//         await Promise.all(updatePromises); // Wait for all updates to complete

//         // Update the transfer document with new data
//         Object.assign(existingTransfer, transferData); // Update fields in existing transfer
//         await existingTransfer.save(); // Save the transfer changes

//         res.status(200).json({ message: 'Transfer updated successfully', transfer: existingTransfer });
//     } catch (error) {
//         console.error('Error updating transfer:', error);
//         res.status(500).json({ message: 'Error updating transfer', error: error.message });
//     }
// };

// const findTransferByIdForUpdate = async (req, res) => {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: 'Invalid transfer ID format' });
//     }

//     try {
//         const transfer = await Transfer.findById(id);
//         if (!transfer) {
//             return res.status(404).json({ message: 'Transfer not found' });
//         }

//         // Fetch all relevant product details
//         const productIds = transfer.productsData.map(product => product.currentID);
//         const products = await Product.find({ _id: { $in: productIds } });

//         const updatedProductsData = transfer.productsData.map(productData => {
//             const baseProduct = products.find(p => p._id.toString() === productData.currentID);
//             if (baseProduct) {
//                 let stockQtyFrom = "";
//                 let stockQtyTo = "";

//                 if (baseProduct.warehouseStock) {
//                     stockQtyFrom = baseProduct.warehouseStock[transfer.warehouseFrom] || 0;
//                     stockQtyTo = baseProduct.warehouseStock[transfer.warehouseTo] || 0;
//                 }

//                 return {
//                     ...productData,
//                     stockQtyFrom, // Attach stock quantity from warehouseFrom
//                     stockQtyTo, // Attach stock quantity from warehouseTo
//                 };
//             }
//             return productData;
//         });

//         res.status(200).json({
//             ...transfer.toObject(),
//             productsData: updatedProductsData,
//         });
//     } catch (error) {
//         console.error('Error fetching transfer by ID:', error);
//         res.status(500).json({ message: 'Error fetching transfer details', error });
//     }
// };

// const findTransferByIdForUpdate = async (req, res) => {
//     const { id } = req.params;

//     // Validate transfer ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: 'Invalid transfer ID format' });
//     }

//     try {
//         // Find the transfer by ID
//         const transfer = await Transfer.findById(id);
//         if (!transfer) {
//             return res.status(404).json({ message: 'Transfer not found' });
//         }

//         // Extract product IDs from transfer
//         const productIds = transfer.productsData.map(product => product.currentID);

//         // Fetch corresponding base products using product IDs
//         const products = await Product.find({ _id: { $in: productIds } });

//         // Map through transfer's productsData and attach product stock details
//         const updatedProductsData = transfer.productsData.map(productData => {
//             const baseProduct = products.find(p => p._id.toString() === productData.currentID);

//             if (baseProduct) {
//                 let stockQtyFrom = 0;
//                 let stockQtyTo = 0;

//                 if (baseProduct.warehouse) {
//                     const warehouseFromData = baseProduct.warehouse.get(transfer.warehouseFrom);
//                     const warehouseToData = baseProduct.warehouse.get(transfer.warehouseTo);

//                     stockQtyFrom = warehouseFromData?.productQty || 0;
//                     stockQtyTo = warehouseToData?.productQty || 0;
//                 }

//                 return {
//                     ...productData,
//                     stockQtyFrom,
//                     stockQtyTo
//                 };
//             }

//             console.warn(`Base product with currentID ${productData.currentID} not found.`);
//             return productData;
//         });

//         res.status(200).json({
//             ...transfer.toObject(),
//             productsData: updatedProductsData
//         });

//     } catch (error) {
//         console.error('Error finding transfer by ID:', error);
//         res.status(500).json({ message: 'Error fetching transfer', error });
//     }
// };

// const updateTransfer = async (req, res) => {
//     const { id } = req.params;
//     const transferData = req.body;

//     try {
//         // Validate transfer ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ message: 'Invalid transfer ID format' });
//         }

//         // Find the existing transfer
//         const existingTransfer = await Transfer.findById(id);
//         if (!existingTransfer) {
//             return res.status(404).json({ message: 'Transfer not found' });
//         }

//         // Find all affected products
//         const productIds = transferData.productsData.map(p => p.currentID);
//         const products = await Product.find({ _id: { $in: productIds } });

//         // Prepare stock update operations
//         const updatePromises = transferData.productsData.map(async (newProductData) => {
//             const { currentID, quantity, variationValue } = newProductData;
//             const existingProductData = existingTransfer.productsData.find(p => p.currentID === currentID);

//             if (!existingProductData) {
//                 throw new Error(`Existing product data not found for ID: ${currentID}`);
//             }

//             // Calculate quantity difference
//             const quantityDiff = quantity - existingProductData.quantity;

//             // Find product
//             const product = products.find(p => p._id.toString() === currentID);
//             if (!product) {
//                 throw new Error(`Product not found with ID: ${currentID}`);
//             }

//             // Warehouse stock update
//             if (!product.warehouse.has(transferData.warehouseFrom) || !product.warehouse.has(transferData.warehouseTo)) {
//                 throw new Error(`Warehouse data missing for product ID: ${currentID}`);
//             }

//             const warehouseFrom = product.warehouse.get(transferData.warehouseFrom);
//             const warehouseTo = product.warehouse.get(transferData.warehouseTo);

//             if (warehouseFrom.productQty < quantityDiff) {
//                 throw new Error(`Insufficient stock in warehouse ${transferData.warehouseFrom} for product ID: ${currentID}`);
//             }

//             warehouseFrom.productQty -= quantityDiff;
//             warehouseTo.productQty += quantityDiff;

//             // Save product updates
//             await product.save();
//         });

//         await Promise.all(updatePromises);

//         // Update transfer document with new data
//         Object.assign(existingTransfer, transferData);
//         await existingTransfer.save();

//         res.status(200).json({ message: 'Transfer updated successfully', transfer: existingTransfer });
//     } catch (error) {
//         console.error('Error updating transfer:', error);
//         res.status(500).json({ message: 'Error updating transfer', error: error.message });
//     }
// };


// Fetch transfer details by reference Id or Id
const fetchTransferDetails = async (req, res) => {
    const { refferenceId, id } = req.query;

    try {
        console.log('Received query parameters:', req.query);

        // If neither refferenceId nor id is provided, fetch all transfers
        if (!refferenceId && !id) {
            // Handle pagination parameters
            const size = parseInt(req.query.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query.page?.number) || 1; // Default page number is 1
            console.log(`Fetching transfers with size: ${size} and page: ${number}`);

            // Determine if pagination is requested
            const isPaginationRequested = req.query.page !== undefined;

            if (isPaginationRequested) {
                const offset = (number - 1) * size; // Calculate the offset for pagination
                const sort = req.query.sort || ''; // Handle sorting if provided

                  // Handle sorting order (ascending or descending)
                  const sortOrder = {};
                  if(sort.startsWith('-')) {
                      sortOrder[sort.slice(1)] = -1; // Descending order
                  } else if (sort) {
                      sortOrder[sort] = 1; // Ascending order
                  }

                // Fetch transfers with pagination
                const transfers = await Transfer.find()
                    .sort(sort)
                    .skip(offset)
                    .limit(size);

                const totalTransfers = await Transfer.countDocuments(); // Get the total count of transfers

                return res.status(200).json({
                    transfers,
                    totalPages: Math.ceil(totalTransfers / size),
                    currentPage: number,
                    totalTransfers
                });
            } else {
                // Fetch all transfers without pagination
                const transfers = await Transfer.find();
                return res.status(200).json(transfers);
            }
        }

        // Search by reference ID if provided
        if (refferenceId) {
            if (refferenceId.length < 1) {
                return res.status(400).json({ message: 'Please provide at least one character.' });
            }

            const transfers = await Transfer.find({ refferenceId: { $regex: `^${refferenceId}`, $options: 'i' } });
            if (transfers.length === 0) {
                return res.status(404).json({ message: 'No transfer found for this ID' });
            }
            return res.status(200).json(transfers);
        }

        // Fetch a specific transfer by ID if provided for update
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid transfer ID format' });
            }

            const transfer = await Transfer.findById(id);
            if (!transfer) {
                return res.status(404).json({ message: 'Transfer not found' });
            }

            const productIds = transfer.productsData.map(product => product.currentID);
            const products = await Product.find({ _id: { $in: productIds } });

            const updatedProductsData = transfer.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                let stokeQty = "";

                if (baseProduct) {
                    if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
                        const variation = baseProduct.variationValues.get(productData.variationValue);
                        stokeQty = variation ? variation.productQty || "" : "";
                    } else {
                        stokeQty = baseProduct.productQty || "";
                    }
                    return {
                        ...productData,
                        stokeQty
                    };
                }

                console.warn(`Base product with currentID ${productData.currentID} not found.`);
                return productData;
            });

            const transferWithUpdatedProducts = {
                ...transfer.toObject(),
                productsData: updatedProductsData
            };

            return res.status(200).json(transferWithUpdatedProducts);
        }

    } catch (error) {
        console.error('Error fetching transfer details:', error);
        res.status(500).json({ message: 'Error fetching transfer details', error });
    }
};

const searchTransfers = async (req, res) => {
    const { referenceId } = req.query; // Get referenceId from query params

    try {
        if (!referenceId) {
            return res.status(400).json({ 
                status: "error", 
                message: "Reference ID is required for search." 
            });
        }

        // Escape special regex characters in the referenceId to prevent regex injection
        const escapedReferenceId = referenceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by referenceId
        const query = {
            refferenceId: { $regex: new RegExp(`${escapedReferenceId}`, 'i') } // Case-insensitive search for referenceId
        };

        // Fetch transfers based on the query
        const transfers = await Transfer.find(query).populate('productsData.currentID', 'productName productQty'); // Use populate if needed

        if (!transfers || transfers.length === 0) {
            return res.status(404).json({ 
                status: "unsuccess", 
                message: "No transfers found for this reference ID." 
            });
        }

        // Send the full transfer data
        const formattedTransfers = transfers.map((transfer) => {
            const transferObj = transfer.toObject();
            
            // Add or modify additional fields if needed
            return {
                _id: transferObj._id,
                refferenceId: transferObj.refferenceId,
                warehouseFrom: transferObj.warehouseFrom,
                warehouseTo: transferObj.warehouseTo,
                grandTotal: transferObj.grandTotal,
                orderStatus: transferObj.orderStatus,
                date: transferObj.date,
                discount: transferObj.discount,
                discountType: transferObj.discountType,
                shipping: transferObj.shipping,
                tax: transferObj.tax,
                productsData: transferObj.productsData, // Include product details
                createdAt: transferObj.createdAt 
                    ? transferObj.createdAt.toISOString().slice(0, 10) 
                    : null,
            };
        });

        return res.status(200).json({ 
            status: "success", 
            transfers: formattedTransfers 
        });
    } catch (error) {
        console.error("Search transfers error:", error);
        return res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
};


module.exports = { createTransfer, getTransfer, deleteTransfer, findTransferById, findTransferByIdForUpdate, updateTransfer, fetchTransferDetails, searchTransfers };
