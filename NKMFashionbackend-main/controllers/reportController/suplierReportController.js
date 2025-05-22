const Purchase = require('../../models/purchaseModel');
const Suplier = require('../../models/suplierModel');

const allSuplierReport = async (req, res) => {
    try {
        const suppliers = await Suplier.find();
        if (!suppliers || suppliers.length === 0) {
            return res.status(404).json({ message: 'No suppliers found' });
        }

        // Fetch sales data for each supplier
        const suppliersData = await Promise.all(
            suppliers.map(async (supplier) => { 
                const sales = await Purchase.find({ supplier: { $regex: new RegExp(`^${supplier.name}$`, 'i') }});
                if (sales.length === 0) return null;

                return {
                    _id: supplier._id,
                    name: supplier.name,
                    mobile: supplier.mobile,
                    sales: sales.map(sale => ({
                        saleId: sale._id,
                        warehouse: sale.warehouse,
                        date: sale.date,
                        amount: sale.grandTotal,
                        paid: sale.paidAmount,
                        paymentStatus: sale.paymentStatus,
                    }))
                };
            })
        );

        // Filter out suppliers with no sales
        const filteredData = suppliersData.filter(supplier => supplier !== null);

        if (filteredData.length === 0) {
            return res.status(200).json({ message: 'No sales found for any suppliers', data: [] });
        }

        return res.status(200).json({ status: 'success', count: filteredData.length, data: filteredData});
    } catch (error) {
        console.error("Error fetching supplier report:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: error.message });
    }
};

const allSuplierReportById = async (req, res) => {
    try {
        const { name } = req.params; // Get name from URL params

        if (!name) {
            return res.status(400).json({ message: 'Supplier name is required' });
        }

        // Find suppliers with case-insensitive matching
        const suppliers = await Suplier.find({ name: { $regex: new RegExp(name, 'i') } });

        if (!suppliers.length) {
            return res.status(404).json({ message: 'No suppliers found' });
        }

        // Fetch sales data for each supplier
        const suppliersData = await Promise.all(suppliers.map(async (supplier) => {
            const sales = await Purchase.find({ supplier: supplier.name }); // Match by supplier name

            if (!sales.length) return null;  // Exclude suppliers with no sales

            return {
                _id: supplier._id,
                name: supplier.name,
                mobile: supplier.mobile,
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

        // Filter out null values (suppliers with no sales)
        const filteredData = suppliersData.filter(supplier => supplier !== null);

        if (!filteredData.length) {
            return res.status(404).json({ message: 'No suppliers with sales found' });
        }

        return res.status(200).json({ status: 'success', data: filteredData });
    } catch (error) {
        console.error("Error finding supplier report:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: error.message });
    }
};


// Find a report by searching supplier name (partial match)
const findReportBySuplier = async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ message: 'Supplier name is required' });
    }

    try {
        const suppliers = await Suplier.find({ name: { $regex: name, $options: 'i' } });

        if (!suppliers.length) {
            return res.status(404).json({ message: 'No suppliers found' });
        }

        const supplierData = await Promise.all(
            suppliers.map(async (supplier) => {
                // Fetch sales using the correct field name in Purchase model
                const sales = await Purchase.find({ supplier: supplier.name });

                if (!sales.length) return null;  // Exclude suppliers with no sales

                return {
                    _id: supplier._id,
                    name: supplier.name,
                    mobile: supplier.mobile,
                    sales: sales.map(sale => ({
                        saleId: sale._id,
                        warehouse: sale.warehouse,
                        date: sale.date,
                        amount: sale.grandTotal,
                        paid: sale.paidAmount,
                        paymentStatus: sale.paymentStatus,
                    }))
                };
            })
        );

        const filteredData = supplierData.filter(supplier => supplier !== null);

        if (!filteredData.length) {
            return res.status(404).json({ message: 'No suppliers with sales found' });
        }

        return res.status(200).json({ status: 'success', data: filteredData });

    } catch (error) {
        console.error("Error finding supplier report:", error);
        return res.status(500).json({ message: 'Server Error', status: 'fail', error: error.message });
    }
};

module.exports = { allSuplierReport, allSuplierReportById, findReportBySuplier };
