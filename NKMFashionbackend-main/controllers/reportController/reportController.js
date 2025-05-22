const Purchase = require('../../models/purchaseModel');
const PurchaseReturn = require('../../models/purchaseReturnModel');
const Sale = require('../../models/saleModel');
const SaleReturn = require('../../models/saleReturnModel');
const Customer = require('../../models/customerModel');
const Expenses = require('../../models/expensesModel');

//Get warehouse report
const getReportData = async (req, res) => {
    const { warehouse } = req.params;
    try {
        // Define the warehouse filter
        const warehouseFilter = warehouse === 'all' ? {} : { warehouse };
        const [sales, saleReturns, purchases, purchaseReturns, expenses] = await Promise.all([
            Sale.find(warehouseFilter),
            SaleReturn.find(warehouseFilter),
            Purchase.find(warehouseFilter),
            PurchaseReturn.find(warehouseFilter),
            Expenses.find(warehouseFilter)
        ]);

        // Send the filtered data in a single response
        res.status(200).json({
            message: 'Report data fetched successfully',
            data: {
                sales,
                saleReturns,
                purchases,
                purchaseReturns,
                expenses
            }
        });
    } catch (error) {
        console.error("Error getting report data:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

const getFillteredReportData = async (req, res) => {
    const { warehouse, orderStatus, paymentStatus, paymentType, date } = req.query;
    console.log( warehouse, orderStatus, paymentStatus, paymentType, date)
    try {
        // Filter logic
        const warehouseFilter = warehouse && warehouse !== 'all' ? { warehouse } : {};
        const orderStatusFilter = orderStatus && orderStatus !== 'all' ? { orderStatus } : {};
        const paymentStatusFilter = paymentStatus && paymentStatus !== 'all' ? { paymentStatus } : {};

        let paymentTypeFilter = {};
        if (paymentType && paymentType !== 'all' && paymentType.trim() !== '') {
            const paymentTypes = Array.isArray(paymentType) ? paymentType : [paymentType];
            paymentTypeFilter = {
                paymentType: {
                    $elemMatch: { type: { $in: paymentTypes } }
                }
            };
        }

        let dateFilter = {};
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            dateFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
        }

        // Combine all filters into one
        const combinedFilter = {
            ...warehouseFilter,
            ...orderStatusFilter,
            ...paymentStatusFilter,
            ...paymentTypeFilter,
            ...dateFilter
        };

        console.log('Applied Filters:', { warehouseFilter, orderStatusFilter, paymentStatusFilter, paymentTypeFilter, dateFilter });

        // Query the database with the combined filter
        const [sales, saleReturns, purchases, purchaseReturns, expenses] = await Promise.all([
            Sale.find(combinedFilter),
            SaleReturn.find(combinedFilter),
            Purchase.find(combinedFilter),
            PurchaseReturn.find(combinedFilter),
            Expenses.find(warehouseFilter)
        ]);

        // Respond with the fetched data
        res.status(200).json({
            message: 'Report data fetched successfully',
            data: { sales, saleReturns, purchases, purchaseReturns, expenses }
        });
    } catch (error) {
        console.error("Error getting report data:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// Get customer report with sales data
const allCustomerReport = async (req, res) => {
    const { name } = req.params;
    console.log(name)
    try {
        const customers = await Customer.find();
        if (!customers || customers.length === 0) {
            return res.status(404).json({ message: 'Customers not found' });
        }
        // Fetch sales data for each customer and filter out those with no sales
        const customersData = await Promise.all(customers.map(async (customer) => {
            const sales = await Sale.find(name);
            if (sales.length === 0) return null;  // Exclude customers with no sales

            return {
                _id: customer._id,
                name: customer.name,
                mobile: customer.mobile,
                sales: sales.map(sale => ({
                    saleId: sale._id,
                    warehouse: sale.warehouse,
                    date: sale.date,
                    amount: sale.grandTotal,
                    paid: sale.paidAmount,
                    paymentStatus: sale.paymentStatus,
                }))
            };
        }));
        // Filter out null values (customers with no sales)
        const filteredData = customersData.filter(customer => customer !== null);

        return res.status(200).json(filteredData);
    } catch (error) {
        // Log error for debugging
        console.error("Error getting report data:", error);

        // Return a more generic error message for unexpected issues
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
}


// Get customer report by ID with sales data
const allCustomerReportById = async (req, res) => {
    const { name } = req.params
    try {
        const customers = await Customer.find({ name: name });
        if (!customers || customers.length === 0) {
            return res.status(404).json({ message: 'Customers not found' });
        }
        // Fetch sales data for each customer and filter out those with no sales
        const customersData = await Promise.all(customers.map(async (customer) => {
            const sales = await Sale.find({ customer: customer.name });
            if (sales.length === 0) return null;  // Exclude customers with no sales

            return {
                _id: customer._id,
                name: customer.name,
                mobile: customer.mobile,
                sales: sales.map(sale => ({
                    saleId: sale._id,
                    warehouse: sale.warehouse,
                    date: sale.date,
                    amount: sale.grandTotal,
                    paid: sale.paidAmount,
                    paymentStatus: sale.paymentStatus,
                }))
            };
        }));
        // Filter out null values (customers with no sales)
        const filteredData = customersData.filter(customer => customer !== null);

        return res.status(200).json(filteredData);
    } catch (error) {
        console.error('Error fetching customers with sales data:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Get customer report by customer name with sales data
const findReportByCustomer = async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ message: 'Customer name is required' });
    }
    try {
        const customers = await Customer.find({ name: { $regex: name, $options: 'i' } });
        if (!customers) {
            return res.status(404).json({ message: 'No customers found' });
        }
        const customersData = await Promise.all(customers.map(async (customer) => {
            // Fetch sales by using the customer's ID instead of name
            const sales = await Sale.find({ customer: customer.name });
            if (sales.length === 0) return null;  // Exclude customers with no sales

            return {
                _id: customer._id,
                name: customer.name,
                mobile: customer.mobile,
                sales: sales.map(sale => ({
                    saleId: sale._id,
                    warehouse: sale.warehouse,
                    date: sale.date,
                    amount: sale.grandTotal,
                    paid: sale.paidAmount,
                    paymentStatus: sale.paymentStatus,
                }))
            };
        }));

        const filteredData = customersData.filter(customer => customer !== null);

        if (filteredData.length === 0) {
            return res.status(404).json({ message: 'No customers with sales found' });
        }
        return res.status(200).json(filteredData);
    } catch (error) {
        console.error('Error fetching customer report by name:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

const getTodayReportData = async (req, res) => {
    const { warehouse } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    try {
        const warehouseFilter = warehouse === 'all' ? {} : { warehouse };
        const dateFilter = { date: { $gte: today, $lt: tomorrow } };
        const filter = { ...warehouseFilter, ...dateFilter };
        const [sales, saleReturns, purchases, purchaseReturns, expenses] = await Promise.all([
            Sale.find(filter),
            SaleReturn.find(filter),
            Purchase.find(filter),
            PurchaseReturn.find(filter),
            Expenses.find(filter)
        ]);

        res.status(200).json({
            message: 'Today report data fetched successfully',
            data: {
                sales,
                saleReturns,
                purchases,
                purchaseReturns,
                expenses
            }
        });
    } catch (error) {
        console.error("Error getting today report data:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

const getLastWeekReportData = async (req, res) => {
    const { warehouse } = req.params;
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    try {
        const warehouseFilter = warehouse === 'all' ? {} : { warehouse };
        const dateFilter = { date: { $gte: lastWeek, $lt: today } };
        const filter = { ...warehouseFilter, ...dateFilter };
        const [sales, saleReturns, purchases, purchaseReturns, expenses] = await Promise.all([
            Sale.find(filter),
            SaleReturn.find(filter),
            Purchase.find(filter),
            PurchaseReturn.find(filter),
            Expenses.find(filter)
        ]);

        res.status(200).json({
            message: 'Last week report data fetched successfully',
            data: {
                sales,
                saleReturns,
                purchases,
                purchaseReturns,
                expenses
            }
        });
    } catch (error) {
        console.error("Error getting last week report data:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

const getLastMonthReportData = async (req, res) => {
    const { warehouse } = req.params;
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    try {
        const warehouseFilter = warehouse === 'all' ? {} : { warehouse };
        const dateFilter = { date: { $gte: lastMonth, $lt: today } };
        const filter = { ...warehouseFilter, ...dateFilter };
        const [sales, saleReturns, purchases, purchaseReturns, expenses] = await Promise.all([
            Sale.find(filter),
            SaleReturn.find(filter),
            Purchase.find(filter),
            PurchaseReturn.find(filter),
            Expenses.find(filter)
        ]);

        res.status(200).json({
            message: 'Last month report data fetched successfully',
            data: {
                sales,
                saleReturns,
                purchases,
                purchaseReturns,
                expenses
            }
        });
    } catch (error) {
        console.error("Error getting last month report data:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

const getLastYearReportData = async (req, res) => {
    const { warehouse } = req.params;
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);

    try {
        const warehouseFilter = warehouse === 'all' ? {} : { warehouse };
        const dateFilter = { date: { $gte: lastYear, $lt: today } };
        const filter = { ...warehouseFilter, ...dateFilter };
        const [sales, saleReturns, purchases, purchaseReturns, expenses] = await Promise.all([
            Sale.find(filter),
            SaleReturn.find(filter),
            Purchase.find(filter),
            PurchaseReturn.find(filter),
            Expenses.find(filter)
        ]);

        res.status(200).json({
            message: 'Last year report data fetched successfully',
            data: {
                sales,
                saleReturns,
                purchases,
                purchaseReturns,
                expenses
            }
        });
    } catch (error) {
        console.error("Error getting last year report data:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: 'Something went wrong, please try again later.' });
    }
};

module.exports = { getReportData, allCustomerReport, allCustomerReportById, findReportByCustomer, getFillteredReportData, getTodayReportData, 
                   getLastWeekReportData, getLastMonthReportData, getLastYearReportData };
