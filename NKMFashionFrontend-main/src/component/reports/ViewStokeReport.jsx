import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import ProductIcon from '../../img/product icon.jpg';
import { handleExportPdf } from '../../component/utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function StokeReportBody() {
    // State management
    const { currency } = useCurrency()
    const [stokeData, setStokeData] = useState({});
    const [searchedStokeReport, setSearchedStokeReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('')
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState(['all']);
    const ref = useRef();

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedStokeReport) && searchedStokeReport.length > 0
        ? searchedStokeReport
        : Array.isArray(stokeData) && stokeData.length > 0
            ? stokeData
            : [];
    //fetch stock data
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setStokeData({})
            setError('')
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findStokeReport/${warehouse}`);
                if (response.data && response.data.products) {
                    setStokeData(response.data.products);
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
        fetchReportData();
    }, [warehouse]);;

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
        setKeyword(value);

        if (value.length > 0) {
            await handleSubmit();
        } else {
            setSearchedStokeReport([]);
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findStokeReport/${warehouse}`);
                if (response.data?.products) {
                    setStokeData(response.data.products);
                }
            } catch (error) {
                console.error('Error refreshing data:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle search form submission
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findStokeReportByCode`, {
                params: { name: keyword }
            });
            if (Array.isArray(response.data)) {
                setSearchedStokeReport(response.data);
                setError(response.data.length === 0 ? 'No products found' : 'Products found');
            } else if (response.data && response.data.products) {
                setSearchedStokeReport(response.data.products);
                setError(
                    response.data.products.length === 0
                        ? (response.data.status || 'No products found')
                        : (response.data.status || 'Products found')
                );
            } else {
                setSearchedStokeReport([]);
                setError('No products found');
            }
        } catch (error) {
            setSearchedStokeReport([]);
            if (error.response && error.response.data && error.response.data.status) {
                setError(error.response.data.status);
            } else if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('No products found');
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate price range (min and max) for products with variations
    const getPriceRange = (product) => {
        if (product.variationValues) {
            // Get prices from variationValues
            const prices = Object.values(product.variationValues).map(variation => Number(variation.productPrice)).filter(price => !isNaN(price));

            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                // If all variation prices are the same, return the single price
                if (minPrice === maxPrice) {
                    return `${minPrice}`;
                } else {
                    return `${minPrice} - ${maxPrice}`;
                }
            }
        }
        // Fallback to single product price if no variations are available
        const singlePrice = Number(product.productPrice);
        if (!isNaN(singlePrice) && singlePrice > 0) {
            return `${singlePrice}`;
        }
        return 'Price not available'; // Default case when no price is found
    };
    // Calculate price range (min and max) for products with variations
    const getQty = (product) => {
        if (product.variationValues) {
            const qty = Object.values(product.variationValues).map(variation => Number(variation.productQty)).filter(qty => !isNaN(qty));
            return qty.length > 0 ? qty.reduce((total, current) => total + current, 0) : 0;
        }
        const singleProductQty = Number(product.productQty);
        return !isNaN(singleProductQty) && singleProductQty > 0 ? singleProductQty : 0;
    };

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
                                data: combinedProductData,
                                currency,
                                title: "Stock Report",
                                summaryTitle: "Summary of Stock",
                                tableColumns: ["Product Name", "Code", "Brand", "Price", "In Stock", "Created On"],
                                dataKeys: ["name", "code", "brand", "productPrice", "productQty", "createdAt"],
                                additionalData: {
                                    "Total Products": combinedProductData.length,
                                }
                            })}
                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                        >
                            {'Export As PDF'}
                        </button>

                    </div>
                </div>
                <div className='mt-5 mb-2 ml-[24px]'>
                    <div className="mt-2 flex justify-left">
                        <h1 className="text-lightgray-300 m-0 mb-5 p-0 text-2xl">Stock Report</h1>
                    </div>
                    <form onChange={handleSubmit} className="flex items-center">
                        <input
                            onChange={handleFindUser}
                            name='keyword'
                            type="text"
                            placeholder="Search by Name Or Code..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={keyword}
                        />
                    </form>
                </div>
                <div ref={ref} className='pt-2'>
                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : (keyword.trim() !== '' ? (
                        searchedStokeReport && searchedStokeReport.length > 0 ? (
                            <>
                                <p className="text-center text-green-600 mt-2">{error === 'Products found' ? error : ''}</p>
                                <div className="overflow-x-auto p-6">
                                    {/* table using searchedStokeReport */}
                                    <table className="min-w-full bg-white border border-gray-200 pr-2">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</th>
                                                <th className="px-7 py-3 text-right mr-5 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {searchedStokeReport.map((p) => (
                                                <tr key={p._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <img
                                                            src={p.image ? p.image : ProductIcon}
                                                            alt={p.name}
                                                            className="w-10 h-10 object-cover rounded-full"
                                                        />
                                                    </td>
                                                    <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.name}</td>
                                                    <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.code}</td>
                                                    <td className="px-4 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.brand}</td>
                                                    <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}{formatWithCustomCommas(getPriceRange(p))}</td>
                                                    <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900 flex">
                                                        <p className='mr-2 text-left rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{p.productQty ? p.productQty : getQty(p)}</p> <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-blue-500'>{p.saleUnit}</p>
                                                    </td>
                                                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900">{p.createdAt}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        <div className='flex items-center justify-end'>
                                                            <Link to={`/clickedStokeRep/${p._id}`}
                                                                className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                                                                style={{ background: 'transparent' }}
                                                            >
                                                                <i className="fas fa-eye mr-1"></i>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-red-500 mt-5">{error || 'No products found'}</p>
                        )
                    ) : (
                        stokeData && stokeData.length > 0 ? (
                            <div className="overflow-x-auto p-6">
                                {/* table using stokeData */}
                                <table className="min-w-full bg-white border border-gray-200 pr-2">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                                            <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</th>
                                            <th className="px-7 py-3 text-right mr-5 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stokeData.map((p) => (
                                            <tr key={p._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <img
                                                        src={p.image ? p.image : ProductIcon}
                                                        alt={p.name}
                                                        className="w-10 h-10 object-cover rounded-full"
                                                    />
                                                </td>
                                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.name}</td>
                                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.code}</td>
                                                <td className="px-4 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.brand}</td>
                                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}{formatWithCustomCommas(getPriceRange(p))}</td>
                                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900 flex">
                                                    <p className='mr-2 text-left rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{p.productQty ? p.productQty : getQty(p)}</p> <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-blue-500'>{p.saleUnit}</p>
                                                </td>
                                                <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900">{p.createdAt}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    <div className='flex items-center justify-end'>
                                                        <Link to={`/clickedStokeRep/${p._id}`}
                                                            className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                                                            style={{ background: 'transparent' }}
                                                        >
                                                            <i className="fas fa-eye mr-1"></i>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-700 mt-5">{error || 'No products found'}</p>
                        )
                    ))}
                </div>
                {/* <div>
                    {error && (
                        <p
                            className={`mt-5 text-center ${error === 'No products found' ? 'text-gray-700' : 'text-red-500'}`}
                        >
                            {error}
                        </p>
                    )}
                </div> */}
            </div>
        </div>
    );
}
export default StokeReportBody;
