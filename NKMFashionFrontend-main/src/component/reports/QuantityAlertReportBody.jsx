import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import QuantityAlertTable from './quantityAlertTable';
import { handleExportPdf } from '../../component/utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function QuantityAlertReportBody() {
    // State management
    const [stokeData, setStokeData] = useState([]);
    const [searchedStokeReport, setSearchedStokeReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('all');
    const ref = useRef();
    const { currency } = useCurrency();

    // COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedStokeReport) && searchedStokeReport.length > 0
        ? searchedStokeReport
        : Array.isArray(stokeData) && stokeData.length > 0
            ? stokeData
            : [];

    const fetchReportData = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findStokeReport/${warehouse}`);
            if (response.data && response.data.products && Array.isArray(response.data.products)) {
                setStokeData(response.data.products);
            } else {
                console.error('Unexpected response format:', response.data);
                setStokeData([]);
            }
        } catch (err) {
            if (err.response) {
                console.error('Error response:', err.response.data);
                setError(err.response.data.status || 'An error occurred while fetching data.');
            } else if (err.request) {
                console.error('No response received:', err.request);
                setError('No response received from the server.');
            } else {
                console.error('Error setting up request:', err.message);
                setError('An error occurred while setting up the request.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [warehouse]);

    useEffect(() => {
        const fetchAllWarehouses = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`);
                setWarehouseData(response.data.warehouses || []);
            } catch (error) {
                console.error('Failed to fetch all warehouses:', error);
            }
        };
        fetchAllWarehouses();
    }, []);

    // Handle search input change
    const handleFindUser = async (e) => {
        const { value } = e.target;
        setKeyword(value); // Update the keyword state
        if (value.length > 0) {
            await handleSubmit(); // Call your search function
        } else {
            setSearchedStokeReport(null); // Clear search results
            fetchReportData(); // Fetch all data if input is empty
        }
    };

    // Handle search form submission
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findStokeReportByCode`, {
                params: { name: keyword }
            });
            if (Array.isArray(response.data)) {
                setSearchedStokeReport(response.data);
            } else if (response.data && response.data.products) {
                setSearchedStokeReport(response.data.products); // Adjust based on your actual response structure
            } else {
                setSearchedStokeReport([]); // Fallback to an empty array if data is unexpected
            }
        } catch (error) {
            console.error('Find customer error:', error);
            setSearchedStokeReport([]); // Clear the search results on error
        } finally {
            setLoading(false);
        }
    };

    const getPriceRange = (product) => {
        if (product.variationValues) {
            const prices = Object.values(product.variationValues)
                .map(variation => Number(variation.productPrice))
                .filter(price => !isNaN(price));
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`;
            }
        }
        const singlePrice = Number(product.productPrice);
        return !isNaN(singlePrice) && singlePrice > 0 ? `${singlePrice}` : 'Price not available';
    };

    // Calculate total quantity for a product
    const getQty = (product) => {
        if (product.ptype === 'Variation' && product.variationValues) {
            const qty = Object.values(product.variationValues)
                .map(variation => Number(variation.productQty))
                .filter(qty => !isNaN(qty));
            return qty.length > 0 ? qty.reduce((total, current) => total + current, 0) : 0;
        } else {
            const singleProductQty = Number(product.productQty);
            return !isNaN(singleProductQty) && singleProductQty > 0 ? singleProductQty : 0;
        }
    };

    // Determine if a product is low in stock
    const isLowStock = (product) => {
        const stockQty = getQty(product);
        const stockAlert = Number(product.stockAlert);
        return !isNaN(stockAlert) && stockQty < stockAlert;
    };

    // Filter and sort products with low stock
    const lowStockProducts = combinedProductData
        .filter((product) => isLowStock(product))
        .sort((a, b) => getQty(a) - getQty(b));

    // Calculate totals for the summary section
    const lowStockTotalQty = lowStockProducts.reduce((total, product) => total + getQty(product), 0);
    const lowStockTotalValue = lowStockProducts.reduce((total, product) => {
        const price = Number(getPriceRange(product).split(' - ')[0].replace(/[^\d.-]/g, '')); // Extracts the min price for total value
        return total + (price * getQty(product));
    }, 0);

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-screen p-5'>
            <div>
                <div className="m-0 flex justify-center">
                    {/* Warehouse field */}
                    <div className="mt-5 text-center">
                        <label className="block text-sm font-medium leading-6 text-gray-900 mb-2 text-left">Warehouse</label>
                        <select
                            value={warehouse}
                            onChange={(e) => setWarehouse(e.target.value)}
                            className="block w-[400px] mx-auto rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-200 focus:outline-none sm:text-sm sm:leading-6"
                        >
                            <option value="all">All warehouse</option>
                            {warehouseData.map((wh) => (
                                <option key={wh.name} value={wh.name}>
                                    {wh.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='absolute right-10'>
                        <button
                            onClick={() => handleExportPdf({
                                data: lowStockProducts.map(p => ({
                                    name: p.name,
                                    code: p.code,
                                    brand: p.brand,
                                    price: formatWithCustomCommas(getPriceRange(p)), // Ensure numeric price is passed
                                    productQty: getQty(p),
                                    stockAlert: p.stockAlert
                                })),
                                currency,
                                title: "Low Stock Report",
                                summaryTitle: "Low Stock Summary",
                                tableColumns: ["Name", "Code", "Brand", `Price(${currency})`, "In Stock", "Quantity Alert"],
                                dataKeys: ["name", "code", "brand", "price", "productQty", "stockAlert"],
                                additionalData: {
                                    "Low Stock Total Quantity": lowStockTotalQty,
                                }
                            })}
                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                        >
                            {'Export As PDF'}
                        </button>
                    </div>
                </div>

                <div className='' ref={ref}>
                    <div className="m-6 flex justify-left">
                        <h1 className="text-lightgray-300 m-0 p-0 text-2xl">Quantity Alert Report</h1>
                    </div>

                    <div className='mt-5 mb-2 ml-[24px] p-1'>
                        <form className="flex items-center">
                            <input
                                onChange={handleFindUser}
                                name='keyword'
                                type="text"
                                placeholder="Search..."
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
                        <div className='relative background-white w-full min-h-screen p-5'>
                            <QuantityAlertTable
                                combinedProductData={combinedProductData}
                                loading={loading}
                                error={error}
                            />
                        </div>
                    ) :
                        <p className='text-center text-gray-700 mt-5'>No data available</p>}
                </div>
                <div>
                    {error && (
                        <p
                            className={`mt-5 text-center ${error === 'No products found' ? 'text-gray-700' : 'text-red-500'
                                }`}
                        >
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuantityAlertReportBody;