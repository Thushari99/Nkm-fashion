import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { Link } from 'react-router-dom';
import { handleExportPdf } from '../../component/utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function SuplierReportBody() {
    // State management
    const { currency } = useCurrency()
    const [saleData, setSaleData] = useState({});
    const [searchedSuplierSale, setSearchedSuplierSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const ref = useRef();

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedSuplierSale) && searchedSuplierSale.length > 0
        ? searchedSuplierSale
        : Array.isArray(saleData) && saleData.length > 0
            ? saleData
            : [];

   // Fix the useEffect data handling
useEffect(() => {
    const fetchReportData = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/allSuplierReport`);
            if (response.data.status === 'success') {
                setSaleData(response.data.data); 
            } else {
                setSaleData([]);
            }
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };
    fetchReportData();
}, []);

    // Handle search input change
    const handleFindUser = async (e) => {
        const value = e.target.value;
        setKeyword(value); // Update state

        if (value.length > 0) {
            await handleSubmit(value); // Pass latest value directly
        } else {
            setSearchedSuplierSale([]); // Clear results if input is empty
        }
    };

    // Handle search form submission
    const handleSubmit = async (searchTerm) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findReportBySuplier`, {
                params: { name: searchTerm }
            });

            if (
                response.data.status === 'success' &&
                Array.isArray(response.data.data) &&
                response.data.data.length > 0
            ) {
                setSearchedSuplierSale(response.data.data);
                setError('');
            } else {
                setSearchedSuplierSale([]);
                setError(response.data.message || 'No suppliers found');
            }
        } catch (error) {
            setSearchedSuplierSale([]);
            // Use backend error message if available
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('No suppliers found');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-screen p-5'>
            <div>
                <div className='absolute right-10'>
                    <button
                        onClick={() => handleExportPdf({
                            data: combinedProductData,
                            currency: currency,
                            title: "Supplier Report",
                            summaryTitle: "Supplier Report Summary",
                            tableColumns: ["Supplier", "Mobile", "Total Amount", "Sale Amount", "Paid"],
                            dataKeys: ["name", "mobile", "totalSales", "saleAmount", "paidAmount"],
                            additionalData: {
                                "Total Suppliers": combinedProductData.length,
                                "Total Sales Value": `${currency} ${formatWithCustomCommas(
                                    combinedProductData.reduce((sum, s) => sum + s.sales.reduce((acc, sale) => acc + sale.amount, 0), 0)
                                )}`,
                                "Total Paid": `${currency} ${formatWithCustomCommas(
                                    combinedProductData.reduce((sum, s) => sum + s.sales.reduce((acc, sale) => acc + sale.paid, 0), 0)
                                )}`
                            }
                        })}
                        className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                    >
                        {'Export As PDF'}
                    </button>

                </div>
            </div>

            <div ref={ref} className='mt-16'>
                <div className='mb-2'>
                    <div className="m-6 flex justify-left">
                        <h1 className="text-lightgray-300 m-0 p-0 text-2xl">Suplier Report</h1>
                    </div>

                    <div className='mt-5 mb-2 ml-[24px]'>
                        <form onChange={handleSubmit} className="flex items-center">
                            <input
                                onChange={handleFindUser}
                                name='keyword'
                                type="text"
                                placeholder="Search by Suplier Name..."
                                className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                value={keyword}
                            />
                        </form>
                    </div>

                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : combinedProductData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {combinedProductData.map((sale) => {
                                        // Calculate total sales amount and the number of sales
                                        const totalSalesAmount = sale.sales.reduce((acc, sale) => acc + sale.amount, 0);
                                        const numberOfSales = sale.sales.length;

                                        return (
                                            <tr key={sale._id}>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                    <p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">{sale.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{sale.mobile}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                                    {numberOfSales} {/* Display number of sales */}
                                                </td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                    {currency}{' '} {formatWithCustomCommas(totalSalesAmount)} {/* Display total sales amount */}
                                                </td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                    {/* Optionally, display total paid amount if needed */}
                                                    {currency}{' '} {formatWithCustomCommas(sale.sales.reduce((acc, sale) => acc + sale.paid, 0))}
                                                </td>
                                                <td className="px-6 flex justify-end py-4 whitespace-nowrap text-m text-gray-900">
                                                    <Link to={`/viewSuplierRep/${sale.name}`}
                                                        className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                                                        style={{ background: 'transparent' }}
                                                    >
                                                        <i className="fas fa-eye mr-1"></i>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) :
                        <p className='text-center text-gray-700 mt-5'>Not data available</p>}
                </div>
                <div>
                    {error && <p className="text-red-500 mt-5 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default SuplierReportBody;

