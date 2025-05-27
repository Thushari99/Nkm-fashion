const Product = require('../../models/products/product');
const Purchase = require('../../models/purchaseModel');
const PurchaseReturn = require('../../models/purchaseReturnModel');
const Sale = require('../../models/saleModel');
const SaleReturn = require('../../models/saleReturnModel');
const path = require('path');
const fs = require('fs');

const findAllStoke = async (req, res) => {
    const { warehouse } = req.params;
    console.log("Requested warehouse:", warehouse);

    try {
        // Fetch all products if warehouse is 'all', otherwise filter dynamically
        const warehouseFilter = warehouse === 'all' ? {} : { [`warehouse.${warehouse}`]: { $exists: true } };

        const products = await Product.find(warehouseFilter);

        if (!products.length) {
            return res.status(404).json({ status: 'No products found', products: [] });
        }

        const allProducts = [];

        products.forEach(product => {
            const productObj = product.toObject();
            const formattedCreatedAt = productObj.createdAt.toISOString().slice(0, 10);

            let imageUrl = null;
            if (productObj.image) {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/product/${path.basename(productObj.image)}`;
            }

            console.log(`Processing product: ${productObj.name}`);
            console.log(`Available warehouses:`, productObj.warehouse);

            // If warehouse is 'all', iterate over all warehouses
            if (warehouse === 'all') {
                productObj.warehouse.forEach((warehouseDetails, warehouseName) => {
                    processWarehouseData(warehouseName, warehouseDetails, productObj, formattedCreatedAt, imageUrl, allProducts);
                });
            } else {
                const warehouseDetails = productObj.warehouse.get(warehouse);
                if (warehouseDetails) {
                    processWarehouseData(warehouse, warehouseDetails, productObj, formattedCreatedAt, imageUrl, allProducts);
                }
            }
        });

        return res.status(200).json({ status: 'Products fetched successfully', products: allProducts });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ status: 'Error fetching products', error: error.message });
    }
};

// Helper function to process warehouse data
const processWarehouseData = (warehouseName, warehouseDetails, productObj, formattedCreatedAt, imageUrl, allProducts) => {
    if (!warehouseDetails) return;

    if (warehouseDetails.variationValues && warehouseDetails.variationValues.size > 0) {
        warehouseDetails.variationValues.forEach((value, key) => {
            allProducts.push({
                ...productObj,
                _id: `${productObj._id}-${warehouseName}-${key}`,
                name: `${productObj.name} - ${key}`,
                warehouseName,
                variationValue: key,
                variationDetails: value,
                productCost: value.productCost,
                productPrice: value.productPrice,
                productQty: value.productQty,
                orderTax: value.orderTax,
                stockAlert: value.stockAlert,
                image: imageUrl,
                createdAt: formattedCreatedAt
            });
        });
    } else {
        allProducts.push({
            ...productObj,
            _id: `${productObj._id}-${warehouseName}`,
            warehouseName,
            productCost: warehouseDetails.productCost,
            productPrice: warehouseDetails.productPrice,
            productQty: warehouseDetails.productQty,
            orderTax: warehouseDetails.orderTax,
            stockAlert: warehouseDetails.stockAlert,
            image: imageUrl,
            createdAt: formattedCreatedAt
        });
    }
};


const findStokeReportByCode = async (req, res) => {
    const { name, warehouse } = req.query;

    try {
        if (!name) {
            return res.status(400).json({ status: 'No search keyword provided', products: [] });
        }

        // Regex for partial match
        const searchRegex = new RegExp(name, 'i');
        // Build base query
        const baseQuery = {
            $or: [
                { code: searchRegex },
                { name: searchRegex }
            ]
        };

        // Fetch products
        const products = await Product.find(baseQuery);

        if (!products.length) {
            return res.status(404).json({ status: 'No products found for this search term', products: [] });
        }

        // Prepare results
        const searchResults = [];
        products.forEach(product => {
            const productObj = product.toObject();
            let imageUrl = null;
            if (productObj.image) {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/product/${path.basename(productObj.image)}`;
            }

            // Filter warehouses if warehouse param is set
            const warehousesToProcess = [];
            if (warehouse && warehouse !== 'all') {
                const whDetails = productObj.warehouse.get(warehouse);
                if (whDetails) warehousesToProcess.push([warehouse, whDetails]);
            } else {
                productObj.warehouse.forEach((whDetails, whName) => {
                    warehousesToProcess.push([whName, whDetails]);
                });
            }

            warehousesToProcess.forEach(([warehouseName, warehouseDetails]) => {
                if (warehouseDetails.variationValues && warehouseDetails.variationValues.size > 0) {
                    warehouseDetails.variationValues.forEach((value, key) => {
                        searchResults.push({
                            ...productObj,
                            _id: `${productObj._id}_${key}`,
                            name: `${productObj.name} - ${key}`,
                            warehouseName,
                            variationValue: key,
                            variationDetails: value,
                            productCost: value.productCost,
                            productPrice: value.productPrice,
                            productQty: value.productQty,
                            orderTax: value.orderTax,
                            stockAlert: value.stockAlert,
                            image: imageUrl,
                            createdAt: productObj.createdAt.toISOString().slice(0, 10)
                        });
                    });
                } else {
                    searchResults.push({
                        ...productObj,
                        _id: productObj._id,
                        warehouseName,
                        productCost: warehouseDetails.productCost,
                        productPrice: warehouseDetails.productPrice,
                        productQty: warehouseDetails.productQty,
                        orderTax: warehouseDetails.orderTax,
                        stockAlert: warehouseDetails.stockAlert,
                        image: imageUrl,
                        createdAt: productObj.createdAt.toISOString().slice(0, 10)
                    });
                }
            });
        });

        return res.status(200).json({
            status: searchResults.length > 0 ? 'Products found' : 'No products found',
            products: searchResults
        });
    } catch (error) {
        console.error('Error searching products:', error);
        return res.status(500).json({ status: 'Error searching products', products: [], error: error.message });
    }
};


const findProductDetailsById = async (req, res) => {
    const { id } = req.params; // Format: "productId-WarehouseName" or "productId-WarehouseName-VariationValue"
    
    try {
        // Split the ID into components
        const parts = id.split('-');
        const productId = parts[0];
        const warehouseName = parts[1];
        const variationValue = parts[2]; // Will be undefined for single products

        // First fetch the product to check its type
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Create base query
        const productQuery = {
            'productsData.currentID': productId,
            'productsData.warehouse': warehouseName
        };

        // Only add variation filter if product is variation type AND variation exists in URL
        if (product.ptype === 'Variation' && variationValue) {
            productQuery['productsData.variationValue'] = variationValue;
        }

        // Fetch all transactions containing this product
        const [sales, saleReturns, purchases, purchaseReturns] = await Promise.all([
            Sale.find(productQuery),
            SaleReturn.find(productQuery),
            Purchase.find(productQuery),
            PurchaseReturn.find(productQuery)
        ]);

        // Filter function to clean up productsData
        const filterProductsInTransactions = (transactions) => {
            return transactions.map(transaction => ({
                ...transaction.toObject(),
                productsData: transaction.productsData.filter(product => {
                    // Match product ID and warehouse
                    if (product.currentID !== productId || product.warehouse !== warehouseName) {
                        return false;
                    }
                    // For variation products, match variation value if specified
                    if (product.ptype === 'Variation' && variationValue) {
                        return product.variationValue === variationValue;
                    }
                    // For single products, don't check variation
                    return true;
                })
            }));
        };

        res.status(200).json({
            message: 'Report data fetched successfully',
            data: {
                sales: filterProductsInTransactions(sales),
                saleReturns: filterProductsInTransactions(saleReturns),
                purchases: filterProductsInTransactions(purchases),
                purchaseReturns: filterProductsInTransactions(purchaseReturns)
            }
        });

    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ message: 'Failed to fetch report data', error });
    }
};

module.exports = { findAllStoke, findStokeReportByCode, findProductDetailsById };
