const Sale = require('../../models/saleModel')
const SalePayment = require('../../models/salePaymentModel')
const Product = require('../../models/products/product');
const Settings = require('../../models/settingsModel')
const SaleReturn = require('../../models/saleReturnModel')
const Cash = require('../../models/posModel/cashModel');
const mongoose = require('mongoose');
const { isEmpty } = require('lodash');
const Quatation = require('../../models/quatationModel');
const generateReferenceId = require('../../utils/generateReferenceID');
const io = require('../../server');
const Handlebars = require('handlebars');
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} : ${hours}:${minutes}`;
}

Handlebars.registerHelper('formatCurrency', function (number) {
    if (isNaN(number)) return '0.00';
    const [integerPart, decimalPart] = parseFloat(number).toFixed(2).split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formattedInteger}.${decimalPart}`;
});

const createSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleData = req.body;
        if (!saleData.invoiceNumber) {
            throw new Error("Invoice number is missing");
        }

        const referenceId = await generateReferenceId('SALE');
        saleData.refferenceId = referenceId;
        saleData.invoiceNumber = saleData.invoiceNumber;

        // Fetch default warehouse from settings in the database
        const settings = await Settings.findOne();
        if (!settings || !settings.defaultWarehouse) {
            throw new Error("Default warehouse is not configured in settings.");
        }
        const defaultWarehouse = settings.defaultWarehouse;

        // Validation checks
        if (isEmpty(saleData.warehouse) && isEmpty(saleData.warehouseId)) {
            throw new Error('Warehouse is required.');
        }
        if (isEmpty(saleData.refferenceId)) {
            throw new Error('Reference ID is required.');
        }
        if (isEmpty(saleData.date)) {
            throw new Error('Date is required.');
        }
        if (!saleData.productsData || saleData.productsData.length === 0) {
            throw new Error('Products Data is required.');
        }
        if (isEmpty(saleData.paymentStatus)) {
            throw new Error('Payment Status is required.');
        }

        // Default values for optional fields
        saleData.cashierUsername = saleData.cashierUsername || 'Unknown';
        saleData.paymentType = saleData.paymentType || 'cash';
        saleData.orderStatus = saleData.orderStatus || 'ordered';
        saleData.customer = saleData.customer || 'Unknown';
        saleData.warehouse = saleData.warehouse || saleData.warehouseId;


        if (!Array.isArray(saleData.paymentType)) {
            return res.status(400).json({ message: 'Invalid paymentType format.', status: 'unsuccess' });
        }

        // Process payment types and amounts
        const paymentTypes = saleData.paymentType.map(payment => {
            if (!payment.type || !payment.amount) {
                throw new Error(`Invalid payment type: ${JSON.stringify(payment)}`);
            }
            return { type: payment.type, amount: Number(payment.amount) };
        });

        saleData.paymentType = paymentTypes;

        // Check if the selected warehouse is different from the default warehouse
        if (saleData.warehouse !== defaultWarehouse) {
            res.status(400).json({ message: "Sale creation unsuccessful. Please choose products from the default warehouse to create a sale.", status: 'unsuccess' });
            return;
        }

        // Cash register check
        const cashRegister = await Cash.findOne();
        if (!cashRegister) {
            return res.status(400).json({ message: 'Cash register not found. Sale creation failed.', status: 'unsuccess' });
        }

        const newSale = new Sale(saleData);
        const productsData = saleData.productsData;

        // Prepare update promises for product quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, ptype, warehouse } = product;

            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                throw new Error(`Invalid product ID: ${currentID}`);
            }
            if (!warehouse) {
                throw new Error(`Warehouse not provided for product with ID: ${currentID}`);
            }
            const updatedProduct = await Product.findById(currentID);
            if (!updatedProduct) {
                throw new Error(`Product not found with ID: ${currentID}`);
            }

            const warehouseData = updatedProduct.warehouse.get(warehouse);
            if (!warehouseData) {
                throw new Error("Sale creation unsuccessful. Please choose products from the default warehouse to create a sale.");
            }

            if (ptype === 'Single') {
                if (warehouseData.productQty < quantity) {
                    throw new Error(`Insufficient stock for product with ID: ${currentID}`);
                }
                warehouseData.productQty -= quantity;
            } else if (ptype === 'Variation') {
                const variationKey = product.variationValue;
                const variation = warehouseData.variationValues?.get(variationKey);
                if (!variation) {
                    throw new Error(`Variation ${variationKey} not found for product with ID: ${currentID}`);
                }
                if (variation.productQty < quantity) {
                    throw new Error(`Insufficient stock for variation ${variationKey} of product with ID: ${currentID}`);
                }
                variation.productQty -= quantity;
            } else {
                throw new Error(`Invalid product type for product with ID: ${currentID}`);
            }

            updatedProduct.warehouse.set(warehouse, warehouseData);
            await updatedProduct.save();
            return updatedProduct;
        });

        await Promise.all(updatePromises);
        await newSale.save();

        // Cash register logic (unique to createSale)
        const { paidAmount } = saleData;
        cashRegister.totalBalance += parseFloat(paidAmount);
        await cashRegister.save();

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const logoUrl = settings.logo
            ? `${baseUrl}/${settings.logo.replace(/\\/g, "/")}`
            : null;

        // Generate the bill template
        const templateData = {
            settings: {
                companyName: settings.companyName || '',
                companyAddress: settings.address || 'Address: XXX-XXX-XXXX',
                companyMobile: settings.companyMobile || 'Phone: XXX-XXX-XXXX',
                logo: logoUrl,
            },
            newSale: {
                cashierUsername: newSale.cashierUsername || '',
                invoiceNumber: newSale.invoiceNumber || '',
                date: newSale.date ? formatDate(newSale.date) : '',
                customer: newSale.customer || '',
                productsData: saleData.productsData.map(product => ({
                    name: product.name || 'Unnamed Product',
                    price: product.price || 0,
                    quantity: product.quantity || 0,
                    subtotal: product.subtotal || 0,
                })),
                grandTotal: newSale.grandTotal || 0,
                discount: newSale.discount || 0,
                cashBalance: newSale.cashBalance || 0,
                paymentType: saleData.paymentType.map(payment => ({
                    type: payment.type || 'Unknown',
                    amount: payment.amount || 0,
                })),
                note: newSale.note || '',
            },
        };

        // Generate the bill template
        const template = `
          <div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0; padding: 10px; border: 1px solid #ccc; position: absolute; left: 0; top: 0;">
        <!-- Your existing receipt content remains the same -->
            <style>
            @media print {
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                @page {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            }
            </style>
        <!-- Script to generate barcode (will run when HTML is rendered) -->
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    JsBarcode('#barcode-{{newSale.invoiceNumber}}', '{{newSale.invoiceNumber}}', {
                    format: 'CODE128',
                    width: 1.2,
                    height: 30,
                    fontSize: 14,
                    margin: 5,
                    displayValue: true
                });
            });
            </script>
        
        <div style="text-align: center; margin-bottom: 10px;">
            {{#if settings.logo}}
            <div style="width: 50mm; height: 20mm; overflow: hidden; display: flex; justify-content: center; align-items: center; margin: 2px auto;">
                <img src="{{settings.logo}}" alt="Logo" style="width: 100%; height: auto; object-fit: cover;">
                </div>
            {{/if}}
            <p style="margin: 2px 0;">{{settings.companyAddress}}</p>
            <p style="margin: 2px 0;">{{settings.companyMobile}}</p>
        </div>

        <!-- Transaction Info -->
            <div style="margin-bottom: 10px;">
                <p style="margin: 3px 0; font-size: 13px;">Salesman: {{newSale.cashierUsername}}</p>
                <p style="margin: 3px 0; font-size: 13px;">Receipt No: {{newSale.invoiceNumber}}</p>
                <p style="margin: 3px 0; font-size: 13px;">Date: {{newSale.date}}</p>
                <p style="margin: 3px 0; font-size: 13px;">Customer: {{newSale.customer}}</p>
            </div>

        <!-- Products Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
            <thead>
                <tr>
                    <th style="text-align: left; font-size: 13px;">Product</th>
                    <th style="text-align: left; font-size: 13px;">Price</th>
                    <th style="text-align: center; font-size: 13px;">Qty</th>
                    <th style="text-align: right; font-size: 13px;">Amount</th>
                </tr>
            </thead>
        <tbody>
            {{#each newSale.productsData}}
            <tr>
                <td style="padding: 2px 0; font-size: 13px;">{{this.name}}</td>
                <td style="padding: 2px 0; font-size: 13px;">{{formatCurrency this.price}}</td>
                <td style="text-align: center; padding: 2px 0; font-size: 13px;">{{this.quantity}}</td>
                <td style="text-align: right; padding: 2px 0; font-size: 13px;">{{formatCurrency this.subtotal}}</td>
            </tr>
            {{/each}}
        </tbody>
       <tfoot>
    <tr><td colspan="4" style="padding-top: 8px;"></td></tr>
        <tr>
            <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Total:</td>
            <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.grandTotal}}</td>
        </tr>
    <tr>
        <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Discount:</td>
        <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.discount}}</td>
    </tr>
    
    <!-- Payment Details Rows -->
    {{#each newSale.paymentType}}
    <tr>
        <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">{{this.type}}:</td>
        <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency this.amount}}</td>
    </tr>
    {{/each}}
        
            <tr>
                <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Balance:</td>
                <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.cashBalance}}</td>
            </tr>
        </tfoot>
    </table>

    <!-- Notes Section - Updated with text wrapping -->
    {{#if newSale.note}}
        <div style="margin-bottom:10px; font-size: 12px;  word-wrap: break-word; overflow-wrap: break-word;">
            <p style="margin-top: 3px; 0; margin-bottom: 3px font-size: 12px; white-space: pre-wrap; word-break: break-word;">
            Note:{{newSale.note}}
        </p>
        </div>
        {{/if}}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 15px; font-size: 0.8em;">
        <p style="margin: 4px 0;">
            THANK YOU FOR SHOPPING WITH US!<br><br>
        </p>

        <!-- Barcode Section -->
        <div style="text-align: center; margin: 10px 0;">
            <canvas id="barcode-{{newSale.invoiceNumber}}"></canvas>
        </div>
         <p style="margin: 4px 0;">
            System by IDEAZONE
        </p>
        </div>
    </div>`;

        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate(templateData);
        await session.commitTransaction();
        res.status(201).json({ message: 'Sale created successfully!', html, status: 'success' });

    } catch (error) {
        console.error('Error saving sale:', error);
        await session.abortTransaction();
        res.status(500).json({ message: error.message, status: 'unsuccess' });
    } finally {
        session.endSession();
    }
};

const createNonPosSale = async (req, res) => {
    try {
        const saleData = req.body;
        const referenceId = await generateReferenceId('SALE');
        saleData.refferenceId = referenceId;

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

        if (isEmpty(saleData.warehouse) && isEmpty(saleData.warehouses)) {
            return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
        }

        // Default values for optional fields
        saleData.cashierUsername = saleData.cashierUsername || 'Unknown';
        saleData.warehouse = saleData.warehouse || saleData.warehouseId;

        if (!Array.isArray(saleData.paymentType)) {
            return res.status(400).json({ message: 'Invalid paymentType format.', status: 'unsuccess' });
        }

        const paymentTypes = saleData.paymentType.map(payment => {
            if (!payment.type || !payment.amount) {
                throw new Error(`Invalid payment type: ${JSON.stringify(payment)}`);
            }
            return { type: payment.type, amount: Number(payment.amount) };
        });

        saleData.paymentType = paymentTypes;

        const newSale = new Sale(saleData);
        const productsData = saleData.productsData;

        // Prepare update promises for product quantities
        const updatePromises = productsData.map(async (product) => {
            const { currentID, quantity, stockQty, ptype, warehouse } = product;

            if (!mongoose.Types.ObjectId.isValid(currentID)) {
                return Promise.reject({ message: `Invalid product ID: ${currentID}`, status: 'unsuccess' });
            }

            if (!warehouse) {
                return Promise.reject({ message: `Warehouse not provided for product with ID: ${currentID}`, status: 'unsuccess' });
            }

            const updatedProduct = await Product.findById(currentID);
            if (!updatedProduct) {
                return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
            }

            const warehouseData = updatedProduct.warehouse.get(warehouse);
            if (!warehouseData) {
                console.error(`Error: Warehouse ${warehouse} not found for product ID: ${currentID}`);
                return Promise.reject({
                    message: `Warehouse with ID ${warehouse} not found for product with ID: ${currentID}`,
                    status: 'unsuccess'
                });
            }

            if (ptype === 'Single') {
                console.log(`Debug: Current stock for product ${currentID} in warehouse ${warehouse}:`, warehouseData.productQty);

                if (warehouseData.productQty < quantity) {
                    console.error(`Error: Insufficient stock for product ${currentID} (Available: ${warehouseData.productQty}, Required: ${quantity})`);
                    return Promise.reject({ message: `Insufficient stock for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                warehouseData.productQty -= quantity;
            } else if (ptype === 'Variation') {
                const variationKey = product.variationValue;
                const variation = warehouseData.variationValues?.get(variationKey);

                if (!variation) {
                    return Promise.reject({ message: `Variation ${variationKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
                }

                if (variation.productQty < quantity) {
                    return Promise.reject({ message: `Insufficient stock for variation ${variationKey} of product with ID: ${currentID}`, status: 'unsuccess' });
                }

                variation.productQty -= quantity;
            } else {
                return Promise.reject({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
            }

            // Update the warehouse map with the modified data
            updatedProduct.warehouse.set(warehouse, warehouseData);

            await updatedProduct.save();
            return updatedProduct;
        });

        await Promise.all(updatePromises);
        await newSale.save();

        res.status(201).json({ message: 'Non-POS Sale created successfully!', sale: newSale, status: 'success' });
    } catch (error) {
        console.error('Error saving Non-POS sale:', error);
        res.status(500).json({ message: 'Error saving Non-POS sale', error: error.message, status: 'unsuccess' });
    }
};



// Delete a sale
const deleteSale = async (req, res) => {
    const { id } = req.params; // Get the sale ID from the request parameters
    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }
    try {
        const deletedSale = await Sale.findByIdAndDelete(id); // Delete the sale by ID
        if (!deletedSale) {
            return res.status(404).json({ message: 'Sale not found' }); // If no sale is found, send 404
        }
        res.status(200).json({ message: 'Sale deleted successfully!', sale: deletedSale }); // Send success response
    } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).json({ message: 'Error deleting sale', error });
    }
};

const payingForSale = async (req, res) => {
    const { saleId, amountToPay, payingAmount, paymentType, currentDate } = req.body;

    try {
        // Find the sale by ID
        const sale = await Sale.findById(saleId);
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Ensure amount values are numbers
        if (typeof sale.grandTotal !== 'number' || typeof sale.paidAmount !== 'number') {
            return res.status(400).json({ message: 'Invalid sale amount data' });
        }

        // Convert values to numbers
        const numericPayingAmount = Number(payingAmount);
        const numericAmountToPay = Number(amountToPay);

        // Ensure payment doesn't exceed the total amount
        const newTotalPaidAmount = sale.paidAmount + numericPayingAmount;
        if (newTotalPaidAmount > numericAmountToPay) {
            return res.status(400).json({ message: 'Payment exceeds the amount to pay.' });
        }

        // Create a new payment entry
        const newPayment = new SalePayment({
            saleId,
            amountToPay: numericAmountToPay,
            payingAmount: numericPayingAmount,
            currentDate: currentDate || Date.now(),
            paymentType: paymentType || 'Default',
        });

        await newPayment.save();
        const existingPaymentIndex = sale.paymentType.findIndex(pt => pt.type === paymentType);

        if (existingPaymentIndex !== -1) {
            sale.paymentType[existingPaymentIndex].amount += numericPayingAmount;
        } else {
            sale.paymentType.push({ type: paymentType, amount: numericPayingAmount });
        }

        sale.paidAmount = newTotalPaidAmount;
        const allPayments = await SalePayment.find({ saleId });
        const totalPaidAmount = allPayments.reduce((sum, payment) => sum + payment.payingAmount, 0);

        const dueAmount = numericAmountToPay - totalPaidAmount;

        if (totalPaidAmount === 0) {
            sale.paymentStatus = 'unpaid';
        } else if (totalPaidAmount >= sale.grandTotal) {
            sale.paymentStatus = 'paid';
        } else if (totalPaidAmount > 0 && totalPaidAmount < sale.grandTotal) {
            sale.paymentStatus = 'partial';
        }

        await sale.save();

        return res.status(201).json({
            message: 'Payment recorded successfully',
            payment: newPayment,
            sale: {
                saleId: sale._id,
                paidAmount: totalPaidAmount,
                dueAmount: dueAmount,
                paymentStatus: sale.paymentStatus,
                paymentDetails: sale.paymentType,
            }
        });

    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: 'An error occurred while processing the payment' });
    }
};

const deletePaymentOfSale = async (req, res) => {
    const { id } = req.params; // Payment ID
    try {
        // Find the payment to delete
        const payment = await SalePayment.findById(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const saleId = payment.saleId;

        // Find the associated sale
        const sale = await Sale.findById(saleId);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Subtract the payment amount from the sale's paidAmount
        sale.paidAmount -= payment.payingAmount;

        // Ensure paidAmount doesn't fall below 0
        if (sale.paidAmount < 0) {
            sale.paidAmount = 0;
        }

        // Recalculate the payment status
        if (sale.paidAmount === 0) {
            sale.paymentStatus = 'Unpaid';
        } else if (sale.paidAmount >= sale.grandTotal) {
            sale.paymentStatus = 'Paid';
        } else {
            sale.paymentStatus = 'Partial';
        }

        // Save the updated sale
        await sale.save();

        // Delete the payment
        await SalePayment.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Payment deleted successfully',
            sale: {
                saleId: sale._id,
                paidAmount: sale.paidAmount,
                paymentStatus: sale.paymentStatus,
            },
        });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'An error occurred while deleting the payment' });
    }
};

// Controller to fetch payment by sale Id
const fetchPaymentBySaleId = async (req, res) => {
    const { saleId } = req.params;
    try {
        const paymentData = await SalePayment.find({ saleId: saleId });
        if (!paymentData || paymentData.length === 0) {
            return res.status(404).json({ message: 'No payments found for this sale ID' });
        }
        res.status(200).json({ payments: paymentData });
    } catch (error) {
        console.error('Error fetching payment data:', error);
        res.status(500).json({ error: 'An error occurred while fetching payment data' });
    }
};


const findSaleById = async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Received request to fetch sale by ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid sale ID format' });
    }

    try {
        const sale = await Sale.findById(id).lean(); // Using lean() to get a plain object
        console.log("📦 Full Sale Data Fetched from DB:", JSON.stringify(sale, null, 2));
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const productIds = sale.productsData.map(product => product.currentID);
        console.log("🆔 Extracted Product IDs:", productIds);

        const products = await Product.find({ _id: { $in: productIds } }).lean(); // Using lean() to get plain objects
        console.log("📦 Full Product Data Fetched from DB:", JSON.stringify(products, null, 2));

        const updatedProductsData = sale.productsData.map(productData => {
            const baseProduct = products.find(p => p._id.toString() === productData.currentID);
            const warehouseKey = productData.warehouse;
            if (baseProduct) {
                console.log(`Base product found for ID ${productData.currentID}:`, JSON.stringify(baseProduct, null, 2));
                let stockQty = "";
                let productCost = ""

                const selectedWarehouse = baseProduct.warehouse[warehouseKey];
                console.log(`Warehouse data for product ${baseProduct._id}:`, JSON.stringify(selectedWarehouse, null, 2));

                if (!selectedWarehouse) {
                    console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                    return {
                        ...productData,
                        stockQty: "N/A",
                        productCost
                    };
                }

                if (productData.variationValue && selectedWarehouse.variationValues) {
                    const variation = selectedWarehouse.variationValues[productData.variationValue];
                    if (variation) {
                        stockQty = variation.productQty || "";
                        productCost = variation.productCost || "";
                    } else {
                        console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                    }
                } else {
                    stockQty = selectedWarehouse.productQty || "";
                    productCost = selectedWarehouse.productCost || "";
                }

                console.log(`Calculated stockQty for product ${productData.currentID}: ${stockQty}`);
                return {
                    currentID: productData.currentID,
                    variationValues: selectedWarehouse.variationValues,
                    selectedVariation: productData.variationValue,
                    name: productData.name,
                    price: productData.price,
                    productCost,
                    ptype: productData.ptype,
                    discount: productData.discount,
                    specialDiscount: productData.specialDiscount,
                    quantity: productData.quantity,
                    stockQty,
                    taxRate: productData.taxRate,
                    subtotal: productData.subtotal,
                    warehouse: productData.warehouse,
                    _id: productData._id
                };
            }

            console.warn(`Base product with currentID ${productData.currentID} not found.`);
            // Return original product data if no base product found
            return productData;
        });

        const saleWithUpdatedProducts = {
            ...sale,
            productsData: updatedProductsData
        };

        console.log("🚀 Final Sale Data Sent to Frontend:", JSON.stringify(saleWithUpdatedProducts, null, 2));
        res.status(200).json(saleWithUpdatedProducts);
    } catch (error) {
        console.error('❌ Error finding sale by ID:', error);
        res.status(500).json({ message: 'Error fetching sale by ID', error: error.message });
    }
};

const updateSale = async (req, res) => {
    try {
        const saleId = req.params.id;
        const updateData = req.body;

        console.log("\uD83D\uDEE0\uFE0F Received request to update sale ID:", saleId);
        console.log("\uD83D\uDCE5 Update Data:", JSON.stringify(updateData, null, 2));

        if (!updateData.date || !updateData.paymentStatus || !updateData.orderStatus || !updateData.paymentType) {
            return res.status(400).json({ message: 'Missing required fields.', status: 'unsuccess' });
        }

        updateData.cashierUsername = updateData.cashierUsername || 'Unknown';
        updateData.paymentType = updateData.paymentType || [];
        updateData.orderStatus = updateData.orderStatus || 'ordered';
        updateData.customer = updateData.customer || 'Unknown';

        console.log("\uD83D\uDD0D Fetching existing sale from DB...");
        const existingSale = await Sale.findById(saleId);
        if (!existingSale) {
            console.error("❌ Sale not found:", saleId);
            return res.status(404).json({ message: 'Sale not found', status: 'unsuccess' });
        }

        console.log("\uD83D\uDCE6 Existing Sale Data:", JSON.stringify(existingSale, null, 2));

        const existingProducts = existingSale.productsData;
        const updatedProducts = updateData.productsData;

        console.log("\uD83D\uDD04 Processing updated products...");
        let errors = [];

        await Promise.all(updatedProducts.map(async (product) => {
            try {
                const { currentID, quantity: newQuantity, ptype, variationValue } = product;
                const warehouse = product.warehouse || updateData.warehouse;

                console.log("🔖 Processing Product:", currentID, "| Warehouse:", warehouse);

                const updatedProduct = await Product.findById(currentID);
                if (!updatedProduct) {
                    errors.push(`Product not found with ID: ${currentID}`);
                    return;
                }

                console.log("🏪 Fetching warehouse data...");
                const warehouseData = updatedProduct.warehouse.get(warehouse);

                if (!warehouseData) {
                    console.warn(`⚠️ Warehouse ${warehouse} not found.`);
                    return;
                }

                console.log("📊 Adjusting stock quantity...");
                const existingProduct = existingProducts.find(p => p.currentID === currentID);
                const previousQuantity = existingProduct ? existingProduct.quantity : 0;
                const quantityDifference = newQuantity - previousQuantity;

                // FIXED: Changed from existingPurchase.warehouse to existingSale.warehouse
                const warehouseKey = existingProduct?.warehouse || existingSale.warehouse;

                if (ptype === 'Single') {
                    const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);
                    if (!selectedWarehouse) {
                        throw new Error(`Warehouse ${warehouseKey} not found for product with ID: ${currentID}`);
                    }
                    if (quantityDifference < 0 && selectedWarehouse.productQty < Math.abs(quantityDifference)) {
                        throw new Error(`Insufficient stock for product ID: ${currentID}`);
                    }
                    selectedWarehouse.productQty -= quantityDifference;
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
                    variation.productQty -= quantityDifference;
                    updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
                } else {
                    errors.push(`Invalid product type for product with ID: ${currentID}`);
                    return;
                }

                // Ensure warehouse update is saved
                updatedProduct.warehouse.set(warehouse, warehouseData);
                updatedProduct.markModified("warehouse");
                await updatedProduct.save();

                console.log(`✅ Stock updated in DB for ${currentID}:`, warehouseData.productQty);
            } catch (err) {
                console.error(`❌ Error processing product ${product.currentID}:`, err);
                errors.push(`Error processing product ${product.currentID}: ${err.message}`);
            }
        }));

        if (errors.length > 0) {
            return res.status(400).json({ message: "Error updating products", details: errors });
        }

        console.log("✅ All product updates completed successfully.");

        updateData.productsData = updateData.productsData.map(product => ({
            ...product,
            warehouse: product.warehouse || updateData.warehouse || 'default_warehouse',
        }));

        console.log("\uD83D\uDD04 Updating sale in DB...");
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...updateData, warehouse: existingSale.warehouse, customer: existingSale.customer },
            { new: true, runValidators: true }
        );

        console.log("\uD83D\uDCB0 Updating cash register balance...");
        const previousPaidAmount = parseFloat(existingSale.paidAmount);
        const newPaidAmount = parseFloat(updateData.paidAmount);
        const paidAmountDifference = newPaidAmount - previousPaidAmount;

        const cashRegister = await Cash.findOne();
        if (cashRegister) {
            cashRegister.totalBalance = parseFloat(cashRegister.totalBalance) + paidAmountDifference;
            await cashRegister.save();
        } else {
            return res.status(200).json({ message: 'Cash register not found' });
        }

        // Update SalePayment model for payment type changes
        const existingPayments = await SalePayment.find({ saleId });
        const updatedPaymentTypes = updateData.paymentType;

        for (const paymentType of updatedPaymentTypes) {
            const existingPayment = existingPayments.find(payment => payment.paymentType === paymentType.type);
            if (existingPayment) {
                existingPayment.payingAmount = paymentType.amount;
                await existingPayment.save();
            } else {
                const newPayment = new SalePayment({
                    saleId,
                    amountToPay: updatedSale.grandTotal,
                    payingAmount: paymentType.amount,
                    currentDate: updateData.date || Date.now(),
                    paymentType: paymentType.type,
                });
                await newPayment.save();
            }
        }

        console.log("✅ Sale update successful:", JSON.stringify(updatedSale, null, 2));
        return res.status(200).json({ message: 'Sale updated successfully', sale: updatedSale });
    } catch (error) {
        console.error('❌ Error updating sale:', error);
        return res.status(500).json({ message: 'Failed to update sale', error: error.message });
    }
};


//Delete a product from sale
const deleteProductFromSale = async (req, res) => {
    const { saleID, productID, total } = req.query; // `productID` refers to `currentID` in `productsData`
    if (!saleID) {
        return res.status(400).json({ message: 'sale ID is required' });
    }
    if (!productID) {
        return res.status(400).json({ message: 'product ID is required' });
    }
    try {
        // Step 1: Find the sale by saleID
        const sale = await Sale.findById(saleID);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Step 2: Check if the product exists in the sale's productsData
        const productToDelete = sale.productsData.find(product => product.currentID === productID);
        if (!productToDelete) {
            return res.status(404).json({ message: 'Product not found in sale' });
        }

        // Step 3: Calculate the new grandTotal after removing the product's subtotal
        const newGrandTotal = sale.grandTotal - productToDelete.subtotal;

        // Step 4: Update the sale by pulling the product out of productsData and updating grandTotal
        const updatedSale = await Sale.findByIdAndUpdate(
            saleID,
            {
                $pull: { productsData: { currentID: productID } }, // Remove the product from the array
                grandTotal: newGrandTotal // Update the grandTotal
            },
            { new: true } // Return the updated document
        );

        // Step 5: Respond with success if the sale was updated
        if (updatedSale) {
            res.status(200).json({ message: "Product deleted successfully", sale: updatedSale });
        } else {
            res.status(404).json({ message: "Sale not found" });
        }
    } catch (error) {
        console.error("Error deleting product from sale:", error);
        res.status(500).json({ message: "An error occurred while deleting the product" });
    }
};

// Backend Controller to Fetch Sales
const fetchSales = async (req, res) => {
    const { id, keyword } = req.query;
    try {
        let sales;

        // Fetch by ID if 'id' is provided in query
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid sale ID format' });
            }

            // Fetch sale as a plain JavaScript object with .lean()
            const sale = await Sale.findById(id).lean();
            if (!sale) {
                return res.status(404).json({ message: 'Sale not found' });
            }

            const productIds = sale.productsData.map(product => product.currentID);
            const products = await Product.find({ _id: { $in: productIds } }).lean();
            const updatedProductsData = sale.productsData.map(productData => {
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
            // Create the final sale object with updated productsData
            const saleWithUpdatedProducts = {
                ...sale,
                productsData: updatedProductsData
            };

            // Send the response with the updated sale object
            return res.status(200).json(saleWithUpdatedProducts);
        }

        // Fetch by keyword (matches customer name or reference ID)
        if (keyword) {
            if (keyword.length < 1) {
                return res.status(400).json({ message: 'Please provide a valid keyword.' });
            }

            sales = await Sale.find({
                $or: [
                    { customer: { $regex: new RegExp(keyword, 'i') } },
                    { refferenceId: { $regex: new RegExp(keyword, 'i') } }
                ]
            });

            if (!sales || sales.length === 0) {
                return res.status(404).json({ message: 'No sales found matching the provided keyword.' });
            }

            return res.status(200).json(sales);
        }
        if (req.query.page) {
            const size = parseInt(req.query.page.size) || 10; // Default size is 10
            const number = parseInt(req.query.page.number) || 1; // Default page number is 1
            const offset = (number - 1) * size; // Calculate the offset for pagination
            // const sort = req.query.sort || ''; // Handle sorting if provided

            sales = await Sale.find()
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(size);

            const totalSales = await Sale.countDocuments(); // Total sales count
            return res.status(200).json({
                sales,
                total: totalSales,
                size,
                number,
                totalPages: Math.ceil(totalSales / size)
            });
        } else {
            sales = await Sale.find();
            if (!sales || sales.length === 0) {
                return res.status(404).json({ message: 'No sales found.' });
            }

            return res.status(200).json(sales);
        }

    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

const searchSale = async (req, res) => {
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

        // Build query to search by customer, reference ID, or invoice number
        const query = {
            $or: [
                { customer: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search
                { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } },
                { invoiceNumber: { $regex: new RegExp(`${escapedKeyword}`, 'i') } } // Added invoiceNumber search
            ]
        };

        // Fetch sales based on the query
        const sales = await Sale.find(query).populate('productsData.currentID', 'productName productQty');

        if (!sales || sales.length === 0) {
            return res.status(404).json({
                status: "unsuccess",
                message: "No sales found for the provided keyword."
            });
        }

        // Format sales data if additional processing is needed
        const formattedSales = sales.map((sale) => {
            const saleObj = sale.toObject();

            return {
                _id: saleObj._id,
                refferenceId: saleObj.refferenceId,
                invoiceNumber: saleObj.invoiceNumber, // Ensure invoice number is included in the response
                customer: saleObj.customer,
                grandTotal: saleObj.grandTotal,
                orderStatus: saleObj.orderStatus,
                paymentStatus: saleObj.paymentStatus,
                paymentType: saleObj.paymentType,
                paidAmount: saleObj.paidAmount,
                warehouse: saleObj.warehouse,
                date: saleObj.date,
                discount: saleObj.discount,
                discountType: saleObj.discountType,
                offerPercentage: saleObj.offerPercentage,
                shipping: saleObj.shipping,
                tax: saleObj.tax,
                productsData: saleObj.productsData, // Include product details
                createdAt: saleObj.createdAt
                    ? saleObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({
            status: "success",
            sales: formattedSales
        });
    } catch (error) {
        console.error("Search sales error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};


const fetchTodaySales = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const sales = await Sale.find({
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).lean();

        if (!sales || sales.length === 0) {
            return res.status(404).json({ message: 'No sales found for today.' });
        }

        const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        const salesWithUpdatedProducts = sales.map(sale => {
            const updatedProductsData = sale.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                const warehouseKey = productData.warehouse;

                if (baseProduct) {
                    let stockQty = "";
                    let productCost = "";
                    const selectedWarehouse = baseProduct.warehouse[warehouseKey];

                    if (!selectedWarehouse) {
                        console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                        return {
                            ...productData,
                            stockQty: "N/A",
                            productCost
                        };
                    }

                    if (productData.variationValue && selectedWarehouse.variationValues) {
                        const variation = selectedWarehouse.variationValues[productData.variationValue];
                        if (variation) {
                            stockQty = variation.productQty || "";
                            productCost = variation.productCost || "";
                        } else {
                            console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                        }
                    } else {
                        stockQty = selectedWarehouse.productQty || "";
                        productCost = selectedWarehouse.productCost || "";
                    }

                    return {
                        currentID: productData.currentID,
                        variationValues: selectedWarehouse.variationValues,
                        selectedVariation: productData.variationValue,
                        name: productData.name,
                        price: productData.price,
                        productCost,
                        ptype: productData.ptype,
                        discount: productData.discount,
                        specialDiscount: productData.specialDiscount,
                        quantity: productData.quantity,
                        stockQty,
                        taxRate: productData.taxRate,
                        subtotal: productData.subtotal,
                        warehouse: productData.warehouse,
                        _id: productData._id
                    };
                }
                console.warn(`Base product with currentID ${productData.currentID} not found.`);
                return productData;
            });

            return {
                ...sale,
                productsData: updatedProductsData
            };
        });

        res.status(200).json(salesWithUpdatedProducts);
    } catch (error) {
        console.error('❌ Error fetching today\'s sales:', error);
        res.status(500).json({ message: 'Error fetching today\'s sales', error: error.message });
    }
};

const fetchLastWeekSales = async (req, res) => {
    try {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        today.setHours(23, 59, 59, 999);

        const sales = await Sale.find({
            date: {
                $gte: lastWeek,
                $lte: today
            }
        }).lean();

        if (!sales || sales.length === 0) {
            return res.status(404).json({ message: 'No sales found for the last week.' });
        }

        const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        const salesWithUpdatedProducts = sales.map(sale => {
            const updatedProductsData = sale.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                const warehouseKey = productData.warehouse;

                if (baseProduct) {
                    let stockQty = "";
                    let productCost = "";
                    const selectedWarehouse = baseProduct.warehouse[warehouseKey];

                    if (!selectedWarehouse) {
                        console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                        return {
                            ...productData,
                            stockQty: "N/A",
                            productCost
                        };
                    }

                    if (productData.variationValue && selectedWarehouse.variationValues) {
                        const variation = selectedWarehouse.variationValues[productData.variationValue];
                        if (variation) {
                            stockQty = variation.productQty || "";
                            productCost = variation.productCost || "";
                        } else {
                            console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                        }
                    } else {
                        stockQty = selectedWarehouse.productQty || "";
                        productCost = selectedWarehouse.productCost || "";
                    }

                    return {
                        currentID: productData.currentID,
                        variationValues: selectedWarehouse.variationValues,
                        selectedVariation: productData.variationValue,
                        name: productData.name,
                        price: productData.price,
                        productCost,
                        ptype: productData.ptype,
                        discount: productData.discount,
                        specialDiscount: productData.specialDiscount,
                        quantity: productData.quantity,
                        stockQty,
                        taxRate: productData.taxRate,
                        subtotal: productData.subtotal,
                        warehouse: productData.warehouse,
                        productProfit: productData.productProfit,
                        _id: productData._id
                    };
                }
                console.warn(`Base product with currentID ${productData.currentID} not found.`);
                return productData;
            });

            return {
                ...sale,
                productsData: updatedProductsData
            };
        });

        res.status(200).json(salesWithUpdatedProducts);
    } catch (error) {
        console.error('❌ Error fetching last week\'s sales:', error);
        res.status(500).json({ message: 'Error fetching last week\'s sales', error: error.message });
    }
};


const fetchLastMonthSales = async (req, res) => {
    try {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        lastMonth.setHours(0, 0, 0, 0); // Ensure start of the day for last month
        today.setHours(23, 59, 59, 999); // Ensure end of the day for today

        const sales = await Sale.find({
            date: {
                $gte: lastMonth,
                $lte: today
            }
        }).lean();

        if (!sales || sales.length === 0) {
            return res.status(404).json({ message: 'No sales found for the last month.' });
        }

        const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        const salesWithUpdatedProducts = sales.map(sale => {
            const updatedProductsData = sale.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                const warehouseKey = productData.warehouse;

                if (baseProduct) {
                    let stockQty = "";
                    let productCost = "";
                    const selectedWarehouse = baseProduct.warehouse[warehouseKey];

                    if (!selectedWarehouse) {
                        console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                        return {
                            ...productData,
                            stockQty: "N/A",
                            productCost
                        };
                    }

                    if (productData.variationValue && selectedWarehouse.variationValues) {
                        const variation = selectedWarehouse.variationValues[productData.variationValue];
                        if (variation) {
                            stockQty = variation.productQty || "";
                            productCost = variation.productCost || "";
                        } else {
                            console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                        }
                    } else {
                        stockQty = selectedWarehouse.productQty || "";
                        productCost = selectedWarehouse.productCost || "";
                    }

                    return {
                        currentID: productData.currentID,
                        variationValues: selectedWarehouse.variationValues,
                        selectedVariation: productData.variationValue,
                        name: productData.name,
                        price: productData.price,
                        productCost,
                        ptype: productData.ptype,
                        discount: productData.discount,
                        specialDiscount: productData.specialDiscount,
                        quantity: productData.quantity,
                        stockQty,
                        taxRate: productData.taxRate,
                        subtotal: productData.subtotal,
                        warehouse: productData.warehouse,
                        _id: productData._id
                    };
                }
                console.warn(`Base product with currentID ${productData.currentID} not found.`);
                return productData;
            });

            return {
                ...sale,
                productsData: updatedProductsData
            };
        });
        res.status(200).json(salesWithUpdatedProducts);
    } catch (error) {
        console.error('❌ Error fetching last month\'s sales:', error);
        res.status(500).json({ message: 'Error fetching last month\'s sales', error: error.message });
    }
};

const fetchLastYearSales = async (req, res) => {
    try {
        const today = new Date();
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        lastYear.setHours(0, 0, 0, 0); // Ensure start of the day for last year
        today.setHours(23, 59, 59, 999); // Ensure end of the day for today

        const sales = await Sale.find({
            date: {
                $gte: lastYear,
                $lte: today
            }
        }).lean();

        if (!sales || sales.length === 0) {
            return res.status(404).json({ message: 'No sales found for the last year.' });
        }

        const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        const salesWithUpdatedProducts = sales.map(sale => {
            const updatedProductsData = sale.productsData.map(productData => {
                const baseProduct = products.find(p => p._id.toString() === productData.currentID);
                const warehouseKey = productData.warehouse;

                if (baseProduct) {
                    let stockQty = "";
                    let productCost = "";
                    const selectedWarehouse = baseProduct.warehouse[warehouseKey];

                    if (!selectedWarehouse) {
                        console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
                        return {
                            ...productData,
                            stockQty: "N/A",
                            productCost
                        };
                    }

                    if (productData.variationValue && selectedWarehouse.variationValues) {
                        const variation = selectedWarehouse.variationValues[productData.variationValue];
                        if (variation) {
                            stockQty = variation.productQty || "";
                            productCost = variation.productCost || "";
                        } else {
                            console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
                        }
                    } else {
                        stockQty = selectedWarehouse.productQty || "";
                        productCost = selectedWarehouse.productCost || "";
                    }

                    return {
                        currentID: productData.currentID,
                        variationValues: selectedWarehouse.variationValues,
                        selectedVariation: productData.variationValue,
                        name: productData.name,
                        price: productData.price,
                        productCost,
                        ptype: productData.ptype,
                        discount: productData.discount,
                        specialDiscount: productData.specialDiscount,
                        quantity: productData.quantity,
                        stockQty,
                        taxRate: productData.taxRate,
                        subtotal: productData.subtotal,
                        warehouse: productData.warehouse,
                        _id: productData._id
                    };
                }
                console.warn(`Base product with currentID ${productData.currentID} not found.`);
                return productData;
            });

            return {
                ...sale,
                productsData: updatedProductsData
            };
        });

        res.status(200).json(salesWithUpdatedProducts);
    } catch (error) {
        console.error('❌ Error fetching last year\'s sales:', error);
        res.status(500).json({ message: 'Error fetching last year\'s sales', error: error.message });
    }
};

// GET /api/printInvoice/:saleId
const printInvoice = async (req, res) => {
    try {
        const { saleId } = req.params;
        const sale = await Sale.findById(saleId).lean();
        const settings = await Settings.findOne();

        if (!sale || !settings) {
            return res.status(404).json({ message: 'Sale or settings not found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const logoUrl = settings.logo
            ? `${baseUrl}/${settings.logo.replace(/\\/g, "/")}`
            : null;

        const templateData = {
            settings: {
                companyName: settings.companyName || 'IDEAZONE',
                companyAddress: settings.address || 'Address: XXX-XXX-XXXX',
                companyMobile: settings.companyMobile || 'Phone: XXX-XXX-XXXX',
                logo: logoUrl,
            },
            newSale: {
                cashierUsername: sale.cashierUsername || '',
                invoiceNumber: sale.invoiceNumber || '',
                date: sale.date ? formatDate(sale.date) : '',
                customer: sale.customer || '',
                productsData: sale.productsData.map(product => ({
                    name: product.name,
                    warranty: product.warranty || '',
                    price: product.price,
                    quantity: product.quantity,
                    subtotal: product.subtotal,
                })),
                grandTotal: sale.grandTotal,
                discount: sale.discount || 0,
                cashBalance: sale.cashBalance || 0,
                paymentType: sale.paymentType,
                note: sale.note || '',
            },
        };

        const invoiceTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0; padding: 10px; border: 1px solid #ccc; position: absolute; left: 0; top: 0;">
        <!-- Your existing receipt content remains the same -->
            <style>
            @media print {
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                @page {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            }
            </style>
        <!-- Script to generate barcode (will run when HTML is rendered) -->
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    JsBarcode('#barcode-{{newSale.invoiceNumber}}', '{{newSale.invoiceNumber}}', {
                    format: 'CODE128',
                    width: 1.2,
                    height: 30,
                    fontSize: 14,
                    margin: 5,
                    displayValue: true
                });
            });
            </script>
        
        <div style="text-align: center; margin-bottom: 10px;">
            {{#if settings.logo}}
            <img src="{{settings.logo}}" alt="Logo" style="max-height: 50px; margin: 2px auto;">
            {{/if}}
            <h2 style="margin: 5px 0;">{{settings.companyName}}</h2>
            <p style="margin: 2px 0;">{{settings.companyAddress}}</p>
            <p style="margin: 2px 0;">{{settings.companyMobile}}</p>
        </div>

        <!-- Transaction Info -->
            <div style="margin-bottom: 10px;">
                <p style="margin: 3px 0; font-size: 13px;">Salesman: {{newSale.cashierUsername}}</p>
                <p style="margin: 3px 0; font-size: 13px;">Receipt No: {{newSale.invoiceNumber}}</p>
                <p style="margin: 3px 0; font-size: 13px;">Date: {{newSale.date}}</p>
                <p style="margin: 3px 0; font-size: 13px;">Customer: {{newSale.customer}}</p>
            </div>

        <!-- Products Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
            <thead>
                <tr>
                    <th style="text-align: left; font-size: 13px;">Product</th>
                    <th style="text-align: left; font-size: 13px;">Price</th>
                    <th style="text-align: center; font-size: 13px;">Qty</th>
                    <th style="text-align: right; font-size: 13px;">Amount</th>
                </tr>
            </thead>
        <tbody>
            {{#each newSale.productsData}}
            <tr>
                <td style="padding: 2px 0; font-size: 13px;">{{this.name}}</td>
                <td style="padding: 2px 0; font-size: 13px;">{{formatCurrency this.price}}</td>
                <td style="text-align: center; padding: 2px 0; font-size: 13px;">{{this.quantity}}</td>
                <td style="text-align: right; padding: 2px 0; font-size: 13px;">{{formatCurrency this.subtotal}}</td>
            </tr>
            {{/each}}
        </tbody>
       <tfoot>
    <tr><td colspan="4" style="padding-top: 8px;"></td></tr>
        <tr>
            <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Total:</td>
            <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.grandTotal}}</td>
        </tr>
    <tr>
        <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Discount:</td>
        <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.discount}}</td>
    </tr>
    
    <!-- Payment Details Rows -->
    {{#each newSale.paymentType}}
    <tr>
        <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">{{this.type}}:</td>
        <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency this.amount}}</td>
    </tr>
    {{/each}}
        
            <tr>
                <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Balance:</td>
                <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.cashBalance}}</td>
            </tr>
        </tfoot>
    </table>

    <!-- Notes Section - Updated with text wrapping -->
    {{#isValidNote newSale.note}}
        <div style="margin-bottom:10px; font-size: 12px;  word-wrap: break-word; overflow-wrap: break-word;">
            <p style="margin-top: 3px; 0; margin-bottom: 3px font-size: 12px; white-space: pre-wrap; word-break: break-word;">
            Note: {{newSale.note}}
        </p>
        </div>
        {{/isValidNote}}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 15px; font-size: 0.8em;">
        <p style="margin: 4px 0;">
            *** EXCHANGE OF PRODUCTS IN RE-SALABLE CONDITION<br>
            WITH RECEIPT WITHIN 07 DAYS ***<br>
            THANK YOU FOR SHOPPING WITH US!<br><br>
        </p>

        <!-- Barcode Section -->
        <div style="text-align: center; margin: 10px 0;">
            <canvas id="barcode-{{newSale.invoiceNumber}}"></canvas>
        </div>
         <p style="margin: 4px 0;">
            System by IDEAZONE
        </p>
        </div>
    </div>`;

        Handlebars.registerHelper('isValidNote', function (note, options) {
            return note && note !== 'null' ? options.fn(this) : options.inverse(this);
        });


        const compiledTemplate = Handlebars.compile(invoiceTemplate); //  reuse the same template string
        const html = compiledTemplate(templateData);

        res.status(200).json({ html, status: 'success' });
    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        res.status(500).json({ message: 'Error generating invoice', error: error.message });
    }
};

module.exports = {
    createSale, createNonPosSale, deleteSale, payingForSale, deletePaymentOfSale, fetchPaymentBySaleId, findSaleById, updateSale, deleteProductFromSale,
    fetchSales, searchSale, fetchTodaySales, fetchLastWeekSales, fetchLastMonthSales, fetchLastYearSales, printInvoice
};





// const Sale = require('../../models/saleModel')
// const SalePayment = require('../../models/salePaymentModel')
// const Product = require('../../models/products/product');
// const Settings = require('../../models/settingsModel')
// const SaleReturn = require('../../models/saleReturnModel')
// const Cash = require('../../models/posModel/cashModel');
// const mongoose = require('mongoose');
// const { isEmpty } = require('lodash');
// const Quatation = require('../../models/quatationModel');
// const generateReferenceId = require('../../utils/generateReferenceID');
// const io = require('../../server');
// const Handlebars = require('handlebars');
// function formatDate(dateString) {
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     return `${day}/${month}/${year} : ${hours}:${minutes}`;
// }

// Handlebars.registerHelper('formatCurrency', function (number) {
//     if (isNaN(number)) return '0.00';
//     const [integerPart, decimalPart] = parseFloat(number).toFixed(2).split('.');
//     const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//     return `${formattedInteger}.${decimalPart}`;
// });

// const createSale = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const saleData = req.body;
//         if (!saleData.invoiceNumber) {
//             throw new Error("Invoice number is missing");
//         }

//         const referenceId = await generateReferenceId('SALE');
//         saleData.refferenceId = referenceId;
//         saleData.invoiceNumber = saleData.invoiceNumber;

//         // Fetch default warehouse from settings in the database
//         const settings = await Settings.findOne();
//         if (!settings || !settings.defaultWarehouse) {
//             throw new Error("Default warehouse is not configured in settings.");
//         }
//         const defaultWarehouse = settings.defaultWarehouse;

//         // Validation checks
//         if (isEmpty(saleData.warehouse) && isEmpty(saleData.warehouseId)) {
//             throw new Error('Warehouse is required.');
//         }
//         if (isEmpty(saleData.refferenceId)) {
//             throw new Error('Reference ID is required.');
//         }
//         if (isEmpty(saleData.date)) {
//             throw new Error('Date is required.');
//         }
//         if (!saleData.productsData || saleData.productsData.length === 0) {
//             throw new Error('Products Data is required.');
//         }
//         if (isEmpty(saleData.paymentStatus)) {
//             throw new Error('Payment Status is required.');
//         }

//         // Default values for optional fields
//         saleData.cashierUsername = saleData.cashierUsername || 'Unknown';
//         saleData.paymentType = saleData.paymentType || 'cash';
//         saleData.orderStatus = saleData.orderStatus || 'ordered';
//         saleData.customer = saleData.customer || 'Unknown';
//         saleData.warehouse = saleData.warehouse || saleData.warehouseId;


//         if (!Array.isArray(saleData.paymentType)) {
//             return res.status(400).json({ message: 'Invalid paymentType format.', status: 'unsuccess' });
//         }

//         // Process payment types and amounts
//         const paymentTypes = saleData.paymentType.map(payment => {
//             if (!payment.type || !payment.amount) {
//                 throw new Error(`Invalid payment type: ${JSON.stringify(payment)}`);
//             }
//             return { type: payment.type, amount: Number(payment.amount) };
//         });

//         saleData.paymentType = paymentTypes;

//         // Check if the selected warehouse is different from the default warehouse
//         if (saleData.warehouse !== defaultWarehouse) {
//             res.status(400).json({ message: "Sale creation unsuccessful. Please choose products from the default warehouse to create a sale.", status: 'unsuccess' });
//             return;
//         }

//         // Cash register check
//         const cashRegister = await Cash.findOne();
//         if (!cashRegister) {
//             return res.status(400).json({ message: 'Cash register not found. Sale creation failed.', status: 'unsuccess' });
//         }

//         const newSale = new Sale(saleData);
//         const productsData = saleData.productsData;

//         // Prepare update promises for product quantities
//         const updatePromises = productsData.map(async (product) => {
//             const { currentID, quantity, ptype, warehouse } = product;

//             if (!mongoose.Types.ObjectId.isValid(currentID)) {
//                 throw new Error(`Invalid product ID: ${currentID}`);
//             }
//             if (!warehouse) {
//                 throw new Error(`Warehouse not provided for product with ID: ${currentID}`);
//             }
//             const updatedProduct = await Product.findById(currentID);
//             if (!updatedProduct) {
//                 throw new Error(`Product not found with ID: ${currentID}`);
//             }

//             const warehouseData = updatedProduct.warehouse.get(warehouse);
//             if (!warehouseData) {
//                 throw new Error("Sale creation unsuccessful. Please choose products from the default warehouse to create a sale.");
//             }

//             if (ptype === 'Single') {
//                 if (warehouseData.productQty < quantity) {
//                     throw new Error(`Insufficient stock for product with ID: ${currentID}`);
//                 }
//                 warehouseData.productQty -= quantity;
//             } else if (ptype === 'Variation') {
//                 const variationKey = product.variationValue;
//                 const variation = warehouseData.variationValues?.get(variationKey);
//                 if (!variation) {
//                     throw new Error(`Variation ${variationKey} not found for product with ID: ${currentID}`);
//                 }
//                 if (variation.productQty < quantity) {
//                     throw new Error(`Insufficient stock for variation ${variationKey} of product with ID: ${currentID}`);
//                 }
//                 variation.productQty -= quantity;
//             } else {
//                 throw new Error(`Invalid product type for product with ID: ${currentID}`);
//             }

//             updatedProduct.warehouse.set(warehouse, warehouseData);
//             await updatedProduct.save();
//             return updatedProduct;
//         });

//         await Promise.all(updatePromises);
//         await newSale.save();

//         // Cash register logic (unique to createSale)
//         const { paidAmount } = saleData;
//         cashRegister.totalBalance += parseFloat(paidAmount);
//         await cashRegister.save();

//         const baseUrl = `${req.protocol}://${req.get('host')}`;
//         const logoUrl = settings.logo
//             ? `${baseUrl}/${settings.logo.replace(/\\/g, "/")}`
//             : null;

//         // Generate the bill template
//         const templateData = {
//             settings: {
//                 companyName: settings.companyName || 'IDEAZONE',
//                 companyAddress: settings.address || 'Address: XXX-XXX-XXXX',
//                 companyMobile: settings.companyMobile || 'Phone: XXX-XXX-XXXX',
//                 logo: logoUrl,
//             },
//             newSale: {
//                 cashierUsername: newSale.cashierUsername || '',
//                 invoiceNumber: newSale.invoiceNumber || '',
//                 date: newSale.date ? formatDate(newSale.date) : '',
//                 customer: newSale.customer || '',
//                 productsData: saleData.productsData.map(product => ({
//                     name: product.name || 'Unnamed Product',
//                     price: product.price || 0,
//                     quantity: product.quantity || 0,
//                     subtotal: product.subtotal || 0,
//                 })),
//                 grandTotal: newSale.grandTotal || 0,
//                 discount: newSale.discount || 0,
//                 cashBalance: newSale.cashBalance || 0,
//                 paymentType: saleData.paymentType.map(payment => ({
//                     type: payment.type || 'Unknown',
//                     amount: payment.amount || 0,
//                 })),
//                 note: newSale.note || '',
//             },
//         };

//         // Generate the bill template
//         const template = `
//         <div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0; padding: 10px; border: 1px solid #ccc; position: absolute; left: 0; top: 0;">
//         <!-- Your existing receipt content remains the same -->
//             <style>
//             @media print {
//                 body {
//                     margin: 0 !important;
//                     padding: 0 !important;
//                 }
//                 @page {
//                     margin: 0 !important;
//                     padding: 0 !important;
//                 }
//             }
//             </style>
//         <!-- Script to generate barcode (will run when HTML is rendered) -->
//             <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
//             <script>
//                 document.addEventListener('DOMContentLoaded', function() {
//                     JsBarcode('#barcode-{{newSale.invoiceNumber}}', '{{newSale.invoiceNumber}}', {
//                     format: 'CODE128',
//                     width: 1.2,
//                     height: 30,
//                     fontSize: 14,
//                     margin: 5,
//                     displayValue: true
//                 });
//             });
//             </script>
        
//         <div style="text-align: center; margin-bottom: 10px;">
//             {{#if settings.logo}}
//             <img src="{{settings.logo}}" alt="Logo" style="max-height: 50px; margin: 2px auto;">
//             {{/if}}
//             <h2 style="margin: 5px 0;">{{settings.companyName}}</h2>
//             <p style="margin: 2px 0;">{{settings.companyAddress}}</p>
//             <p style="margin: 2px 0;">{{settings.companyMobile}}</p>
//         </div>

//         <!-- Transaction Info -->
//             <div style="margin-bottom: 10px;">
//                 <p style="margin: 3px 0; font-size: 13px;">Salesman: {{newSale.cashierUsername}}</p>
//                 <p style="margin: 3px 0; font-size: 13px;">Receipt No: {{newSale.invoiceNumber}}</p>
//                 <p style="margin: 3px 0; font-size: 13px;">Date: {{newSale.date}}</p>
//                 <p style="margin: 3px 0; font-size: 13px;">Customer: {{newSale.customer}}</p>
//             </div>

//         <!-- Products Table -->
//         <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
//             <thead>
//                 <tr>
//                     <th style="text-align: left; font-size: 13px;">Product</th>
//                     <th style="text-align: left; font-size: 13px;">Price</th>
//                     <th style="text-align: center; font-size: 13px;">Qty</th>
//                     <th style="text-align: right; font-size: 13px;">Amount</th>
//                 </tr>
//             </thead>
//         <tbody>
//             {{#each newSale.productsData}}
//             <tr>
//                 <td style="padding: 2px 0; font-size: 13px;">{{this.name}}</td>
//                 <td style="padding: 2px 0; font-size: 13px;">{{formatCurrency this.price}}</td>
//                 <td style="text-align: center; padding: 2px 0; font-size: 13px;">{{this.quantity}}</td>
//                 <td style="text-align: right; padding: 2px 0; font-size: 13px;">{{formatCurrency this.subtotal}}</td>
//             </tr>
//             {{/each}}
//         </tbody>
//        <tfoot>
//     <tr><td colspan="4" style="padding-top: 8px;"></td></tr>
//         <tr>
//             <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Total:</td>
//             <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.grandTotal}}</td>
//         </tr>
//     <tr>
//         <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Discount:</td>
//         <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.discount}}</td>
//     </tr>
    
//     <!-- Payment Details Rows -->
//     {{#each newSale.paymentType}}
//     <tr>
//         <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">{{this.type}}:</td>
//         <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency this.amount}}</td>
//     </tr>
//     {{/each}}
        
//             <tr>
//                 <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Balance:</td>
//                 <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.cashBalance}}</td>
//             </tr>
//         </tfoot>
//     </table>

//     <!-- Notes Section - Updated with text wrapping -->
//     {{#if newSale.note}}
//         <div style="margin-bottom:10px; font-size: 12px;  word-wrap: break-word; overflow-wrap: break-word;">
//             <p style="margin-top: 3px; 0; margin-bottom: 3px font-size: 12px; white-space: pre-wrap; word-break: break-word;">
//             Note:{{newSale.note}}
//         </p>
//         </div>
//         {{/if}}

//         <!-- Footer -->
//         <div style="text-align: center; margin-top: 15px; font-size: 0.8em;">
//         <p style="margin: 4px 0;">
//             *** EXCHANGE OF PRODUCTS IN RE-SALABLE CONDITION<br>
//             WITH RECEIPT WITHIN 07 DAYS ***<br>
//             THANK YOU FOR SHOPPING WITH US!<br><br>
//         </p>

//         <!-- Barcode Section -->
//         <div style="text-align: center; margin: 10px 0;">
//             <canvas id="barcode-{{newSale.invoiceNumber}}"></canvas>
//         </div>
//          <p style="margin: 4px 0;">
//             System by IDEAZONE
//         </p>
//         </div>
//     </div>`;

//         const compiledTemplate = Handlebars.compile(template);
//         const html = compiledTemplate(templateData);
//         await session.commitTransaction();
//         res.status(201).json({ message: 'Sale created successfully!', html, status: 'success' });

//     } catch (error) {
//         console.error('Error saving sale:', error);
//         await session.abortTransaction();
//         res.status(500).json({ message: error.message, status: 'unsuccess' });
//     } finally {
//         session.endSession();
//     }
// };

// const createNonPosSale = async (req, res) => {
//     try {
//         const saleData = req.body;
//         const referenceId = await generateReferenceId('SALE');
//         saleData.refferenceId = referenceId;

//         // Validation checks using isEmpty
//         if (isEmpty(saleData.warehouse) && isEmpty(saleData.warehouseId)) {
//             return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
//         }
//         if (isEmpty(saleData.refferenceId)) {
//             return res.status(400).json({ message: 'Reference ID is required.', status: 'unsuccess' });
//         }
//         if (isEmpty(saleData.date)) {
//             return res.status(400).json({ message: 'Date is required.', status: 'unsuccess' });
//         }
//         if (!saleData.productsData || saleData.productsData.length === 0) {
//             return res.status(400).json({ message: 'Products Data is required.', status: 'unsuccess' });
//         }

//         if (isEmpty(saleData.warehouse) && isEmpty(saleData.warehouses)) {
//             return res.status(400).json({ message: 'Warehouse is required.', status: 'unsuccess' });
//         }

//         // Default values for optional fields
//         saleData.cashierUsername = saleData.cashierUsername || 'Unknown';
//         saleData.warehouse = saleData.warehouse || saleData.warehouseId;

//         if (!Array.isArray(saleData.paymentType)) {
//             return res.status(400).json({ message: 'Invalid paymentType format.', status: 'unsuccess' });
//         }

//         const paymentTypes = saleData.paymentType.map(payment => {
//             if (!payment.type || !payment.amount) {
//                 throw new Error(`Invalid payment type: ${JSON.stringify(payment)}`);
//             }
//             return { type: payment.type, amount: Number(payment.amount) };
//         });

//         saleData.paymentType = paymentTypes;

//         const newSale = new Sale(saleData);
//         const productsData = saleData.productsData;

//         // Prepare update promises for product quantities
//         const updatePromises = productsData.map(async (product) => {
//             const { currentID, quantity, stockQty, ptype, warehouse } = product;

//             if (!mongoose.Types.ObjectId.isValid(currentID)) {
//                 return Promise.reject({ message: `Invalid product ID: ${currentID}`, status: 'unsuccess' });
//             }

//             if (!warehouse) {
//                 return Promise.reject({ message: `Warehouse not provided for product with ID: ${currentID}`, status: 'unsuccess' });
//             }

//             const updatedProduct = await Product.findById(currentID);
//             if (!updatedProduct) {
//                 return Promise.reject({ message: `Product not found with ID: ${currentID}`, status: 'unsuccess' });
//             }

//             const warehouseData = updatedProduct.warehouse.get(warehouse);
//             if (!warehouseData) {
//                 console.error(`Error: Warehouse ${warehouse} not found for product ID: ${currentID}`);
//                 return Promise.reject({
//                     message: `Warehouse with ID ${warehouse} not found for product with ID: ${currentID}`,
//                     status: 'unsuccess'
//                 });
//             }

//             if (ptype === 'Single') {
//                 console.log(`Debug: Current stock for product ${currentID} in warehouse ${warehouse}:`, warehouseData.productQty);

//                 if (warehouseData.productQty < quantity) {
//                     console.error(`Error: Insufficient stock for product ${currentID} (Available: ${warehouseData.productQty}, Required: ${quantity})`);
//                     return Promise.reject({ message: `Insufficient stock for product with ID: ${currentID}`, status: 'unsuccess' });
//                 }

//                 warehouseData.productQty -= quantity;
//             } else if (ptype === 'Variation') {
//                 const variationKey = product.variationValue;
//                 const variation = warehouseData.variationValues?.get(variationKey);

//                 if (!variation) {
//                     return Promise.reject({ message: `Variation ${variationKey} not found for product with ID: ${currentID}`, status: 'unsuccess' });
//                 }

//                 if (variation.productQty < quantity) {
//                     return Promise.reject({ message: `Insufficient stock for variation ${variationKey} of product with ID: ${currentID}`, status: 'unsuccess' });
//                 }

//                 variation.productQty -= quantity;
//             } else {
//                 return Promise.reject({ message: `Invalid product type for product with ID: ${currentID}`, status: 'unsuccess' });
//             }

//             // Update the warehouse map with the modified data
//             updatedProduct.warehouse.set(warehouse, warehouseData);

//             await updatedProduct.save();
//             return updatedProduct;
//         });

//         await Promise.all(updatePromises);
//         await newSale.save();

//         res.status(201).json({ message: 'Non-POS Sale created successfully!', sale: newSale, status: 'success' });
//     } catch (error) {
//         console.error('Error saving Non-POS sale:', error);
//         res.status(500).json({ message: 'Error saving Non-POS sale', error: error.message, status: 'unsuccess' });
//     }
// };



// // Delete a sale
// const deleteSale = async (req, res) => {
//     const { id } = req.params; // Get the sale ID from the request parameters
//     if (!id) {
//         return res.status(400).json({ message: 'ID is required' });
//     }
//     try {
//         const deletedSale = await Sale.findByIdAndDelete(id); // Delete the sale by ID
//         if (!deletedSale) {
//             return res.status(404).json({ message: 'Sale not found' }); // If no sale is found, send 404
//         }
//         res.status(200).json({ message: 'Sale deleted successfully!', sale: deletedSale }); // Send success response
//     } catch (error) {
//         console.error('Error deleting sale:', error);
//         res.status(500).json({ message: 'Error deleting sale', error });
//     }
// };

// const payingForSale = async (req, res) => {
//     const { saleId, amountToPay, payingAmount, paymentType, currentDate } = req.body;

//     try {
//         // Find the sale by ID
//         const sale = await Sale.findById(saleId);
//         if (!sale) {
//             return res.status(404).json({ error: 'Sale not found' });
//         }

//         // Ensure amount values are numbers
//         if (typeof sale.grandTotal !== 'number' || typeof sale.paidAmount !== 'number') {
//             return res.status(400).json({ message: 'Invalid sale amount data' });
//         }

//         // Convert values to numbers
//         const numericPayingAmount = Number(payingAmount);
//         const numericAmountToPay = Number(amountToPay);

//         // Ensure payment doesn't exceed the total amount
//         const newTotalPaidAmount = sale.paidAmount + numericPayingAmount;
//         if (newTotalPaidAmount > numericAmountToPay) {
//             return res.status(400).json({ message: 'Payment exceeds the amount to pay.' });
//         }

//         // Create a new payment entry
//         const newPayment = new SalePayment({
//             saleId,
//             amountToPay: numericAmountToPay,
//             payingAmount: numericPayingAmount,
//             currentDate: currentDate || Date.now(),
//             paymentType: paymentType || 'Default',
//         });

//         await newPayment.save();
//         const existingPaymentIndex = sale.paymentType.findIndex(pt => pt.type === paymentType);

//         if (existingPaymentIndex !== -1) {
//             sale.paymentType[existingPaymentIndex].amount += numericPayingAmount;
//         } else {
//             sale.paymentType.push({ type: paymentType, amount: numericPayingAmount });
//         }

//         sale.paidAmount = newTotalPaidAmount;
//         const allPayments = await SalePayment.find({ saleId });
//         const totalPaidAmount = allPayments.reduce((sum, payment) => sum + payment.payingAmount, 0);

//         const dueAmount = numericAmountToPay - totalPaidAmount;

//         if (totalPaidAmount === 0) {
//             sale.paymentStatus = 'unpaid';
//         } else if (totalPaidAmount >= sale.grandTotal) {
//             sale.paymentStatus = 'paid';
//         } else if (totalPaidAmount > 0 && totalPaidAmount < sale.grandTotal) {
//             sale.paymentStatus = 'partial';
//         }

//         await sale.save();

//         return res.status(201).json({
//             message: 'Payment recorded successfully',
//             payment: newPayment,
//             sale: {
//                 saleId: sale._id,
//                 paidAmount: totalPaidAmount,
//                 dueAmount: dueAmount,
//                 paymentStatus: sale.paymentStatus,
//                 paymentDetails: sale.paymentType,
//             }
//         });

//     } catch (error) {
//         console.error('Error recording payment:', error);
//         res.status(500).json({ error: 'An error occurred while processing the payment' });
//     }
// };

// const deletePaymentOfSale = async (req, res) => {
//     const { id } = req.params; // Payment ID
//     try {
//         // Find the payment to delete
//         const payment = await SalePayment.findById(id);
//         if (!payment) {
//             return res.status(404).json({ message: 'Payment not found' });
//         }

//         const saleId = payment.saleId;

//         // Find the associated sale
//         const sale = await Sale.findById(saleId);
//         if (!sale) {
//             return res.status(404).json({ message: 'Sale not found' });
//         }

//         // Subtract the payment amount from the sale's paidAmount
//         sale.paidAmount -= payment.payingAmount;

//         // Ensure paidAmount doesn't fall below 0
//         if (sale.paidAmount < 0) {
//             sale.paidAmount = 0;
//         }

//         // Recalculate the payment status
//         if (sale.paidAmount === 0) {
//             sale.paymentStatus = 'Unpaid';
//         } else if (sale.paidAmount >= sale.grandTotal) {
//             sale.paymentStatus = 'Paid';
//         } else {
//             sale.paymentStatus = 'Partial';
//         }

//         // Save the updated sale
//         await sale.save();

//         // Delete the payment
//         await SalePayment.findByIdAndDelete(id);

//         return res.status(200).json({
//             message: 'Payment deleted successfully',
//             sale: {
//                 saleId: sale._id,
//                 paidAmount: sale.paidAmount,
//                 paymentStatus: sale.paymentStatus,
//             },
//         });
//     } catch (error) {
//         console.error('Error deleting payment:', error);
//         res.status(500).json({ error: 'An error occurred while deleting the payment' });
//     }
// };

// // Controller to fetch payment by sale Id
// const fetchPaymentBySaleId = async (req, res) => {
//     const { saleId } = req.params;
//     try {
//         const paymentData = await SalePayment.find({ saleId: saleId });
//         if (!paymentData || paymentData.length === 0) {
//             return res.status(404).json({ message: 'No payments found for this sale ID' });
//         }
//         res.status(200).json({ payments: paymentData });
//     } catch (error) {
//         console.error('Error fetching payment data:', error);
//         res.status(500).json({ error: 'An error occurred while fetching payment data' });
//     }
// };


// const findSaleById = async (req, res) => {
//     const { id } = req.params;
//     console.log("🔍 Received request to fetch sale by ID:", id);

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: 'Invalid sale ID format' });
//     }

//     try {
//         const sale = await Sale.findById(id).lean(); // Using lean() to get a plain object
//         console.log("📦 Full Sale Data Fetched from DB:", JSON.stringify(sale, null, 2));
//         if (!sale) {
//             return res.status(404).json({ message: 'Sale not found' });
//         }

//         const productIds = sale.productsData.map(product => product.currentID);
//         console.log("🆔 Extracted Product IDs:", productIds);

//         const products = await Product.find({ _id: { $in: productIds } }).lean(); // Using lean() to get plain objects
//         console.log("📦 Full Product Data Fetched from DB:", JSON.stringify(products, null, 2));

//         const updatedProductsData = sale.productsData.map(productData => {
//             const baseProduct = products.find(p => p._id.toString() === productData.currentID);
//             const warehouseKey = productData.warehouse;
//             if (baseProduct) {
//                 console.log(`Base product found for ID ${productData.currentID}:`, JSON.stringify(baseProduct, null, 2));
//                 let stockQty = "";
//                 let productCost = ""

//                 const selectedWarehouse = baseProduct.warehouse[warehouseKey];
//                 console.log(`Warehouse data for product ${baseProduct._id}:`, JSON.stringify(selectedWarehouse, null, 2));

//                 if (!selectedWarehouse) {
//                     console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
//                     return {
//                         ...productData,
//                         stockQty: "N/A",
//                         productCost
//                     };
//                 }

//                 if (productData.variationValue && selectedWarehouse.variationValues) {
//                     const variation = selectedWarehouse.variationValues[productData.variationValue];
//                     if (variation) {
//                         stockQty = variation.productQty || "";
//                         productCost = variation.productCost || "";
//                     } else {
//                         console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
//                     }
//                 } else {
//                     stockQty = selectedWarehouse.productQty || "";
//                     productCost = selectedWarehouse.productCost || "";
//                 }

//                 console.log(`Calculated stockQty for product ${productData.currentID}: ${stockQty}`);
//                 return {
//                     currentID: productData.currentID,
//                     variationValues: selectedWarehouse.variationValues,
//                     selectedVariation: productData.variationValue,
//                     name: productData.name,
//                     price: productData.price,
//                     productCost,
//                     ptype: productData.ptype,
//                     discount: productData.discount,
//                     specialDiscount: productData.specialDiscount,
//                     quantity: productData.quantity,
//                     stockQty,
//                     taxRate: productData.taxRate,
//                     subtotal: productData.subtotal,
//                     warehouse: productData.warehouse,
//                     _id: productData._id
//                 };
//             }

//             console.warn(`Base product with currentID ${productData.currentID} not found.`);
//             // Return original product data if no base product found
//             return productData;
//         });

//         const saleWithUpdatedProducts = {
//             ...sale,
//             productsData: updatedProductsData
//         };

//         console.log("🚀 Final Sale Data Sent to Frontend:", JSON.stringify(saleWithUpdatedProducts, null, 2));
//         res.status(200).json(saleWithUpdatedProducts);
//     } catch (error) {
//         console.error('❌ Error finding sale by ID:', error);
//         res.status(500).json({ message: 'Error fetching sale by ID', error: error.message });
//     }
// };

// const updateSale = async (req, res) => {
//     try {
//         const saleId = req.params.id;
//         const updateData = req.body;

//         console.log("\uD83D\uDEE0\uFE0F Received request to update sale ID:", saleId);
//         console.log("\uD83D\uDCE5 Update Data:", JSON.stringify(updateData, null, 2));

//         if (!updateData.date || !updateData.paymentStatus || !updateData.orderStatus || !updateData.paymentType) {
//             return res.status(400).json({ message: 'Missing required fields.', status: 'unsuccess' });
//         }

//         updateData.cashierUsername = updateData.cashierUsername || 'Unknown';
//         updateData.paymentType = updateData.paymentType || [];
//         updateData.orderStatus = updateData.orderStatus || 'ordered';
//         updateData.customer = updateData.customer || 'Unknown';

//         console.log("\uD83D\uDD0D Fetching existing sale from DB...");
//         const existingSale = await Sale.findById(saleId);
//         if (!existingSale) {
//             console.error("❌ Sale not found:", saleId);
//             return res.status(404).json({ message: 'Sale not found', status: 'unsuccess' });
//         }

//         console.log("\uD83D\uDCE6 Existing Sale Data:", JSON.stringify(existingSale, null, 2));

//         const existingProducts = existingSale.productsData;
//         const updatedProducts = updateData.productsData;

//         console.log("\uD83D\uDD04 Processing updated products...");
//         let errors = [];

//         await Promise.all(updatedProducts.map(async (product) => {
//             try {
//                 const { currentID, quantity: newQuantity, ptype, variationValue } = product;
//                 const warehouse = product.warehouse || updateData.warehouse;

//                 console.log("🔖 Processing Product:", currentID, "| Warehouse:", warehouse);

//                 const updatedProduct = await Product.findById(currentID);
//                 if (!updatedProduct) {
//                     errors.push(`Product not found with ID: ${currentID}`);
//                     return;
//                 }

//                 console.log("🏪 Fetching warehouse data...");
//                 const warehouseData = updatedProduct.warehouse.get(warehouse);

//                 if (!warehouseData) {
//                     console.warn(`⚠️ Warehouse ${warehouse} not found.`);
//                     return;
//                 }

//                 console.log("📊 Adjusting stock quantity...");
//                 const existingProduct = existingProducts.find(p => p.currentID === currentID);
//                 const previousQuantity = existingProduct ? existingProduct.quantity : 0;
//                 const quantityDifference = newQuantity - previousQuantity;

//                 // FIXED: Changed from existingPurchase.warehouse to existingSale.warehouse
//                 const warehouseKey = existingProduct?.warehouse || existingSale.warehouse;

//                 if (ptype === 'Single') {
//                     const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);
//                     if (!selectedWarehouse) {
//                         throw new Error(`Warehouse ${warehouseKey} not found for product with ID: ${currentID}`);
//                     }
//                     if (quantityDifference < 0 && selectedWarehouse.productQty < Math.abs(quantityDifference)) {
//                         throw new Error(`Insufficient stock for product ID: ${currentID}`);
//                     }
//                     selectedWarehouse.productQty -= quantityDifference;
//                 } else if (ptype === 'Variation') {
//                     const selectedWarehouse = updatedProduct.warehouse.get(warehouseKey);
//                     if (!selectedWarehouse) {
//                         throw new Error(`Warehouse ${warehouseKey} not found for product with ID: ${currentID}`);
//                     }
//                     const variation = selectedWarehouse.variationValues.get(variationValue);
//                     if (!variation) {
//                         throw new Error(`Variation ${variationValue} not found for product ID: ${currentID}`);
//                     }
//                     if (quantityDifference < 0 && variation.productQty < Math.abs(quantityDifference)) {
//                         throw new Error(`Insufficient variation stock for product ID: ${currentID}`);
//                     }
//                     variation.productQty -= quantityDifference;
//                     updatedProduct.markModified(`warehouse.${warehouseKey}.variationValues`);
//                 } else {
//                     errors.push(`Invalid product type for product with ID: ${currentID}`);
//                     return;
//                 }

//                 // Ensure warehouse update is saved
//                 updatedProduct.warehouse.set(warehouse, warehouseData);
//                 updatedProduct.markModified("warehouse");
//                 await updatedProduct.save();

//                 console.log(`✅ Stock updated in DB for ${currentID}:`, warehouseData.productQty);
//             } catch (err) {
//                 console.error(`❌ Error processing product ${product.currentID}:`, err);
//                 errors.push(`Error processing product ${product.currentID}: ${err.message}`);
//             }
//         }));

//         if (errors.length > 0) {
//             return res.status(400).json({ message: "Error updating products", details: errors });
//         }

//         console.log("✅ All product updates completed successfully.");

//         updateData.productsData = updateData.productsData.map(product => ({
//             ...product,
//             warehouse: product.warehouse || updateData.warehouse || 'default_warehouse',
//         }));

//         console.log("\uD83D\uDD04 Updating sale in DB...");
//         const updatedSale = await Sale.findByIdAndUpdate(
//             saleId,
//             { ...updateData, warehouse: existingSale.warehouse, customer: existingSale.customer },
//             { new: true, runValidators: true }
//         );

//         console.log("\uD83D\uDCB0 Updating cash register balance...");
//         const previousPaidAmount = parseFloat(existingSale.paidAmount);
//         const newPaidAmount = parseFloat(updateData.paidAmount);
//         const paidAmountDifference = newPaidAmount - previousPaidAmount;

//         const cashRegister = await Cash.findOne();
//         if (cashRegister) {
//             cashRegister.totalBalance = parseFloat(cashRegister.totalBalance) + paidAmountDifference;
//             await cashRegister.save();
//         } else {
//             return res.status(200).json({ message: 'Cash register not found' });
//         }

//         // Update SalePayment model for payment type changes
//         const existingPayments = await SalePayment.find({ saleId });
//         const updatedPaymentTypes = updateData.paymentType;

//         for (const paymentType of updatedPaymentTypes) {
//             const existingPayment = existingPayments.find(payment => payment.paymentType === paymentType.type);
//             if (existingPayment) {
//                 existingPayment.payingAmount = paymentType.amount;
//                 await existingPayment.save();
//             } else {
//                 const newPayment = new SalePayment({
//                     saleId,
//                     amountToPay: updatedSale.grandTotal,
//                     payingAmount: paymentType.amount,
//                     currentDate: updateData.date || Date.now(),
//                     paymentType: paymentType.type,
//                 });
//                 await newPayment.save();
//             }
//         }

//         console.log("✅ Sale update successful:", JSON.stringify(updatedSale, null, 2));
//         return res.status(200).json({ message: 'Sale updated successfully', sale: updatedSale });
//     } catch (error) {
//         console.error('❌ Error updating sale:', error);
//         return res.status(500).json({ message: 'Failed to update sale', error: error.message });
//     }
// };


// //Delete a product from sale
// const deleteProductFromSale = async (req, res) => {
//     const { saleID, productID, total } = req.query; // `productID` refers to `currentID` in `productsData`
//     if (!saleID) {
//         return res.status(400).json({ message: 'sale ID is required' });
//     }
//     if (!productID) {
//         return res.status(400).json({ message: 'product ID is required' });
//     }
//     try {
//         // Step 1: Find the sale by saleID
//         const sale = await Sale.findById(saleID);
//         if (!sale) {
//             return res.status(404).json({ message: 'Sale not found' });
//         }

//         // Step 2: Check if the product exists in the sale's productsData
//         const productToDelete = sale.productsData.find(product => product.currentID === productID);
//         if (!productToDelete) {
//             return res.status(404).json({ message: 'Product not found in sale' });
//         }

//         // Step 3: Calculate the new grandTotal after removing the product's subtotal
//         const newGrandTotal = sale.grandTotal - productToDelete.subtotal;

//         // Step 4: Update the sale by pulling the product out of productsData and updating grandTotal
//         const updatedSale = await Sale.findByIdAndUpdate(
//             saleID,
//             {
//                 $pull: { productsData: { currentID: productID } }, // Remove the product from the array
//                 grandTotal: newGrandTotal // Update the grandTotal
//             },
//             { new: true } // Return the updated document
//         );

//         // Step 5: Respond with success if the sale was updated
//         if (updatedSale) {
//             res.status(200).json({ message: "Product deleted successfully", sale: updatedSale });
//         } else {
//             res.status(404).json({ message: "Sale not found" });
//         }
//     } catch (error) {
//         console.error("Error deleting product from sale:", error);
//         res.status(500).json({ message: "An error occurred while deleting the product" });
//     }
// };

// // Backend Controller to Fetch Sales
// const fetchSales = async (req, res) => {
//     const { id, keyword } = req.query;
//     try {
//         let sales;

//         // Fetch by ID if 'id' is provided in query
//         if (id) {
//             if (!mongoose.Types.ObjectId.isValid(id)) {
//                 return res.status(400).json({ message: 'Invalid sale ID format' });
//             }

//             // Fetch sale as a plain JavaScript object with .lean()
//             const sale = await Sale.findById(id).lean();
//             if (!sale) {
//                 return res.status(404).json({ message: 'Sale not found' });
//             }

//             const productIds = sale.productsData.map(product => product.currentID);
//             const products = await Product.find({ _id: { $in: productIds } }).lean();
//             const updatedProductsData = sale.productsData.map(productData => {
//                 const baseProduct = products.find(p => p._id.toString() === productData.currentID);

//                 let stockQty = "";
//                 if (baseProduct) {
//                     if (baseProduct.variationValues && baseProduct.variationValues.size > 0) {
//                         const variation = baseProduct.variationValues.get(productData.variationValue);
//                         stockQty = variation ? variation.productQty || "" : "";
//                     } else {
//                         stockQty = baseProduct.productQty || "";
//                     }
//                 }
//                 return {
//                     ...productData,
//                     stockQty
//                 };
//             });
//             // Create the final sale object with updated productsData
//             const saleWithUpdatedProducts = {
//                 ...sale,
//                 productsData: updatedProductsData
//             };

//             // Send the response with the updated sale object
//             return res.status(200).json(saleWithUpdatedProducts);
//         }

//         // Fetch by keyword (matches customer name or reference ID)
//         if (keyword) {
//             if (keyword.length < 1) {
//                 return res.status(400).json({ message: 'Please provide a valid keyword.' });
//             }

//             sales = await Sale.find({
//                 $or: [
//                     { customer: { $regex: new RegExp(keyword, 'i') } },
//                     { refferenceId: { $regex: new RegExp(keyword, 'i') } }
//                 ]
//             });

//             if (!sales || sales.length === 0) {
//                 return res.status(404).json({ message: 'No sales found matching the provided keyword.' });
//             }

//             return res.status(200).json(sales);
//         }
//         if (req.query.page) {
//             const size = parseInt(req.query.page.size) || 10; // Default size is 10
//             const number = parseInt(req.query.page.number) || 1; // Default page number is 1
//             const offset = (number - 1) * size; // Calculate the offset for pagination
//             // const sort = req.query.sort || ''; // Handle sorting if provided

//             sales = await Sale.find()
//                 .sort({ createdAt: -1 })
//                 .skip(offset)
//                 .limit(size);

//             const totalSales = await Sale.countDocuments(); // Total sales count
//             return res.status(200).json({
//                 sales,
//                 total: totalSales,
//                 size,
//                 number,
//                 totalPages: Math.ceil(totalSales / size)
//             });
//         } else {
//             sales = await Sale.find();
//             if (!sales || sales.length === 0) {
//                 return res.status(404).json({ message: 'No sales found.' });
//             }

//             return res.status(200).json(sales);
//         }

//     } catch (error) {
//         console.error('Error fetching sales:', error);
//         res.status(500).json({ message: 'Error fetching sales', error: error.message });
//     }
// };

// const searchSale = async (req, res) => {
//     const { keyword } = req.query; // Get keyword from query params

//     try {
//         if (!keyword) {
//             return res.status(400).json({
//                 status: "error",
//                 message: "Keyword is required for search."
//             });
//         }

//         // Escape special regex characters in the keyword to prevent regex injection
//         const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//         // Build query to search by customer, reference ID, or invoice number
//         const query = {
//             $or: [
//                 { customer: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search
//                 { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } },
//                 { invoiceNumber: { $regex: new RegExp(`${escapedKeyword}`, 'i') } } // Added invoiceNumber search
//             ]
//         };

//         // Fetch sales based on the query
//         const sales = await Sale.find(query).populate('productsData.currentID', 'productName productQty');

//         if (!sales || sales.length === 0) {
//             return res.status(404).json({
//                 status: "unsuccess",
//                 message: "No sales found for the provided keyword."
//             });
//         }

//         // Format sales data if additional processing is needed
//         const formattedSales = sales.map((sale) => {
//             const saleObj = sale.toObject();

//             return {
//                 _id: saleObj._id,
//                 refferenceId: saleObj.refferenceId,
//                 invoiceNumber: saleObj.invoiceNumber, // Ensure invoice number is included in the response
//                 customer: saleObj.customer,
//                 grandTotal: saleObj.grandTotal,
//                 orderStatus: saleObj.orderStatus,
//                 paymentStatus: saleObj.paymentStatus,
//                 paymentType: saleObj.paymentType,
//                 paidAmount: saleObj.paidAmount,
//                 warehouse: saleObj.warehouse,
//                 date: saleObj.date,
//                 discount: saleObj.discount,
//                 discountType: saleObj.discountType,
//                 offerPercentage: saleObj.offerPercentage,
//                 shipping: saleObj.shipping,
//                 tax: saleObj.tax,
//                 productsData: saleObj.productsData, // Include product details
//                 createdAt: saleObj.createdAt
//                     ? saleObj.createdAt.toISOString().slice(0, 10)
//                     : null,
//             };
//         });

//         return res.status(200).json({
//             status: "success",
//             sales: formattedSales
//         });
//     } catch (error) {
//         console.error("Search sales error:", error);
//         return res.status(500).json({
//             status: "error",
//             message: error.message
//         });
//     }
// };


// const fetchTodaySales = async (req, res) => {
//     try {
//         const todayStart = new Date();
//         todayStart.setHours(0, 0, 0, 0);

//         const todayEnd = new Date();
//         todayEnd.setHours(23, 59, 59, 999);

//         const sales = await Sale.find({
//             date: {
//                 $gte: todayStart,
//                 $lte: todayEnd
//             }
//         }).lean();

//         if (!sales || sales.length === 0) {
//             return res.status(404).json({ message: 'No sales found for today.' });
//         }

//         const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
//         const products = await Product.find({ _id: { $in: productIds } }).lean();

//         const salesWithUpdatedProducts = sales.map(sale => {
//             const updatedProductsData = sale.productsData.map(productData => {
//                 const baseProduct = products.find(p => p._id.toString() === productData.currentID);
//                 const warehouseKey = productData.warehouse;

//                 if (baseProduct) {
//                     let stockQty = "";
//                     let productCost = "";
//                     const selectedWarehouse = baseProduct.warehouse[warehouseKey];

//                     if (!selectedWarehouse) {
//                         console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
//                         return {
//                             ...productData,
//                             stockQty: "N/A",
//                             productCost
//                         };
//                     }

//                     if (productData.variationValue && selectedWarehouse.variationValues) {
//                         const variation = selectedWarehouse.variationValues[productData.variationValue];
//                         if (variation) {
//                             stockQty = variation.productQty || "";
//                             productCost = variation.productCost || "";
//                         } else {
//                             console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
//                         }
//                     } else {
//                         stockQty = selectedWarehouse.productQty || "";
//                         productCost = selectedWarehouse.productCost || "";
//                     }

//                     return {
//                         currentID: productData.currentID,
//                         variationValues: selectedWarehouse.variationValues,
//                         selectedVariation: productData.variationValue,
//                         name: productData.name,
//                         price: productData.price,
//                         productCost,
//                         ptype: productData.ptype,
//                         discount: productData.discount,
//                         specialDiscount: productData.specialDiscount,
//                         quantity: productData.quantity,
//                         stockQty,
//                         taxRate: productData.taxRate,
//                         subtotal: productData.subtotal,
//                         warehouse: productData.warehouse,
//                         _id: productData._id
//                     };
//                 }
//                 console.warn(`Base product with currentID ${productData.currentID} not found.`);
//                 return productData;
//             });

//             return {
//                 ...sale,
//                 productsData: updatedProductsData
//             };
//         });

//         res.status(200).json(salesWithUpdatedProducts);
//     } catch (error) {
//         console.error('❌ Error fetching today\'s sales:', error);
//         res.status(500).json({ message: 'Error fetching today\'s sales', error: error.message });
//     }
// };

// const fetchLastWeekSales = async (req, res) => {
//     try {
//         const today = new Date();
//         const lastWeek = new Date(today);
//         lastWeek.setDate(today.getDate() - 7);
//         lastWeek.setHours(0, 0, 0, 0);
//         today.setHours(23, 59, 59, 999);

//         const sales = await Sale.find({
//             date: {
//                 $gte: lastWeek,
//                 $lte: today
//             }
//         }).lean();

//         if (!sales || sales.length === 0) {
//             return res.status(404).json({ message: 'No sales found for the last week.' });
//         }

//         const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
//         const products = await Product.find({ _id: { $in: productIds } }).lean();

//         const salesWithUpdatedProducts = sales.map(sale => {
//             const updatedProductsData = sale.productsData.map(productData => {
//                 const baseProduct = products.find(p => p._id.toString() === productData.currentID);
//                 const warehouseKey = productData.warehouse;

//                 if (baseProduct) {
//                     let stockQty = "";
//                     let productCost = "";
//                     const selectedWarehouse = baseProduct.warehouse[warehouseKey];

//                     if (!selectedWarehouse) {
//                         console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
//                         return {
//                             ...productData,
//                             stockQty: "N/A",
//                             productCost
//                         };
//                     }

//                     if (productData.variationValue && selectedWarehouse.variationValues) {
//                         const variation = selectedWarehouse.variationValues[productData.variationValue];
//                         if (variation) {
//                             stockQty = variation.productQty || "";
//                             productCost = variation.productCost || "";
//                         } else {
//                             console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
//                         }
//                     } else {
//                         stockQty = selectedWarehouse.productQty || "";
//                         productCost = selectedWarehouse.productCost || "";
//                     }

//                     return {
//                         currentID: productData.currentID,
//                         variationValues: selectedWarehouse.variationValues,
//                         selectedVariation: productData.variationValue,
//                         name: productData.name,
//                         price: productData.price,
//                         productCost,
//                         ptype: productData.ptype,
//                         discount: productData.discount,
//                         specialDiscount: productData.specialDiscount,
//                         quantity: productData.quantity,
//                         stockQty,
//                         taxRate: productData.taxRate,
//                         subtotal: productData.subtotal,
//                         warehouse: productData.warehouse,
//                         productProfit: productData.productProfit,
//                         _id: productData._id
//                     };
//                 }
//                 console.warn(`Base product with currentID ${productData.currentID} not found.`);
//                 return productData;
//             });

//             return {
//                 ...sale,
//                 productsData: updatedProductsData
//             };
//         });

//         res.status(200).json(salesWithUpdatedProducts);
//     } catch (error) {
//         console.error('❌ Error fetching last week\'s sales:', error);
//         res.status(500).json({ message: 'Error fetching last week\'s sales', error: error.message });
//     }
// };


// const fetchLastMonthSales = async (req, res) => {
//     try {
//         const today = new Date();
//         const lastMonth = new Date(today);
//         lastMonth.setMonth(today.getMonth() - 1);
//         lastMonth.setHours(0, 0, 0, 0); // Ensure start of the day for last month
//         today.setHours(23, 59, 59, 999); // Ensure end of the day for today

//         const sales = await Sale.find({
//             date: {
//                 $gte: lastMonth,
//                 $lte: today
//             }
//         }).lean();

//         if (!sales || sales.length === 0) {
//             return res.status(404).json({ message: 'No sales found for the last month.' });
//         }

//         const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
//         const products = await Product.find({ _id: { $in: productIds } }).lean();

//         const salesWithUpdatedProducts = sales.map(sale => {
//             const updatedProductsData = sale.productsData.map(productData => {
//                 const baseProduct = products.find(p => p._id.toString() === productData.currentID);
//                 const warehouseKey = productData.warehouse;

//                 if (baseProduct) {
//                     let stockQty = "";
//                     let productCost = "";
//                     const selectedWarehouse = baseProduct.warehouse[warehouseKey];

//                     if (!selectedWarehouse) {
//                         console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
//                         return {
//                             ...productData,
//                             stockQty: "N/A",
//                             productCost
//                         };
//                     }

//                     if (productData.variationValue && selectedWarehouse.variationValues) {
//                         const variation = selectedWarehouse.variationValues[productData.variationValue];
//                         if (variation) {
//                             stockQty = variation.productQty || "";
//                             productCost = variation.productCost || "";
//                         } else {
//                             console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
//                         }
//                     } else {
//                         stockQty = selectedWarehouse.productQty || "";
//                         productCost = selectedWarehouse.productCost || "";
//                     }

//                     return {
//                         currentID: productData.currentID,
//                         variationValues: selectedWarehouse.variationValues,
//                         selectedVariation: productData.variationValue,
//                         name: productData.name,
//                         price: productData.price,
//                         productCost,
//                         ptype: productData.ptype,
//                         discount: productData.discount,
//                         specialDiscount: productData.specialDiscount,
//                         quantity: productData.quantity,
//                         stockQty,
//                         taxRate: productData.taxRate,
//                         subtotal: productData.subtotal,
//                         warehouse: productData.warehouse,
//                         _id: productData._id
//                     };
//                 }
//                 console.warn(`Base product with currentID ${productData.currentID} not found.`);
//                 return productData;
//             });

//             return {
//                 ...sale,
//                 productsData: updatedProductsData
//             };
//         });
//         res.status(200).json(salesWithUpdatedProducts);
//     } catch (error) {
//         console.error('❌ Error fetching last month\'s sales:', error);
//         res.status(500).json({ message: 'Error fetching last month\'s sales', error: error.message });
//     }
// };

// const fetchLastYearSales = async (req, res) => {
//     try {
//         const today = new Date();
//         const lastYear = new Date(today);
//         lastYear.setFullYear(today.getFullYear() - 1);
//         lastYear.setHours(0, 0, 0, 0); // Ensure start of the day for last year
//         today.setHours(23, 59, 59, 999); // Ensure end of the day for today

//         const sales = await Sale.find({
//             date: {
//                 $gte: lastYear,
//                 $lte: today
//             }
//         }).lean();

//         if (!sales || sales.length === 0) {
//             return res.status(404).json({ message: 'No sales found for the last year.' });
//         }

//         const productIds = sales.flatMap(sale => sale.productsData.map(product => product.currentID));
//         const products = await Product.find({ _id: { $in: productIds } }).lean();

//         const salesWithUpdatedProducts = sales.map(sale => {
//             const updatedProductsData = sale.productsData.map(productData => {
//                 const baseProduct = products.find(p => p._id.toString() === productData.currentID);
//                 const warehouseKey = productData.warehouse;

//                 if (baseProduct) {
//                     let stockQty = "";
//                     let productCost = "";
//                     const selectedWarehouse = baseProduct.warehouse[warehouseKey];

//                     if (!selectedWarehouse) {
//                         console.error(`Warehouse ${warehouseKey} not found for product with ID: ${baseProduct._id}`);
//                         return {
//                             ...productData,
//                             stockQty: "N/A",
//                             productCost
//                         };
//                     }

//                     if (productData.variationValue && selectedWarehouse.variationValues) {
//                         const variation = selectedWarehouse.variationValues[productData.variationValue];
//                         if (variation) {
//                             stockQty = variation.productQty || "";
//                             productCost = variation.productCost || "";
//                         } else {
//                             console.error(`Variation ${productData.variationValue} not found for product with ID: ${baseProduct._id}`);
//                         }
//                     } else {
//                         stockQty = selectedWarehouse.productQty || "";
//                         productCost = selectedWarehouse.productCost || "";
//                     }

//                     return {
//                         currentID: productData.currentID,
//                         variationValues: selectedWarehouse.variationValues,
//                         selectedVariation: productData.variationValue,
//                         name: productData.name,
//                         price: productData.price,
//                         productCost,
//                         ptype: productData.ptype,
//                         discount: productData.discount,
//                         specialDiscount: productData.specialDiscount,
//                         quantity: productData.quantity,
//                         stockQty,
//                         taxRate: productData.taxRate,
//                         subtotal: productData.subtotal,
//                         warehouse: productData.warehouse,
//                         _id: productData._id
//                     };
//                 }
//                 console.warn(`Base product with currentID ${productData.currentID} not found.`);
//                 return productData;
//             });

//             return {
//                 ...sale,
//                 productsData: updatedProductsData
//             };
//         });

//         res.status(200).json(salesWithUpdatedProducts);
//     } catch (error) {
//         console.error('❌ Error fetching last year\'s sales:', error);
//         res.status(500).json({ message: 'Error fetching last year\'s sales', error: error.message });
//     }
// };

// // GET /api/printInvoice/:saleId
// const printInvoice = async (req, res) => {
//     try {
//         const { saleId } = req.params;
//         const sale = await Sale.findById(saleId).lean();
//         const settings = await Settings.findOne();

//         if (!sale || !settings) {
//             return res.status(404).json({ message: 'Sale or settings not found' });
//         }

//         const baseUrl = `${req.protocol}://${req.get('host')}`;
//         const logoUrl = settings.logo
//             ? `${baseUrl}/${settings.logo.replace(/\\/g, "/")}`
//             : null;

//         const templateData = {
//             settings: {
//                 companyName: settings.companyName || 'IDEAZONE',
//                 companyAddress: settings.address || 'Address: XXX-XXX-XXXX',
//                 companyMobile: settings.companyMobile || 'Phone: XXX-XXX-XXXX',
//                 logo: logoUrl,
//             },
//             newSale: {
//                 cashierUsername: sale.cashierUsername || '',
//                 invoiceNumber: sale.invoiceNumber || '',
//                 date: sale.date ? formatDate(sale.date) : '',
//                 customer: sale.customer || '',
//                 productsData: sale.productsData.map(product => ({
//                     name: product.name,
//                     warranty: product.warranty || '',
//                     price: product.price,
//                     quantity: product.quantity,
//                     subtotal: product.subtotal,
//                 })),
//                 grandTotal: sale.grandTotal,
//                 discount: sale.discount || 0,
//                 cashBalance: sale.cashBalance || 0,
//                 paymentType: sale.paymentType,
//                 note: sale.note || '',
//             },
//         };

//         const invoiceTemplate = `
//         <div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0; padding: 10px; border: 1px solid #ccc; position: absolute; left: 0; top: 0;">
//         <!-- Your existing receipt content remains the same -->
//             <style>
//             @media print {
//                 body {
//                     margin: 0 !important;
//                     padding: 0 !important;
//                 }
//                 @page {
//                     margin: 0 !important;
//                     padding: 0 !important;
//                 }
//             }
//             </style>
//         <!-- Script to generate barcode (will run when HTML is rendered) -->
//             <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
//             <script>
//                 document.addEventListener('DOMContentLoaded', function() {
//                     JsBarcode('#barcode-{{newSale.invoiceNumber}}', '{{newSale.invoiceNumber}}', {
//                     format: 'CODE128',
//                     width: 1.2,
//                     height: 30,
//                     fontSize: 14,
//                     margin: 5,
//                     displayValue: true
//                 });
//             });
//             </script>
        
//         <div style="text-align: center; margin-bottom: 10px;">
//             {{#if settings.logo}}
//             <img src="{{settings.logo}}" alt="Logo" style="max-height: 50px; margin: 2px auto;">
//             {{/if}}
//             <h2 style="margin: 5px 0;">{{settings.companyName}}</h2>
//             <p style="margin: 2px 0;">{{settings.companyAddress}}</p>
//             <p style="margin: 2px 0;">{{settings.companyMobile}}</p>
//         </div>

//         <!-- Transaction Info -->
//             <div style="margin-bottom: 10px;">
//                 <p style="margin: 3px 0; font-size: 13px;">Salesman: {{newSale.cashierUsername}}</p>
//                 <p style="margin: 3px 0; font-size: 13px;">Receipt No: {{newSale.invoiceNumber}}</p>
//                 <p style="margin: 3px 0; font-size: 13px;">Date: {{newSale.date}}</p>
//                 <p style="margin: 3px 0; font-size: 13px;">Customer: {{newSale.customer}}</p>
//             </div>

//         <!-- Products Table -->
//         <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
//             <thead>
//                 <tr>
//                     <th style="text-align: left; font-size: 13px;">Product</th>
//                     <th style="text-align: left; font-size: 13px;">Price</th>
//                     <th style="text-align: center; font-size: 13px;">Qty</th>
//                     <th style="text-align: right; font-size: 13px;">Amount</th>
//                 </tr>
//             </thead>
//         <tbody>
//             {{#each newSale.productsData}}
//             <tr>
//                 <td style="padding: 2px 0; font-size: 13px;">{{this.name}}</td>
//                 <td style="padding: 2px 0; font-size: 13px;">{{formatCurrency this.price}}</td>
//                 <td style="text-align: center; padding: 2px 0; font-size: 13px;">{{this.quantity}}</td>
//                 <td style="text-align: right; padding: 2px 0; font-size: 13px;">{{formatCurrency this.subtotal}}</td>
//             </tr>
//             {{/each}}
//         </tbody>
//        <tfoot>
//     <tr><td colspan="4" style="padding-top: 8px;"></td></tr>
//         <tr>
//             <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Total:</td>
//             <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.grandTotal}}</td>
//         </tr>
//     <tr>
//         <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Discount:</td>
//         <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.discount}}</td>
//     </tr>
    
//     <!-- Payment Details Rows -->
//     {{#each newSale.paymentType}}
//     <tr>
//         <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">{{this.type}}:</td>
//         <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency this.amount}}</td>
//     </tr>
//     {{/each}}
        
//             <tr>
//                 <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 14px;">Balance:</td>
//                 <td style="text-align: right; padding: 2px 0; font-size: 14px;">{{formatCurrency newSale.cashBalance}}</td>
//             </tr>
//         </tfoot>
//     </table>

//     <!-- Notes Section - Updated with text wrapping -->
//     {{#isValidNote newSale.note}}
//         <div style="margin-bottom:10px; font-size: 12px;  word-wrap: break-word; overflow-wrap: break-word;">
//             <p style="margin-top: 3px; 0; margin-bottom: 3px font-size: 12px; white-space: pre-wrap; word-break: break-word;">
//             Note: {{newSale.note}}
//         </p>
//         </div>
//         {{/isValidNote}}

//         <!-- Footer -->
//         <div style="text-align: center; margin-top: 15px; font-size: 0.8em;">
//         <p style="margin: 4px 0;">
//             *** EXCHANGE OF PRODUCTS IN RE-SALABLE CONDITION<br>
//             WITH RECEIPT WITHIN 07 DAYS ***<br>
//             THANK YOU FOR SHOPPING WITH US!<br><br>
//         </p>

//         <!-- Barcode Section -->
//         <div style="text-align: center; margin: 10px 0;">
//             <canvas id="barcode-{{newSale.invoiceNumber}}"></canvas>
//         </div>
//          <p style="margin: 4px 0;">
//             System by IDEAZONE
//         </p>
//         </div>
//     </div>`;

//         Handlebars.registerHelper('isValidNote', function (note, options) {
//             return note && note !== 'null' ? options.fn(this) : options.inverse(this);
//         });
                                

//         const compiledTemplate = Handlebars.compile(invoiceTemplate); //  reuse the same template string
//         const html = compiledTemplate(templateData);

//         res.status(200).json({ html, status: 'success' });
//     } catch (error) {
//         console.error('Error generating invoice HTML:', error);
//         res.status(500).json({ message: 'Error generating invoice', error: error.message });
//     }
// };

// module.exports = {
//     createSale, createNonPosSale, deleteSale, payingForSale, deletePaymentOfSale, fetchPaymentBySaleId, findSaleById, updateSale, deleteProductFromSale,
//     fetchSales, searchSale, fetchTodaySales, fetchLastWeekSales, fetchLastMonthSales, fetchLastYearSales, printInvoice
// };
