import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { FaCartPlus, FaExchangeAlt } from 'react-icons/fa'
import { useParams, Link } from 'react-router-dom';
import { handleExportPdf } from '../../component/utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function ClickedCustomerReport() {
    // State management
    const { currency } = useCurrency()
    const [customerData, setCustomerData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const { sale } = useParams();
    const ref = useRef();
    const name = sale;

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                if (!name) return;
                
                const response = await axios.get(
                    `${process.env.REACT_APP_BASE_URL}/api/allCustomerReportById/${encodeURIComponent(name)}`
                );
                setCustomerData(response.data);
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError(err.response?.data?.message || 'Failed to fetch report data');
            }
        };
    
        fetchReportData();
    }, [name]);

    const numberOfSales = Array.isArray(customerData)
    ? customerData.reduce((total, customer) => total + (customer.sales?.length || 0), 0)
    : 0;

const totalAmount = Array.isArray(customerData)
    ? customerData.reduce((total, customer) =>
        total + (customer.sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0), 0)
    : 0;

const totalPaidAmount = Array.isArray(customerData)
    ? customerData.reduce((total, customer) =>
        total + (customer.sales?.reduce((sum, sale) => sum + sale.paid, 0) || 0), 0)
    : 0;

const dueAmount = totalAmount - totalPaidAmount;

// **Apply formatting only for display, not in calculations**
const formattedNumberOfSales = `${currency} ${formatWithCustomCommas(numberOfSales)}`;
const formattedTotalAmount = `${currency} ${formatWithCustomCommas(totalAmount)}`;
const formattedTotalPaidAmount = `${currency} ${formatWithCustomCommas(totalPaidAmount)}`;
const formattedDueAmount = `${currency} ${formatWithCustomCommas(dueAmount)}`;

// Export function
const handleExportClick = () => {
    const tableColumns = ['Customer', 'Date', 'Warehouse', `Amount(${currency})`, `Paid(${currency})`, `Due(${currency})`];
    const dataKeys = ['customer', 'date', 'warehouse', 'amount', 'paid', 'due'];

    const data = customerData.flatMap((customer) =>
        customer.sales.map((sale) => ({
            customer: customer.name,
            mobile: customer.mobile,
            date: new Date(sale.date).toLocaleDateString(),
            warehouse: sale.warehouse,
            amount: sale.amount,
            paid: sale.paid,
            due: sale.amount - sale.paid,
            paymentStatus: sale.paymentStatus,
        }))
    );

    // Additional dynamic data if needed
    const additionalData = {
        totalSales: formattedNumberOfSales,
        totalAmount: formattedTotalAmount,
        totalPaidAmount: formattedTotalPaidAmount,
    };

    // Call the PDF export function
    handleExportPdf({
        data,
        currency,
        title: `${name} Customer Report`,
        summaryTitle: 'Report Summary',
        tableColumns,
        dataKeys,
        additionalData,
    });
};
    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-screen p-5'>
            <div>
                <div className='flex'>
                    <div className='absolute right-10'>
                        <button
                            onClick={handleExportClick}
                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                        >
                            {'Export As PDF'}
                        </button>
                    </div>
                </div>

                <div ref={ref}>
                    <div className="ml-6 mt-16 flex justify-left">
                        <h1 className="text-lightgray-300 m-0 p-0 text-2xl">Customer Report</h1>
                    </div>
                    <div className="grid gap-4 px-6 mt-8 mb-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Link to={'/viewSale'}>
                            <div
                                className="h-28 flex items-center justify-center rounded-[10px] shadow-lg"
                                style={{ background: '#1A5B63' }}
                                data-aos="fade-down"
                            >
                                <div className="flex flex-row items-start space-x-4">
                                    <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]" >
                                        {currency}  &nbsp;
                                    </h1>
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formattedNumberOfSales}
                                        </h1>
                                        <p className="text-white text-sm">Number Of Sale</p> {/* Sale label */}
                                    </div>
                                </div>

                            </div>
                        </Link>

                        <Link to={'/viewPurchase'}>
                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg" style={{
                                background: ' #1A5B63',
                            }} data-aos="fade-down">

                                <div className="flex flex-row items-start space-x-4">
                                    <FaCartPlus className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formattedTotalAmount}
                                        </h1>
                                        <p className="text-white text-sm">Total Amount</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link to={'/viewSaleReturns'}>
                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg" style={{
                                background: ' #44BC8D',
                            }} data-aos="fade-down">
                                <div className="flex flex-row items-start space-x-4">
                                    <FaExchangeAlt className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formattedTotalPaidAmount}
                                        </h1>
                                        <p className="text-white text-sm">Paid Amount</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link to={'/viewPurchaseReturns'}>
                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg" style={{
                                background: ' #1A5B63',
                            }} data-aos="fade-down">
                                <div className="flex flex-row items-start space-x-4">
                                    <FaExchangeAlt className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formattedDueAmount}
                                        </h1>
                                        <p className="text-white text-sm">Due To Pay</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : customerData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customerData.map((customer) => (
                                        <React.Fragment key={customer._id}>
                                            {customer.sales.map((sale) => (
                                                <tr key={sale.saleId}>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        <p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">{customer.name}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        {customer.mobile}
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        {new Date(sale.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        {sale.warehouse}
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        {currency}{' '}  {formatWithCustomCommas(sale.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        {currency}{' '}  {formatWithCustomCommas(sale.paid)}
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        {currency}{' '}  {(formatWithCustomCommas(sale.amount - sale.paid))}
                                                    </td>
                                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                        <p className={`rounded-[5px] text-center p-[6px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-500' :
                                                            'bg-red-100 text-red-500'}`}>
                                                            {sale.paymentStatus}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
                <div>
                    {error && <p className="text-green-500 mt-5 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}
export default ClickedCustomerReport;
