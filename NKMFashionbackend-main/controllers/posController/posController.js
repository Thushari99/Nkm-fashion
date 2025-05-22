const HeldProducts = require('../../models/posModel/holdProductModel');
const Product = require('../../models/products/product');
const { ObjectId } = require('mongodb');
const Cash = require('../../models/posModel/cashModel');
const User = require('../../models/userModel');
const Permissions = require('../../models/rolesPermissionModel');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const ZReading = require('../../models/zBillRecord');
const mongoose = require('mongoose');
const { log } = require('console');

// Create registry
const cashHandIn = async (req, res) => {
    const { cashAmount, username, name, openTime,
        oneRupee, twoRupee, fiveRupee, tenRupee, twentyRupee, fiftyRupee, hundredRupee, fiveHundredRupee, thousandRupee, fiveThousandRupee } = req.body;
    try {
        const existingUser = await Cash.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                status: 'fail',
                message: 'Username already exists. Please use a different username.'
            });
        }
        const currentCash = await Cash.findOne();

        if (currentCash) {
            currentCash.totalBalance += cashAmount;
            currentCash.cashHandIn = cashAmount; // Keep track of the total cash added
            await currentCash.save();
            return res.status(200).json({ message: 'Cash updated successfully', cash: currentCash });
        } else {
            const newCash = new Cash({
                username,
                name,
                openTime,
                cashHandIn: cashAmount,
                totalBalance: cashAmount,
                oneRupee, twoRupee, fiveRupee, tenRupee, twentyRupee, fiftyRupee, hundredRupee, fiveHundredRupee, thousandRupee, fiveThousandRupee
            });
            await newCash.save();
            return res.status(201).json({ message: 'New cash record created successfully', cash: newCash });
        }
    } catch (error) {
        console.error('Error updating cash:', error);
        // Structured error response
        return res.status(500).json({
            message: 'An error occurred while updating cash.',
            error: error.message,
        });
    }
};

//Close registry
const closeRegister = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRegister = await Cash.findByIdAndDelete(id);
        if (!deletedRegister) {
            return res.status(404).json({ status: "Not Found", message: "Registry not found" });
        }
        res.json({ status: "Success", message: "Registry deleted" });
    } catch (error) {
        console.error('Error deleting registry:', error);
        // Structured error response
        return res.status(500).json({
            message: 'An error occurred while deleting cash registry.',
            error: error.message,
        });
    }
}

const findAllProductsForPos = async (req, res) => {
    try {
        const products = await Product.find();
        if (!products.length) {
            return res.status(404).json({ status: 'No products found' });
        }
        // Map through products to format variationValues and other fields
        const Allproduct = products.map(product => {
            const productObj = product.toObject();

            // Format the createdAt date to YYYY-MM-DD
            const formattedCreatedAt = productObj.createdAt.toISOString().slice(0, 10);

            // Convert variationValues Map to a regular object
            const formattedVariationValues = {};
            if (productObj.variationValues) {
                productObj.variationValues.forEach((value, key) => {
                    formattedVariationValues[key] = value;
                });
            }

            // Convert image to base64 data URL if it exists
            let imageUrl = null;
            if (productObj.image) {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/product/${path.basename(productObj.image)}`;
            }
            return {
                _id: productObj._id,
                name: productObj.name,
                code: productObj.code,
                brand: productObj.brand,
                category: productObj.category,
                barcode: productObj.barcode,
                unit: productObj.unit,
                saleUnit: productObj.saleUnit,
                purchase: productObj.purchase,
                ptype: productObj.ptype,
                status: productObj.status,
                quantityLimit: productObj.quantityLimit,
                suplier: productObj.suplier,
                warehouse: productObj.warehouse,
                variation: productObj.variation,
                variationType: productObj.variationType,
                variationValues: formattedVariationValues,
                note: productObj.note,
                productCost: productObj.productCost,
                productPrice: productObj.productPrice,
                productQty: productObj.productQty,
                oderTax: productObj.oderTax,
                taxType: productObj.taxType,
                stockAlert: productObj.stockAlert,
                image: imageUrl,  // Use the base64 encoded image here
                createdAt: formattedCreatedAt
            };
        });

        // Return the formatted products in the response
        return res.status(200).json({ status: 'Products fetched successfully', products: Allproduct });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ status: 'Error fetching products', error: error.message });
    }
};

// Find product by a keyword
const findProductByKeyword = async (req, res) => {
    const { keyword } = req.query; // Extract keyword from query params
    try {
        // Infer searchType based on keyword format
        let searchType;
        if (/^\d+$/.test(keyword)) {
            // If keyword is numeric, assume it's a code
            searchType = 'code';
        } else if (keyword.length > 0) {
            // Otherwise, assume it's a name (if it's not empty)
            searchType = 'name';
        } else {
            return res.status(400).json({ status: 'Bad Request', message: 'Invalid keyword' });
        }

        let product;
        if (searchType === 'code') {
            // Search by product code
            product = await Product.findOne({ code: keyword });
        } else if (searchType === 'name') {
            // Search by product name
            product = await Product.findOne({ name: keyword });
        }

        if (!product) {
            return res.status(404).json({ status: 'Not Found', message: 'Product not found' });
        }

        const productObj = product.toObject();

        // Format the createdAt date to YYYY-MM-DD
        const formattedCreatedAt = productObj.createdAt.toISOString().slice(0, 10);

        // Convert variationValues Map to a regular object
        const formattedVariationValues = {};
        if (productObj.variationValues) {
            productObj.variationValues.forEach((value, key) => {
                formattedVariationValues[key] = value;
            });
        }

        // Convert image to base64 data URL if it exists
        let imageUrl = null;
        if (productObj.image) {
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/product/${path.basename(productObj.image)}`;
        }
        res.json({
            status: "Success",
            product: {
                _id: productObj._id,
                name: productObj.name,
                code: productObj.code,
                brand: productObj.brand,
                category: productObj.category,
                barcode: productObj.barcode,
                unit: productObj.unit,
                saleUnit: productObj.saleUnit,
                purchase: productObj.purchase,
                ptype: productObj.ptype,
                status: productObj.status,
                quantityLimit: productObj.quantityLimit,
                suplier: productObj.suplier,
                warehouse: productObj.warehouse,
                variation: productObj.variation,
                variationType: productObj.variationType,
                variationValues: formattedVariationValues,
                note: productObj.note,
                productCost: productObj.productCost,
                productPrice: productObj.productPrice,
                productQty: productObj.productQty,
                oderTax: productObj.oderTax,
                taxType: productObj.taxType,
                stockAlert: productObj.stockAlert,
                image: imageUrl,  // Include the base64 encoded image
                createdAt: formattedCreatedAt
            }
        });
    } catch (err) {
        res.status(500).json({ status: "Error", error: err.message });
        console.error("Error finding product:", err);
    }
};

const generateReferenceNo = async (req, res) => {
    try {
        let referenceNo;
        let isUnique = false;

        while (!isUnique) {
            referenceNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
            const existingRef = await HeldProducts.findOne({ referenceNo });
            if (!existingRef) {
                isUnique = true;
            }
        }
        res.status(200).json({ referenceNo });
    } catch (error) {
        console.error('Error generating reference number:', error);
        res.status(500).json({ message: 'Error generating reference number', error: error.message });
    }
};



// Held products
const holdProducts = async (req, res) => {
    const { referenceNo, products } = req.body; // Extracting data from the request body

    // Validate the input
    if (!referenceNo || !Array.isArray(products)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }
    try {
        // Create a new instance of the HeldProducts model
        const heldProducts = new HeldProducts({ referenceNo, products });

        // Save the data to the database
        await heldProducts.save();

        // Respond with the saved data
        res.status(201).json({ message: 'Products held successfully', data: heldProducts });
    } catch (error) {
        console.error('Error holding products:', error);
        // Structured error response
        return res.status(500).json({
            message: 'An error occurred while holding products.',
            error: error.message,
        });
    }
};


// Get all held products
const viewAllHeldProducts = async (req, res) => {
    try {
        const heldProducts = await HeldProducts.find();

        if (!heldProducts || heldProducts.length === 0) {
            return res.status(404).json({ message: 'No held products found' });
        }

        const currentIds = heldProducts.flatMap(heldProduct =>
            heldProduct.products.map(product => product.currentID)
        );
        const baseProducts = await Product.find({ _id: { $in: currentIds } });

        // Create a map for quick lookup of base product details by currentID and warehouse
        const baseProductMap = baseProducts.reduce((acc, product) => {
            acc[product._id.toString()] = product.warehouse;
            return acc;
        }, {});

        const combinedData = heldProducts.map(heldProduct => ({
            _id: heldProduct._id,
            referenceNo: heldProduct.referenceNo,
            products: heldProduct.products.map(product => {
                const warehouseDetails = baseProductMap[product.currentID] ? baseProductMap[product.currentID].get(product.warehouse) : {};
                let stokeQty = warehouseDetails ? warehouseDetails.productQty : 0;
                let price = warehouseDetails ? warehouseDetails.productPrice : 0;
                let variationValues = warehouseDetails ? warehouseDetails.variationValues : {};

                if (product.variation && variationValues) {
                    const variationDetails = variationValues.get(product.variation);
                    if (variationDetails) {
                        stokeQty = variationDetails.productQty || 0;
                        price = variationDetails.productPrice || 0;
                    }
                }

                return {
                    id: product._id, // Use the ID from the held product
                    currentID: product.currentID,
                    name: product.name || '',
                    variation: product.variation || '',
                    ptype: product.ptype,
                    tax: product.tax,
                    stokeQty,
                    price,
                    purchaseQty: product.qty || 0,
                    discount: product.discount || 0,
                    warehouse: product.warehouse,
                    variationValues,
                    subTotal: price * (product.qty || 0),
                };
            }),
        }));

        console.log(combinedData);

        res.status(200).json({
            message: 'Held products retrieved successfully',
            data: combinedData,
        });
    } catch (error) {
        console.error('Error retrieving held products:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a held product
const deleteHeldProduct = async (req, res) => {
    const { id } = req.params;

    // Validate the id parameter
    if (!id || id === "undefined") {
        return res.status(400).json({ message: 'Invalid product ID provided' });
    }

    // Validate ObjectId format
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
    if (!isValidObjectId) {
        return res.status(400).json({ message: 'Invalid product ID format' });
    }

    try {
        // Find and delete the held product by ID
        const deletedProduct = await HeldProducts.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Held product not found' });
        }

        // Respond with success
        res.status(200).json({ message: 'Held product deleted successfully' });
    } catch (error) {
        console.error('Error deleting held product:', error);
        return res.status(500).json({
            message: 'An error occurred while deleting held product.',
            error: error.message,
        });
    }
};


// Get products by ID
const getProductsByIds = async (req, res) => {
    const { ids } = req.body;
    try {
        const products = await Product.find({ _id: { $in: ids } });

        if (!products.length) {
            return res.status(404).json({ status: 'No products found for these IDs' });
        }
        const productsData = products.map(product => {
            const productObj = product.toObject();
            const formattedCreatedAt = productObj.createdAt ? productObj.createdAt.toISOString().slice(0, 10) : null;

            const formattedVariationValues = {};
            if (productObj.variationValues) {
                productObj.variationValues.forEach((value, key) => {
                    formattedVariationValues[key] = value;
                });
            }
            let imageUrl = null;
            if (productObj.image) {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/product/${path.basename(productObj.image)}`;
            }
            return {
                _id: productObj._id,
                name: productObj.name,
                code: productObj.code,
                quantity: productObj.productQty,
                variationValues: formattedVariationValues,
                image: imageUrl,
                createdAt: formattedCreatedAt
            };
        });
        return res.status(200).json({ status: 'Products fetched successfully', products: productsData });
    } catch (error) {
        console.error('Error fetching products by IDs:', error);
        return res.status(500).json({ status: 'Error fetching products by IDs', error: error.message });
    }
};

// Update product quantities
const updateProductQuantities = async (req, res) => {
    const productDetails = req.body.products;

    try {
        // Check if products is a valid array
        if (!Array.isArray(productDetails) || productDetails.length === 0) {
            return res.status(400).json({ status: 'Error', message: 'Invalid or empty products array' });
        }

        // Prepare update promises
        const updatePromises = productDetails.map(async (product) => {
            const { curruntID, qty, ptype, variationValue } = product; // Destructure the incoming data

            // Validate the current ID
            if (!ObjectId.isValid(curruntID)) {
                throw new Error(`Invalid product ID: ${curruntID}`);
            }

            // Check for valid quantity
            if (typeof qty !== 'number' || qty < 0) {
                throw new Error(`Invalid quantity for product with ID: ${curruntID}`);
            }

            // Update logic based on product type
            if (ptype === 'Single') {
                // For Single products, reduce productQty by the purchasing quantity
                const updatedProduct = await Product.findById(curruntID);
                if (!updatedProduct) {
                    throw new Error(`Product not found with ID: ${curruntID}`);
                }

                // Reduce the stock quantity
                if (updatedProduct.productQty < qty) {
                    return res.status(400).json({ error: `Insufficient stock for product with ID: ${curruntID}` });
                    //throw new Error(`Insufficient stock for product with ID: ${curruntID}`);
                }

                updatedProduct.productQty -= qty; // Deduct the purchasing quantity from stock
                await updatedProduct.save(); // Save the changes to the product
                return updatedProduct; // Return updated single product
            } else if (ptype === 'Variation' && variationValue) {
                // For Variation products, update the quantity in variationValues
                const updatedProduct = await Product.findById(curruntID);
                if (!updatedProduct) {
                    //throw new Error(`Product not found with ID: ${curruntID}`);
                    return res.status(404).json({ error: `Product not found with ID: ${curruntID}` });
                }

                // Check if the specified variation exists
                const variationKey = variationValue; // e.g., 'M', 'XL'
                const variation = updatedProduct.variationValues.get(variationKey);

                if (!variation) {
                    throw new Error(`Variation ${variationKey} not found for product with ID: ${curruntID}`);
                }

                // Update the productQty in the variation
                variation.productQty -= qty; // Subtract the quantity purchased
                if (variation.productQty < 0) {
                    return res.status(400).json({ error: `Insufficient stock for product with ID: ${curruntID}` });
                    //throw new Error(`Insufficient stock for variation ${variationKey} of product with ID: ${curruntID}`);
                }

                // Save the updated product with updated variation
                await updatedProduct.save(); // Save the changes made to the variations
                return updatedProduct; // Return updated variation product
            } else {
                throw new Error(`Invalid product type or variation value for product with ID: ${curruntID}`);
            }
        });

        await Promise.all(updatePromises); // Wait for all updates to complete

        res.status(200).json({ status: 'Success', message: 'Product quantities updated successfully' });
    } catch (error) {
        console.error('Error updating product quantities:', error);
        // Structured error response
        return res.status(500).json({
            message: 'An error occurred while updating product quantities.',
            error: error.message,
        });
    }
};


const findProducts = async (req, res) => {
    try {
        const { warehouse, brand, category, keyword } = req.query; // Extract filters from query params

        // Build the query object based on provided filters
        const query = {};
        if (warehouse) {
            query[`warehouse.${warehouse}`] = { $exists: true }; // Correct way to filter warehouse
        }
        if (brand) query.brand = brand;
        if (category) query.category = category;
        if (keyword) {
            // Escape special characters in keyword for regex
            const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const normalizedKeyword = escapeRegExp(keyword.trim());

            // Check if the keyword matches a name or code
            query.$or = [
                { name: new RegExp(normalizedKeyword, 'i') }, // Partial case-insensitive match for name
                { code: normalizedKeyword },                 // Exact match for code
            ];
        }

        // Fetch products based on the query
        const products = await Product.find(query).lean(); // Use .lean() to get plain objects

        if (!products.length) {
            return res.status(404).json({ status: 'No products found for the specified criteria' });
        }

        // Format the products
        const formattedProducts = products.map((product) => {
            const productObj = { ...product };

            // Format the createdAt date to YYYY-MM-DD
            productObj.createdAt = productObj.createdAt ? productObj.createdAt.toISOString().slice(0, 10) : null;

            // Ensure warehouse information is correctly included
            if (productObj.warehouse && typeof productObj.warehouse === 'object') {
                Object.keys(productObj.warehouse).forEach((warehouseName) => {
                    const warehouseData = productObj.warehouse[warehouseName];

                    // Convert variationValues (if present) from Map to Object
                    if (warehouseData.variationValues instanceof Map) {
                        const formattedVariationValues = {};
                        warehouseData.variationValues.forEach((value, key) => {
                            formattedVariationValues[key] = value;
                        });
                        warehouseData.variationValues = formattedVariationValues;
                    }
                });
            }

            // Convert image to proper URL if it exists
            productObj.image = productObj.image
                ? `${req.protocol}://${req.get('host')}/uploads/product/${path.basename(productObj.image)}`
                : null;

            return productObj;
        });

        return res.status(200).json({ status: 'Products fetched successfully', products: formattedProducts });

    } catch (error) {
        console.error('Error finding products:', error);
        return res.status(500).json({
            message: 'An error occurred while finding products.',
            error: error.message,
        });
    }
};


const getAdminPasswordForDiscount = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }
    try {
        // Fetch user by username
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send('Invalid password.');
        }

        // Fetch user role and corresponding permissions
        const rolePermissions = await Permissions.findOne({ roleName: user.role });
        if (!rolePermissions) {
            return res.status(404).send('Role permissions not found.');
        }

        const permissions = rolePermissions.permissions;
        console.log('Permissions:', permissions); // Enhanced logging

        if (!permissions || !(permissions instanceof Map)) {
            console.error('Permissions are not a Map:', permissions);
            return res.status(500).send('Server error. Please try again later.');
        }

        const manageOffers = permissions.get('manageOffers');
        console.log('Manage Offers:', manageOffers); // Enhanced logging

        if (manageOffers && manageOffers.assign_offer) {
            console.log('Assign Offer:', manageOffers.assign_offer); // Enhanced logging
            return res.status(200).send({ status: 'success' });
        } else {
            return res.status(403).send('Insufficient permissions.');
        }
    } catch (error) {
        console.error('Error in getAdminPasswordForDiscount:', error);
        res.status(500).send('Server error. Please try again later.');
    }
};

const saveZReading = async (req, res) => {
    try {
        const { cardPaymentAmount, cashPaymentAmount, bankTransferPaymentAmount, totalDiscountAmount, inputs, registerData, cashVariance } = req.body;

        // Validate required arrays
        if (!Array.isArray(inputs) || !Array.isArray(registerData)) {
            return res.status(400).json({
                success: false,
                message: 'Inputs and registerData must be arrays'
            });
        }

        const newZReading = new ZReading({
            cardPaymentAmount: cardPaymentAmount || 0,
            cashPaymentAmount: cashPaymentAmount || 0,
            bankTransferPaymentAmount: bankTransferPaymentAmount || 0,
            totalDiscountAmount: totalDiscountAmount || 0,
            inputs: inputs.map(input => ({
                denomination: input.denomination,
                quantity: input.quantity,
                amount: input.amount
            })),
            registerData: registerData[0] || {},
            cashVariance: cashVariance || 0
        });

        const savedZReading = await newZReading.save();

        res.status(201).json({
            success: true,
            data: savedZReading,
            message: 'Z-reading saved successfully'
        });

    } catch (error) {
        console.error('Error saving Z-reading:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const getAllZReadingDetails = async (req, res) => {
    try {
        console.log("Received query parameters:", req.query);

        // Extract page and size from nested object
        const page = parseInt(req.query.page?.number, 10) || 1;
        const size = parseInt(req.query.page?.size, 10) || 10;

        console.log(`Parsed values -> Page: ${page}, Size: ${size}`);

        const offset = (page - 1) * size;

        // Fetch paginated data
        const zReadingDetails = await ZReading.find().skip(offset).limit(size);
        const totalZReadings = await ZReading.countDocuments();

        console.log(`Total Records: ${totalZReadings}, Records Returned: ${zReadingDetails.length}`);

        if (!zReadingDetails.length) {
            return res.status(404).json({
                success: false,
                message: 'No Z-readings found'
            });
        }

        res.status(200).json({
            success: true,
            data: zReadingDetails,
            currentPage: page,
            totalPages: Math.ceil(totalZReadings / size),
            totalItems: totalZReadings,
            message: 'Z-reading details retrieved successfully'
        });

    } catch (error) {
        console.error('Error retrieving Z-reading details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


const getAllZReadingByDate = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date parameter is required"
            });
        }

        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const query = {
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        };

        const zReadingDetails = await ZReading.find(query);

        if (!zReadingDetails.length) {
            return res.status(404).json({
                success: false,
                message: 'No Z-readings found'
            });
        }

        res.status(200).json({
            success: true,
            data: zReadingDetails,
            message: 'Z-reading details retrieved successfully'
        });

    } catch (error) {
        console.error('Error retrieving Z-reading details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const deleteZReading = async (req, res) => {
    try {
        const { id } = req.params;

        const zReading = await ZReading.findByIdAndDelete(id);

        if (!zReading) {
            return res.status(404).json({
                success: false,
                message: 'Z-reading not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Z-reading deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting Z-reading:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = { cashHandIn, saveZReading, getAllZReadingDetails, getAllZReadingByDate, deleteZReading, closeRegister, getAdminPasswordForDiscount, findProductByKeyword, generateReferenceNo, holdProducts, viewAllHeldProducts, deleteHeldProduct, getProductsByIds, updateProductQuantities, findProducts, findAllProductsForPos };

