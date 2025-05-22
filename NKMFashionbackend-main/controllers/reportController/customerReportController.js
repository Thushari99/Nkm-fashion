const Sale = require('../../models/saleModel');
const Customer = require('../../models/customerModel');

//Get customer reports combined function
const getCustomerReport = async (req, res) => {
    const { name } = req.query;

    try {
        // Determine search criteria based on the presence of a name in query
        const searchCriteria = name
            ? { name: { $regex: name, $options: 'i' } } // Partial match search if name is provided
            : {}; // No criteria for fetching all customers

        const customers = await Customer.find(searchCriteria);
        
        if (!customers || customers.length === 0) {
            return res.status(404).json({ message: 'No customers found' });
        }

        // Fetch sales data for each customer, excluding those with no sales
        const customersData = await Promise.all(
            customers.map(async (customer) => {
                const sales = await Sale.find({ customer: customer.name });
                if (sales.length === 0) return null; // Exclude customers with no sales
                
                return {
                    _id: customer._id,
                    name: customer.name,
                    mobile: customer.mobile,
                    sales: sales.map((sale) => ({
                        saleId: sale._id,
                        warehouse: sale.warehouse,
                        date: sale.date,
                        amount: sale.grandTotal,
                        paid: sale.paidAmount,
                        paymentStatus: sale.paymentStatus,
                    })),
                };
            })
        );

        // Filter out customers with no sales
        const filteredData = customersData.filter((customer) => customer !== null);

        if (filteredData.length === 0) {
            return res.status(404).json({ message: 'No customers with sales found' });
        }

        return res.status(200).json(filteredData);
    } catch (error) {
        console.error('Error fetching customer report:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

module.exports = { getCustomerReport}; 
