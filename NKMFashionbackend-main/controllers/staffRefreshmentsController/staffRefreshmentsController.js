const mongoose = require('mongoose');
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Sale = require('../../models/staffRefreshmentsModel'); // Assuming you have a Sale model
const moment = require('moment'); // For handling dates, if needed

// Function to save sale
const createStaffRefreshment = async (req, res) => {
    try {
        const { totalAmount, warehouse, products, date } = req.body;

        // Ensure the products data is passed correctly and contains stockQty
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty products data' });
        }

        // Validate that each product contains stockQty
        for (const product of products) {
            if (!product.hasOwnProperty('stockQty')) {
                return res.status(400).json({ error: 'Each product must have a stockQty field' });
            }

            if (product.stockQty === undefined || product.stockQty === null) {
                return res.status(400).json({ error: 'stockQty cannot be null or undefined for each product' });
            }
        }

        // Save the sale record with products data
        const sale = new Sale({
            totalAmount,
            warehouse,
            productsData: products, // Save the products array into the productsData field
            date: moment(date).format('YYYY-MM-DD'),
        });

        await sale.save(); // Save the sale record

        // Now, update the product's stockQty in the Product collection
        for (const product of products) {
            const { currentId, stockQty, variation } = product;

            // Find the product in the Product collection
            const existingProduct = await Product.findById(currentId);

            if (existingProduct) {
                // Ensure that the warehouse data exists
                const warehouseData = existingProduct.warehouse.get(warehouse);

                if (!warehouseData) {
                    console.warn(`Warehouse ${warehouse} not found for product with ID: ${currentId}`);
                    continue;
                }

                // Case 1: If product has variations, update the variation quantity
                if (existingProduct.variation && warehouseData.variationValues && warehouseData.variationValues.has(variation)) {
                    const variationData = warehouseData.variationValues.get(variation);

                    // Update the productQty within the variationValues of the warehouse
                    variationData.productQty = stockQty;

                    console.log(`Updated variation productQty for product with ID: ${currentId}, variation: ${variation}, new productQty: ${stockQty}`);
                } 
                // Case 2: If product does not have variations, update the overall productQty in the warehouse
                else {
                    warehouseData.productQty = stockQty;

                    console.log(`Updated productQty for product with ID: ${currentId}, new productQty: ${stockQty}`);
                }

                // Save the updated product document
                await existingProduct.save();

            } else {
                console.warn(`Product with ID: ${currentId} not found`);
            }
        }

        // Log the saved sale data for debugging
        console.log("Saved sale:", sale);

        return res.status(200).json({
            message: 'Sale record saved successfully',
            sale,
        });
    } catch (error) {
        console.error('Error saving sale:', error);
        return res.status(500).json({ error: 'An error occurred while saving the sale record.' });
    }
};

const getStaffRefreshmentRecords = async (req, res) => {
    try {
        const { warehouse, startDate, endDate } = req.query;

        // Build query conditions
        let query = {};
        if (warehouse) {
            query.warehouse = warehouse;
        }
        if (startDate && endDate) {
            query.date = {
                $gte: moment(startDate).startOf('day').toDate(),
                $lte: moment(endDate).endOf('day').toDate()
            };
        }

        // Fetch records from the database
        const records = await Sale.find(query).sort({ date: -1 });

        // Return the fetched records
        return res.status(200).json({
            message: 'Staff refreshment records fetched successfully',
            records
        });
    } catch (error) {
        console.error('Error fetching staff refreshment records:', error);
        return res.status(500).json({ error: 'An error occurred while fetching the records.' });
    }
};

const editStaffRefreshmentRecord = async (req, res) => {
    try {
        const { id } = req.params; // Get the sale ID from the URL parameter
        const { totalAmount, warehouse, products, date } = req.body;

        // Ensure the products data is passed correctly and contains stockQty
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty products data' });
        }

        // Validate that each product contains stockQty
        for (const product of products) {
            if (!product.hasOwnProperty('stockQty')) {
                return res.status(400).json({ error: 'Each product must have a stockQty field' });
            }

            if (product.stockQty === undefined || product.stockQty === null) {
                return res.status(400).json({ error: 'stockQty cannot be null or undefined for each product' });
            }
        }

        // Find the sale record by its ID
        const sale = await Sale.findById(id);

        if (!sale) {
            return res.status(404).json({ error: 'Sale record not found' });
        }

        // Update the sale record with the new data
        sale.totalAmount = totalAmount;
        sale.warehouse = warehouse;
        sale.productsData = products;
        sale.date = moment(date).format('YYYY-MM-DD');

        // Save the updated sale record
        await sale.save();

        // Now, update the product's stockQty in the Product collection
        for (const product of products) {
            const { currentId, stockQty, variation } = product;

            // Find the product in the Product collection
            const existingProduct = await Product.findById(currentId);

            if (existingProduct) {
                // Ensure that the warehouse data exists
                const warehouseData = existingProduct.warehouse.get(warehouse);

                if (!warehouseData) {
                    console.warn(`Warehouse ${warehouse} not found for product with ID: ${currentId}`);
                    continue;
                }

                // Case 1: If product has variations, update the variation quantity
                if (existingProduct.variation && warehouseData.variationValues && warehouseData.variationValues.has(variation)) {
                    const variationData = warehouseData.variationValues.get(variation);

                    // Update the productQty within the variationValues of the warehouse
                    variationData.productQty = stockQty;

                    console.log(`Updated variation productQty for product with ID: ${currentId}, variation: ${variation}, new productQty: ${stockQty}`);
                } 
                // Case 2: If product does not have variations, update the overall productQty in the warehouse
                else {
                    warehouseData.productQty = stockQty;

                    console.log(`Updated productQty for product with ID: ${currentId}, new productQty: ${stockQty}`);
                }

                // Save the updated product document
                await existingProduct.save();

            } else {
                console.warn(`Product with ID: ${currentId} not found`);
            }
        }

        // Log the updated sale data for debugging
        console.log("Updated sale:", sale);

        return res.status(200).json({
            message: 'Sale record updated successfully',
            sale,
        });
    } catch (error) {
        console.error('Error updating sale:', error);
        return res.status(500).json({ error: 'An error occurred while updating the sale record.' });
    }
};



module.exports = {createStaffRefreshment, getStaffRefreshmentRecords, editStaffRefreshmentRecord}
