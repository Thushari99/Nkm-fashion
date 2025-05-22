const Sale = require('../../models/saleModel')
const SalePayment = require('../../models/salePaymentModel')
const Product = require('../../models/products/product');
const Settings = require('../../models/settingsModel')
const SaleReturn = require('../../models/saleReturnModel')
const Cash = require('../../models/posModel/cashModel');
const mongoose = require('mongoose');
const { isEmpty } = require('lodash');
const generateReferenceId = require('../../utils/generateReferenceID');

const createBackerySale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const saleData = req.body;
        const referenceId = await generateReferenceId('SALE');
        saleData.refferenceId = referenceId;
        saleData.paymentType = 'cash';
        saleData.paymentStatus = 'paid';
        saleData.orderStatus = 'completed';
        saleData.customer = saleData.customer || 'Day Sale';
        saleData.cashierUsername = saleData.cashierUsername || 'Unknown';
        saleData.saleType = 'Non-POS';

        // Validation checks using isEmpty
        if (isEmpty(saleData.warehouse) && isEmpty(saleData.warehouseId)) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.refferenceId)) {
            return res.status(400).json({ message: 'Reference ID is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.date)) {
            return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
        }
        if (!saleData.productsData || saleData.productsData.length === 0) {
            return res.status(400).json({ message: 'Products Data is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.paymentType) && isEmpty(saleData.paymentType)) {
            return res.status(400).json({ message: 'payment type is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.paymentStatus) && isEmpty(saleData.paymentStatus)) {
            return res.status(400).json({ message: 'payment status is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.orderStatus) && isEmpty(saleData.orderStatus )) {
            return res.status(400).json({ message: 'order status is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.saleType) && isEmpty(saleData.saleType )) {
            return res.status(400).json({ message: 'sale type is required.', status: 'unsuccess' });
        }
        if (isEmpty(saleData.cashierUsername) && isEmpty(saleData.cashierUsername)) {
            return res.status(400).json({ message: 'cashier username is required.', status: 'unsuccess' });
        }
        
    
        saleData.warehouse = saleData.warehouse || saleData.warehouseId;
        const newSale = new Sale(saleData);
        const productsData = saleData.productsData;

        // Validate all products first
        for (const product of productsData) {
            const { currentID, quantity, ptype, warehouse } = product;
            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                return res.status(400).json({ message: `Invalid product ID: ${currentID}`, status: 'unsuccess' });
            }
            if (!warehouse) {
                return res.status(400).json({ message: `Warehouse not provided for product with ID: ${currentID}`, status: 'unsuccess' });
            }

            const updatedProduct = await Product.findById(currentID);
            if (!updatedProduct) {
                return res.status(404).json({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
            }

            const warehouseData = updatedProduct.warehouse.get(warehouse);
            if (!warehouseData) {
                return res.status(404).json({ message: `Warehouse with ID ${warehouse} not found for product with ID: ${currentID}`, status: 'unsuccess' });
            }

            if (ptype === 'Single') {
                if (warehouseData.productQty < quantity) {
                    return res.status(400).json({ message: `Insufficient stock for product with ID: ${currentID}`, status: 'unsuccess' });
                }
            } else if (ptype === 'Variation') {
                const variationKey = product.variationValue;
                const variation = warehouseData.variationValues?.get(variationKey);
                if (!variation) {
                    return res.status(404).json({ message: `Variation ${variationKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }
                if (variation.productQty < quantity) {
                    return res.status(400).json({ message: `Insufficient stock for variation ${variationKey} of product with ID: ${currentID}`, status: 'unsuccess' });
                }
            } else {
                return res.status(400).json({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
            }
        }

        // If all validations pass, reduce the quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype, warehouse } = product;

            const updatedProduct = await Product.findById(currentID);
            const warehouseData = updatedProduct.warehouse.get(warehouse);

            if (ptype === 'Single') {
                warehouseData.productQty -= quantity;
            } else if (ptype === 'Variation') {
                const variationKey = product.variationValue;
                const variation = warehouseData.variationValues?.get(variationKey);
                variation.productQty -= quantity;
            }

            updatedProduct.warehouse.set(warehouse, warehouseData);
            await updatedProduct.save();
            return updatedProduct;
        });

        await Promise.all(updatePromises);
        await newSale.save();
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Non-POS Sale created successfully!', sale: newSale, status: 'success' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error saving Non-POS sale:', error);
        res.status(500).json({ message: 'Error saving Non-POS sale', error: error.message, status: 'unsuccess' });
    }
};

module.exports = { createBackerySale }