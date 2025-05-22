const mongoose = require('mongoose');
const SaleReturn = require('../../models/saleReturnModel');
const Product = require('../../models/products/product');
const PurchaseReturn = require('../../models/purchaseReturnModel');
const Settings = require('../../models/settingsModel');
const generateReferenceId = require('../../utils/generateReferenceID');

const fetchSaleReturnProducts = async (req, res) => {
    const { id, keyword } = req.query;
    const supplier = req.params.supplier;

    try {
        let saleReturns;
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid sale return ID format' });
            }

            const saleReturn = await SaleReturn.findById(id);
            if (!saleReturn) {
                return res.status(404).json({ message: 'Sale return not found' });
            }

            const productIds = saleReturn.productsData.map(product => product.currentID);
            const products = await Product.find({ _id: { $in: productIds }, ...(supplier !== 'all' && { supplier }) });
            const filteredProductsData = saleReturn.productsData.filter(productData => {
                if (productData.restocking) return false;

                const baseProduct = products.find(product => product._id.toString() === productData.currentID);
                if (!baseProduct) return false;

                const warehouse = productData.warehouse;

                let productCost = baseProduct.productCost;
                let currentID = baseProduct._id;
                let ptype = baseProduct.ptype;
                let taxRate = baseProduct.orderTax;

                const warehouseData = baseProduct.warehouse.get(warehouse);
                if (warehouseData) {
                    if (warehouseData.variationValues && warehouseData.variationValues.size > 0) {
                        const variation = warehouseData.variationValues.get(productData.variationValue);
                        if (variation) {
                            productCost = variation.productCost;
                            taxRate = variation.orderTax;
                        }
                    } else {
                        productCost = warehouseData.productCost;
                        taxRate = warehouseData.orderTax;
                    }
                }

                productData.productCost = productCost;
                productData.currentID = currentID;
                productData.ptype = ptype;
                productData.taxRate = taxRate;
                return true;
            }).map(productData => {
                return {
                    currentID: productData.currentID,
                    ptype: productData.ptype,
                    name: productData.name,
                    returnQty: productData.returnQty,
                    variationValue: productData.variationValue || 'No variations',
                    productCost: productData.productCost,
                    taxRate: productData.taxRate,
                    warehouse: productData.warehouse
                };
            });

            const aggregatedProductsData = aggregateProducts(filteredProductsData);
            return res.status(200).json({ productsData: aggregatedProductsData });
        }

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

            const allProductsData = [];

            for (const saleReturn of saleReturns) {
                const productIds = saleReturn.productsData.map(product => product.currentID);
                const products = await Product.find({ _id: { $in: productIds }, ...(supplier !== 'all' && { supplier }) });

                const filteredProductsData = saleReturn.productsData.filter(productData => {
                    if (productData.restocking) return false;

                    const baseProduct = products.find(product => product._id.toString() === productData.currentID);
                    if (!baseProduct) return false;

                    const warehouse = productData.warehouse;
                    let productCost = baseProduct.productCost;
                    let currentID = baseProduct._id;
                    let ptype = baseProduct.ptype;
                    let taxRate = baseProduct.orderTax;

                    const warehouseData = baseProduct.warehouse.get(warehouse);
                    if (warehouseData) {
                        if (warehouseData.variationValues && warehouseData.variationValues.size > 0) {
                            const variation = warehouseData.variationValues.get(productData.variationValue);
                            if (variation) {
                                productCost = variation.productCost;
                                taxRate = variation.orderTax;
                            }
                        } else {
                            productCost = warehouseData.productCost;
                            taxRate = warehouseData.orderTax;
                        }
                    }

                    productData.productCost = productCost;
                    productData.taxRate = taxRate;
                    productData.currentID = currentID;
                    productData.ptype = ptype;

                    return true;
                }).map(productData => {
                    return {
                        currentID: productData.currentID,
                        ptype: productData.ptype,
                        taxRate: productData.taxRate,
                        name: productData.name,
                        returnQty: productData.returnQty,
                        variationValue: productData.variationValue || 'No variations',
                        productCost: productData.productCost,
                        warehouse: productData.warehouse
                    };
                });

                allProductsData.push(...filteredProductsData);
            }

            const aggregatedProductsData = aggregateProducts(allProductsData);
            return res.status(200).json({ productsData: aggregatedProductsData });
        }

        saleReturns = await SaleReturn.find();
        if (!saleReturns || saleReturns.length === 0) {
            return res.status(404).json({ message: 'No sale returns found.' });
        }

        const allProductsData = [];

        for (const saleReturn of saleReturns) {
            const productIds = saleReturn.productsData.map(product => product.currentID);
            const products = await Product.find({ _id: { $in: productIds }, ...(supplier !== 'all' && { supplier }) });

            const filteredProductsData = saleReturn.productsData.filter(productData => {
                if (productData.restocking) return false;

                const baseProduct = products.find(product => product._id.toString() === productData.currentID);
                if (!baseProduct) return false;

                const warehouse = productData.warehouse;
                let productCost = baseProduct.productCost;
                let currentID = baseProduct._id;
                let ptype = baseProduct.ptype;
                let taxRate = baseProduct.orderTax;

                const warehouseData = baseProduct.warehouse.get(warehouse);
                if (warehouseData) {
                    if (warehouseData.variationValues && warehouseData.variationValues.size > 0) {
                        const variation = warehouseData.variationValues.get(productData.variationValue);
                        if (variation) {
                            productCost = variation.productCost;
                            taxRate = variation.orderTax;
                        }
                    } else {
                        productCost = warehouseData.productCost;
                        taxRate = warehouseData.orderTax;
                    }
                }

                productData.productCost = productCost;
                productData.taxRate = taxRate;
                productData.currentID = currentID;
                productData.ptype = ptype;

                return true;
            }).map(productData => {
                return {
                    name: productData.name,
                    returnQty: productData.returnQty,
                    variationValue: productData.variationValue || 'No variations',
                    productCost: productData.productCost,
                    taxRate: productData.taxRate,
                    currentID: productData.currentID,
                    ptype: productData.ptype,
                    warehouse: productData.warehouse
                };
            });

            allProductsData.push(...filteredProductsData);
        }

        const aggregatedProductsData = aggregateProducts(allProductsData);

        res.status(200).json({ productsData: aggregatedProductsData });

    } catch (error) {
        console.error('Error fetching sale returns:', error);
        res.status(500).json({ message: 'Error fetching sale returns', error: error.message });
    }
};

// Helper function to aggregate products
const aggregateProducts = (products) => {
    const aggregated = {};

    products.forEach(product => {
        const key = `${product.currentID}-${product.variationValue}`;
        if (aggregated[key]) {
            aggregated[key].returnQty += product.returnQty;
        } else {
            aggregated[key] = { ...product };
        }
    });

    return Object.values(aggregated);
};

const sendPurchaseReturnToSupplier = async (req, res) => {
    const { warehouse, grandTotal, paidAmount, supplier, date, note, productsData } = req.body;

    if (!productsData) {
        return res.status(400).json({ message: 'selectedProduct is required' });
    }
    const referenceId = await generateReferenceId('PURCHASE_RETURN');
    const refferenceId = referenceId;
    const returnType = 'customer';

    const commonPurchaseData = {
        refferenceId,
        note,
        date,
        supplier,
        grandTotal,
        paidAmount,
        warehouse,
        returnType
    };

    const products = productsData.map(product => {
        const { warehouse = '', variationValue = '', price = 0, quantity = 0, subtotal = 0, name = 'Unknown', currentID = '', taxRate = 0, ptype = '' } = product;
        return {
            currentID,
            taxRate,
            ptype,
            variationValue: variationValue || 'No variations',
            name,
            price: price,
            quantity: quantity,
            subtotal,
            warehouse: warehouse
        };
    });

    const finalPurchaseData = {
        ...commonPurchaseData,
        productsData: products,
    };

    try {
        const purchaseReturn = new PurchaseReturn(finalPurchaseData);
        const savedPurchaseReturn = await purchaseReturn.save();

        await Promise.all(products.map(async (product) => {
            const { currentID, variationValue, quantity } = product;
            const saleReturn = await SaleReturn.findOneAndUpdate(
                { "productsData.currentID": currentID, "productsData.variationValue": variationValue },
                { $inc: { "productsData.$.returnQty": -quantity } },
                { new: true, runValidators: true }
            );

            if (!saleReturn) {
                console.error(`SaleReturn not found for currentID: ${currentID}, variationValue: ${variationValue}`);
            }
        }));

        res.status(201).json({ message: 'Purchase returned successfully!', data: savedPurchaseReturn });
    } catch (error) {
        console.error('Error saving purchase return:', error);
        res.status(500).json({ message: 'Failed to return Purchase', error: error.message });
    }
};

module.exports = { fetchSaleReturnProducts, sendPurchaseReturnToSupplier };