import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { FaCartPlus, FaExchangeAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { handleExportPdf } from '../utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';
import Fillter from '../../img/filter.png';
import Draggable from 'react-draggable';

function ViewReportBody() {
    // State management
    const { currency } = useCurrency()
    const [saleData, setSaleData] = useState({});
    const [saleReturnData, setSaleReturnData] = useState({});
    const [purchaseData, setPurchaseData] = useState({});
    const [purchaseReturnData, setPurchaseReturnData] = useState({});
    const [totalSaleAmount, setTotalSale] = useState(0);
    const [totalSaleReturnAmount, setTotalSaleReturn] = useState(0);
    const [totalPurchaseAmount, setTotalPurchase] = useState(0);
    const [totalPurchaseReturnAmount, setTotalPurchaseReturn] = useState(0);
    const [searchedCustomerSale, setSearchedCustomerSale] = useState(null);
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('all')
    const [activeTable, setActiveTable] = useState('sales');
    const [loading, setLoading] = useState(false);
    const [fillterOptionPopUp, setFiltterOptionPopUp] = useState(false)
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [orderStatus, setOrderStatus] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState([]);
    const [paymentType, setPaymentType] = useState([]);
    const [date, setDate] = useState('');
    const [filterParams, setFilterParams] = useState("");
    const ref = useRef();

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedCustomerSale) && searchedCustomerSale.length > 0
        ? searchedCustomerSale
        : Array.isArray(saleReturnData) && saleReturnData.length > 0
            ? saleReturnData
            : [];

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

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getReportData/${warehouse}`);
                setSaleData(response.data.data.sales);
                setSaleReturnData(response.data.data.saleReturns);
                setPurchaseData(response.data.data.purchases);
                setPurchaseReturnData(response.data.data.purchaseReturns);

                const sales = response.data.data.sales;
                const saleReturns = response.data.data.saleReturns;
                const purchases = response.data.data.purchases;
                const purchaseReturns = response.data.data.purchaseReturns;

                const formatAmount = (amount) => {
                    const value = amount / 1000;
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(2)}M`; // For values above 10 lakh
                    }
                    return `${value.toFixed(2)}K`; // For values below 10 lakh
                };

                const totalSaleAmount = sales.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const totalSaleReturnAmount = saleReturns.reduce((total, sale) => total + parseFloat(sale.returnAmount || 0), 0);
                const totalPurchaseAmount = purchases.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const totalPurchaseReturnAmount = purchaseReturns.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);

                setTotalSale(formatAmount(totalSaleAmount));
                setTotalSaleReturn(formatAmount(totalSaleReturnAmount));
                setTotalPurchase(formatAmount(totalPurchaseAmount));
                setTotalPurchaseReturn(formatAmount(totalPurchaseReturnAmount));
            } catch (error) {
                console.error('Error fetching report data:', error);
                setError('Failed to fetch report data');
            }
            finally {
                setLoading(false)
            }
        };

        fetchReportData();
    }, [warehouse]);

    useEffect(() => {
        const params = new URLSearchParams();

        const warehouseValue = Array.isArray(warehouse) ? warehouse : [warehouse];
        const orderStatusValue = Array.isArray(orderStatus) ? orderStatus : [orderStatus];
        const paymentStatusValue = Array.isArray(paymentStatus) ? paymentStatus : [paymentStatus];
        const paymentTypeValue = Array.isArray(paymentType) ? paymentType : [paymentType];

        // Ensure "all" is included in the params when selected
        params.append("orderStatus", orderStatusValue.includes("all") ? "all" : orderStatusValue.join(","));
        params.append("paymentStatus", paymentStatusValue.includes("all") ? "all" : paymentStatusValue.join(","));
        params.append("paymentType", paymentTypeValue.includes("all") ? "all" : paymentTypeValue.join(","));
        params.append("warehouse", warehouseValue.includes("all") ? "all" : warehouseValue.join(","));

        if (date) {
            params.append("date", date);
        }

        const paramsString = params.toString();
        setFilterParams(paramsString);

    }, [warehouse, orderStatus, paymentStatus, paymentType, date]);


    useEffect(() => {
        if (!filterParams) return;
        const getFilteredReportData = async () => {
            setLoading(true);

            try {
                setLoading(true);
                const url = `${process.env.REACT_APP_BASE_URL}/api/getFilteredReportData?${filterParams}`;
                const response = await axios.get(url);

                //Process response data
                const { sales, saleReturns, purchases, purchaseReturns } = response.data.data || {
                    sales: [], saleReturns: [], purchases: [], purchaseReturns: []
                };

                //Update state accordingly
                setSaleData(sales);
                setSaleReturnData(saleReturns);
                setPurchaseData(purchases);
                setPurchaseReturnData(purchaseReturns);

            } catch (error) {
                console.error("Error fetching filtered report data:", error);
                // Reset data on error
                setSaleData([]);
                setSaleReturnData([]);
                setPurchaseData([]);
                setPurchaseReturnData([]);
            } finally {
                setLoading(false);
            }
        };

        getFilteredReportData();

    }, [filterParams]);

    const handleTableChange = (table) => {
        setActiveTable(table);
    };

    // Handle search input change
    const handleFindUser = async (e) => {
        const { value } = e.target;
        setKeyword(value); // Update the keyword state
        if (value.length > 0) {
            await handleSubmit(); // Call your search function
        } else {
            setSearchedCustomerSale([]); // Clear results if input is empty
        }
    };

    // Handle search form submission
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchSaleReturns`, {
                params: { customerName: keyword } // Send the keyword
            });

            console.log(response.data); // Log the response data to check its structure

            // Check if the response.data is an array or has a property that holds the array
            if (Array.isArray(response.data)) {
                setSearchedCustomerSale(response.data);
            } else if (response.data && response.data.sales) {
                setSearchedCustomerSale(response.data.sales); // Adjust based on your actual response structure
            } else {
                setSearchedCustomerSale([]); // Fallback to an empty array if data is unexpected
            }
        } catch (error) {
            console.error('Find customer error:', error);
            setSearchedCustomerSale([]); // Clear the search results on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
        });
    }, []);

    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();

        return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
    };


    const exportSalesPdf = () => {
        const formattedData = saleData.map(item => ({
            ...item,
            date: formatDate(item.date),
            grandTotal: formatWithCustomCommas(item.grandTotal, { currency }),
            paidAmount: formatWithCustomCommas(item.paidAmount, { currency })
        }));
        const totalSaleAmount = saleData.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
        handleExportPdf({
            data: formattedData,
            currency,
            title: 'Sales Report',
            summaryTitle: 'Sales Summary',
            tableColumns: ["Customer", "Warehouse", "Date", "Status", `Grand Total (${currency})`, `Paid (${currency})`],
            dataKeys: ["customer", "warehouse", "date", "orderStatus", "grandTotal", "paidAmount"],
            additionalData: {
                "Total Sale Amount": `${currency} ${formatWithCustomCommas(totalSaleAmount)}`,
            },
        });
    };


    const exportSalesReturnPdf = () => {
        const formattedData = combinedProductData.map(item => ({
            ...item,
            date: formatDate(item.date),
            grandTotal: formatWithCustomCommas(item.grandTotal, { currency }),
            paidAmount: formatWithCustomCommas(item.paidAmount, { currency }),
            returnAmount: formatWithCustomCommas(item.returnAmount, { currency })
        }));
        const totalSaleReturnAmount = combinedProductData.reduce((total, sale) => total + parseFloat(sale.returnAmount || 0), 0);
        handleExportPdf({
            data: formattedData,
            currency,
            title: 'Sales Return Report',
            summaryTitle: 'Sales Return Summary',
            tableColumns: ["Warehouse", "Date", `Grand Total(${currency})`, "Paid Amount", "Return Amount", "Note"],
            dataKeys: ["warehouse", "date", "grandTotal", "paidAmount", "returnAmount", "note"],
            additionalData: {
                "Total Sale Return Amount": `${currency} ${formatWithCustomCommas(totalSaleReturnAmount)}`,
            },
        });
    };

    const exportPurchasePdf = () => {
        const formattedData = purchaseData.map(item => ({
            ...item,
            date: formatDate(item.date),
            grandTotal: formatWithCustomCommas(item.grandTotal, { currency }),
            paidAmount: formatWithCustomCommas(item.paidAmount, { currency })
        }));
        const totalPurchaseAmount = purchaseData.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
        handleExportPdf({
            data: formattedData,
            currency,
            title: 'Purchase Report',
            summaryTitle: 'Purchase Summary',
            tableColumns: ["Supplier", "Warehouse", "Date", `Grand Total(${currency})`, `Paid Amount(${currency})`, "Order Status"],
            dataKeys: ["supplier", "warehouse", "date", "grandTotal", "paidAmount", "orderStatus"],
            additionalData: {
                "Total Purchase Amount": `${currency} ${formatWithCustomCommas(totalPurchaseAmount)}`,
            },
        });
    };

    const exportPurchaseReturnPdf = () => {
        const formattedData = purchaseReturnData.map(item => ({
            ...item,
            date: formatDate(item.date),
            grandTotal: formatWithCustomCommas(item.grandTotal, { currency }),
            paidAmount: formatWithCustomCommas(item.paidAmount, { currency })
        }));
        const totalPurchaseReturnAmount = purchaseReturnData.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
        handleExportPdf({
            data: formattedData,
            currency,
            title: 'Purchase Return Report',
            summaryTitle: 'Purchase Return Summary',
            tableColumns: ["Supplier", "Warehouse", "Date", `Grand Total(${currency})`, `Paid Amount(${currency})`, "Note"],
            dataKeys: ["supplier", "warehouse", "date", "grandTotal", "paidAmount", "note"],
            additionalData: {
                "Total Purchase Returns Amount": `${currency} ${formatWithCustomCommas(totalPurchaseReturnAmount)}`,
            },
        });
    };


    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-screen p-5'>
            <div>
                <div className="m-0 flex justify-center items-start">
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
                        {activeTable === 'sales' && (
                            <button onClick={exportSalesPdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                                {'Export As PDF'}
                            </button>
                        )}
                        {activeTable === 'salesReturn' && (
                            <button onClick={exportSalesReturnPdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                                {'Export As PDF'}
                            </button>
                        )}
                        {activeTable === 'purchase' && (
                            <button onClick={exportPurchasePdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                                {'Export As PDF'}
                            </button>
                        )}
                        {activeTable === 'purchaseReturn' && (
                            <button onClick={exportPurchaseReturnPdf} className="submit rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm w-40 text-center">
                                {'Export As PDF'}
                            </button>
                        )}
                    </div>
                </div>

                <div ref={ref} className='pt-2'>
                    <div className="grid gap-4 px-6 mt-10 mb-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                                            {totalSaleAmount}
                                        </h1>
                                        <p className="text-white text-sm">Sale</p> {/* Sale label */}
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
                                            {totalPurchaseAmount}
                                        </h1>
                                        <p className="text-white text-sm">Purchase</p> {/* Sale label */}
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
                                            {totalSaleReturnAmount}
                                        </h1>
                                        <p className="text-white text-sm">Sale Return</p> {/* Sale label */}
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
                                            {totalPurchaseReturnAmount}
                                        </h1>
                                        <p className="text-white text-sm">Purchase Return</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>
                        </Link>

                    </div>

                    <div className='mt-6 mb-4 ml-[4px]'>
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

                    <button onClick={() => setFiltterOptionPopUp(true)} className='flex mt-10 ml-5 mb-5 justify-end'>
                        <img src={Fillter} alt='Fillter' className='w-10 h-10' />
                    </button>


                    {fillterOptionPopUp && (
                        <div className="fixed inset-0 bg-gray-900 w-full bg-opacity-50 flex pb-10 justify-center items-center">
                            <Draggable>
                                <div>
                                    <div className="bg-white w-[350px] sm:w-[400px] p-6 rounded-xl shadow-2xl transform scale-100 opacity-0 animate-fadeIn" >
                                        <button
                                            onClick={() => setFiltterOptionPopUp(false)}
                                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-all"
                                        >
                                            <img
                                                className="w-5 h-5"
                                                src="https://th.bing.com/th/id/OIP.Ej48Pm2kmEsDdVNyEWkW0AHaHa?rs=1&pid=ImgDetMain"
                                                alt="close"
                                            />
                                        </button>
                                        <h1 className='text-center text-gray-600 font-semi-bold'>Fillters</h1>
                                        <div className='mt-5'>
                                            <label className="text-left block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                value={orderStatus}
                                                onChange={(e) => setOrderStatus(e.target.value)}
                                                className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                            >
                                                <option value="">Select Order Status</option>
                                                <option value="all">All</option>
                                                <option value="ordered">Ordered</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                        </div>

                                        {/* Payment Status Select */}
                                        <div className='mt-5'>
                                            <label className="text-left block text-sm font-medium text-gray-700">Payment Status</label>
                                            <select
                                                value={paymentStatus}
                                                onChange={(e) => setPaymentStatus(e.target.value)}
                                                className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                            >
                                                <option value="">Select Payment Status</option>
                                                <option value="all">All</option>
                                                <option value="paid">Paid</option>
                                                <option value="unpaid">Unpaid</option>
                                            </select>
                                        </div>

                                        {/* Payment Type Select */}
                                        <div className='mt-5'>
                                            <label className="text-left block text-sm font-medium text-gray-700">Payment Type</label>
                                            <select
                                                value={paymentType}
                                                onChange={(e) => setPaymentType(e.target.value)}
                                                className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                            >
                                                <option value="">Select Payment Type</option>
                                                <option value="all">All</option>
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="check">Check</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                            </select>
                                        </div>

                                        <div className="mt-5 mb-1"> {/* Use flex-1 here as well */}
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date </label>
                                            <input
                                                id="date"
                                                name="date"
                                                type="date"
                                                required
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                autoComplete="given-name"
                                                className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Draggable>
                        </div>
                    )}


                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : activeTable === 'sales' && saleData.length > 0 ? (
                        <div className="overflow-x-auto p-1 ml-4 mr-[23px]">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 items-center">
                                    {saleData.map((sale) => (
                                        <tr key={sale._id}>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900 items-center">
                                                <p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500 items-center'>{sale.customer}</p>
                                            </td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900">{sale.warehouse}</td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900 items-center">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500 items-center'>{sale.orderStatus}</p>
                                            </td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900 items-center">
                                                <p className={`items-center rounded-[5px] text-center p-[6px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500 items-center' : sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-500 items-center' : 'items-center bg-red-100 text-red-500'}`}>
                                                    {sale.paymentStatus}
                                                </p>
                                            </td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900 items-center">
                                                <p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500 items-center'> {sale.paymentType.map(pt => pt.type).join(' + ')}</p>
                                            </td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900">{currency}{' '} {formatWithCustomCommas(sale.grandTotal)}</td>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900">{currency}{' '} {formatWithCustomCommas(sale.paidAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTable === 'salesReturn' && combinedProductData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {combinedProductData.map((sale) => (
                                        <tr key={sale._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.customer}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{sale.warehouse}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{sale.orderStatus}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                                <p className={`rounded-[5px] text-center p-[6px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-500' : 'bg-red-100 text-red-500'}`}>
                                                    {sale.paymentStatus}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500'>{sale.paymentType}</p></td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.grandTotal)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.paidAmount)}</td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(sale.returnAmount ? sale.returnAmount : 0.00)}</td>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500'>{purchased.paymentType}</p></td>
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned Reason</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {purchaseReturnData.map((purchased) => (
                                            <tr key={purchased._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{purchased.supplier}</p></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{purchased.warehouse}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{new Date(purchased.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{purchased.returnType}</p></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500'>{purchased.note}</p></td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(purchased.grandTotal)}</td>
                                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '}  {formatWithCustomCommas(purchased.paidAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>) :
                            <p className='text-center text-gray-700 mt-5'>Not data available</p>}
                </div>
                <div>
                    {error && <p className="text-green-500 mt-5 text-center">{error}</p>}
                </div>
            </div>
        </div >
    );
}

export default ViewReportBody;
