import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { useParams } from 'react-router-dom';
import { handleExportPdf } from '../../component/utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function ClickedStokeReport() {
    // State management
    const { currency } = useCurrency()
    const [saleData, setSaleData] = useState({});
    const [saleReturnData, setSaleReturnData] = useState({});
    const [purchaseData, setPurchaseData] = useState({});
    const [purchaseReturnData, setPurchaseReturnData] = useState({});
    const [activeTable, setActiveTable] = useState('sales'); // 'sales' or 'salesReturn'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const ref = useRef()
    const { id } = useParams();

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findProductDetailsById/${id}`);
                
                setSaleData(response.data.data.sales || []);
                setSaleReturnData(response.data.data.saleReturns || []);
                setPurchaseData(response.data.data.purchases || []);
                setPurchaseReturnData(response.data.data.purchaseReturns || []);
    
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError('Failed to fetch report data');
            } finally {
                setLoading(false);
            }
        };
    
        fetchReportData();
    }, [id]);

    const handleTableChange = (table) => {
        setActiveTable(table);
    };

    // Function to export sales report
    const exportSalesPdf = () => {
        handleExportPdf({
            data: saleData,
            currency,
            title: 'Sales Report',
            summaryTitle: 'Sales Summary',
            tableColumns: [ "Warehouse", "Date", "Payment Status", "Status", "Grand Total", "Paid"],
            dataKeys: [ "warehouse", "date", "paymentStatus", "orderStatus", "grandTotal", "paidAmount"],
        });
    };

    const exportSalesReturnPdf = () => {
        handleExportPdf({
            data: saleReturnData,
            currency,
            title: 'Sales Return Report',
            summaryTitle: 'Sales Return Summary',
            tableColumns: ["Warehouse", "Date", "Grand Total", "Paid Amount", "Return Amount", "Note"],
            dataKeys: [ "warehouse", "date", "grandTotal", "paidAmount", "returnAmount", "note"],
        });
    };

    const exportPurchasePdf = () => {
        handleExportPdf({
            data: purchaseData,
            currency,
            title: 'Purchase Report',
            summaryTitle: 'Purchase Summary',
            tableColumns: ["Supplier", "Warehouse", "Date", "Grand Total", "Paid Amount", "Order Status"],
            dataKeys: [ "supplier", "warehouse", "date", "grandTotal", "paidAmount", "orderStatus"],
        });
    };

    const exportPurchaseReturnPdf = () => {
        handleExportPdf({
            data: purchaseReturnData,
            currency,
            title: 'Purchase Return Report',
            summaryTitle: 'Purchase Return Summary',
            tableColumns: ["Supplier", "Warehouse", "Date", "Grand Total", "Paid Amount", "Note"],
            dataKeys: [ "supplier", "warehouse", "date", "grandTotal", "paidAmount", "note"],
        });
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-screen p-5'>
             <div className='absolute right-10'>
                {activeTable === 'sales' && (
                    <button onClick={exportSalesPdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                        {'Export as PDF'}
                    </button>
                )}
                {activeTable === 'salesReturn' && (
                    <button onClick={exportSalesReturnPdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                        {'Export as PDF'}
                    </button>
                )}
                {activeTable === 'purchase' && (
                    <button onClick={exportPurchasePdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                        {'Export as PDF'}
                    </button>
                )}
                {activeTable === 'purchaseReturn' && (
                    <button onClick={exportPurchaseReturnPdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                        {'Export as PDF'}
                    </button>
                )}
            </div>
            <div>
                <div ref={ref} className='mt-10'>
                    <div className="ml-6 mt-16 flex justify-left">
                        <h1 className="text-lightgray-300 m-0 p-0 text-2xl">Stock Product Details</h1>
                    </div>

                    <div className='mt-5 mb-2 ml-[4px]'>
                        <button
                            className={`px-5 ${activeTable === 'sales' ? 'text-gray-800' : 'text-gray-500'} hover:text-gray-700`}
                            onClick={() => handleTableChange('sales')}
                        >
                            Sale
                        </button>
                        <button
                            className={`px-5 ${activeTable === 'purchase' ? 'text-gray-800' : 'text-gray-500'} hover:text-gray-700`}
                            onClick={() => handleTableChange('purchase')}
                        >
                            Purchase
                        </button>
                        <button
                            className={`px-5 ${activeTable === 'salesReturn' ? 'text-gray-800' : 'text-gray-500'} hover:text-gray-700`}
                            onClick={() => handleTableChange('salesReturn')}
                        >
                            Sale Return
                        </button>
                        <button
                            className={`px-5 ${activeTable === 'purchaseReturn' ? 'text-gray-800' : 'text-gray-500'} hover:text-gray-700`}
                            onClick={() => handleTableChange('purchaseReturn')}
                        >
                            Purchase Return
                        </button>
                    </div>

                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : activeTable === 'sales' && saleData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {saleData.map((sale) => (
                                        <tr key={sale._id}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                <p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.customer}</p>
                                            </td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{sale.warehouse}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{sale.orderStatus}</p>
                                            </td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                <p className={`rounded-[5px] text-center p-[6px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-500' : 'bg-red-100 text-red-500'}`}>
                                                    {sale.paymentStatus}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.grandTotal)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.paidAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTable === 'salesReturn' && saleReturnData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {saleReturnData.map((sale) => (
                                        <tr key={sale._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.customer}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{sale.warehouse}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.grandTotal)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.paidAmount)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.returnAmount? sale.returnAmount :0)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{sale.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTable === 'purchase' && purchaseData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {purchaseData.map((purchased) => (
                                        <tr key={purchased._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{purchased.supplier}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{purchased.warehouse}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{new Date(purchased.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{purchased.orderStatus}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                                <p className={`rounded-[5px] text-center p-[6px] ${purchased.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : purchased.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-500' :
                                                    'bg-red-100 text-red-500'}`}>
                                                    {purchased.paymentStatus}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(purchased.grandTotal)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(purchased.paidAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>) :
                        activeTable === 'purchaseReturn' && purchaseReturnData.length > 0 ? (
                            <div className="overflow-x-auto p-6">
                                <table className="min-w-full bg-white border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {purchaseReturnData.map((purchased) => (
                                            <tr key={purchased._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{purchased.supplier}</p></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{purchased.warehouse}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{new Date(purchased.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(purchased.grandTotal)}</td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(purchased.paidAmount)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{purchased.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>) :
                            null}
                </div>
                <div>
                    {error && <p className="text-green-500 mt-5 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}
export default ClickedStokeReport;
