import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleUpdateSaleReturn } from '../SaleController'
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import Decrease from '../../../img/down-arrow (1).png'
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';

function EditSaleReturnBody() {
    // State management
    const { currency } = useCurrency()
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [saleReturnPayingData, setSaleReturnPayingData] = useState([])
    const [saleReturnData, setSaleReturnData] = useState([])
    const [selectedDate, setSelectedDate] = useState('');
    const [note, setNote] = useState('');
    const [progress, setProgress] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const findSaleById = async () => {
            try {
                setProgress(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findSaleReturnById/${id}`);
                const fetchedProductsQty = response.data.productsData || [];
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0]
                }));
                console.log("Edited sale return ", response.data)
                setSaleReturnData(initializedProductsQty);
                setSaleReturnPayingData(response.data);
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
                setResponseMessage('Error fetching sale return')
                setError(error)
            }
            finally {
                setProgress(false);
            }
        };
        if (id) {
            findSaleById();
        }
    }, [id]);

    const calculateTotal = () => {
        // Step 1: Sum all product subtotals including the tax for each product
        const subtotal = saleReturnData.reduce((acc, product, index) => {
            const productQty = saleReturnData[index]?.quantity || 1;

            const productTaxRate = saleReturnData[index]?.taxRate / 100 || 0;

            // Calculate subtotal based on the specified formula
            const productSubtotal = (product.price * productQty) + (product.price * productQty * productTaxRate);
            return acc + productSubtotal;
        }, 0);

        const discountAmount = discountType === 'percentage'
            ? subtotal * (saleReturnPayingData.discount / 100)
            : saleReturnPayingData.discount || 0;

        const shipping = parseFloat(saleReturnPayingData.shipping) || 0;
        const overallTaxRate = saleReturnPayingData.tax ? parseFloat(saleReturnPayingData.tax) / 100 : 0;
        const taxAmount = subtotal * overallTaxRate;
        const total = (subtotal - discountAmount) + taxAmount + shipping;
        return total.toFixed(2);
    };

    useEffect(() => {
        if (saleReturnPayingData.date) {
            const formattedDate = new Date(saleReturnPayingData.date).toISOString().slice(0, 10);
            setSelectedDate(formattedDate);
        }
    }, [saleReturnPayingData.date]);
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleOrderStatusChange = (e) => {
        const newOrderStatus = e.target.value;
        setOrderStatus(newOrderStatus);
        setSaleReturnPayingData((prevData) => ({
            ...prevData,
            orderStatus: newOrderStatus,
        }));
    };

    const handlePaymentStatusChange = (e) => {
        const newPaymentStatus = e.target.value;
        setPaymentStatus(newPaymentStatus);
        setSaleReturnPayingData((prevData) => ({
            ...prevData,
            paymentStatus: newPaymentStatus,
        }));
    };

    const handlePaymentTypeChange = (e) => {
        const newPaymentType = e.target.value;
        setPaymentType(newPaymentType);
        setSaleReturnPayingData((prevData) => ({
            ...prevData,
            paymentType: newPaymentType,
        }));
    };

    const handleDiscountType = (e) => {
        const value = e.target.value;
        setDiscountType(value);
        setSaleReturnPayingData({
            ...saleReturnPayingData,
            discountType: value,
        });
    };

    const handleDiscount = (e) => {
        const value = e.target.value;

        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue) || numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }
        setSaleReturnPayingData({
            ...saleReturnPayingData,
            discount: value
        });
    };

    const handleTax = (e) => {
        setSaleReturnPayingData({ ...saleReturnPayingData, tax: e.target.value });
    };
    const handleShippng = (e) => {
        setSaleReturnPayingData({ ...saleReturnPayingData, shipping: e.target.value });
    };
    const handleQtyChange = (index, valueOrDelta, isDirectInput = false) => {
        setSaleReturnData((prev) => {
            if (!prev[index]) return prev; // Safeguard for invalid index

            const { quantity = 1, stokeQty = 0, price = 0, taxRate = 0 } = prev[index];

            // Determine the new quantity
            let newQty;
            if (isDirectInput) {
                // For direct input, parse the value and clamp it to valid bounds
                const parsedValue = parseInt(valueOrDelta, 10);
                if (isNaN(parsedValue)) return prev; // Ignore invalid input
                newQty = Math.max(1, Math.min(parsedValue, stokeQty));
            } else {
                // For increment/decrement actions
                newQty = Math.max(1, Math.min(quantity + valueOrDelta, stokeQty));
            }

            // Calculate the new subtotal
            const productTaxRate = taxRate / 100;
            const newSubtotal = (price * newQty) + (price * newQty * productTaxRate);

            // Update the data
            return prev.map((item, i) =>
                i === index
                    ? { ...item, quantity: newQty, subtotal: newSubtotal.toFixed(2) }
                    : item
            );
        });
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex mt-20 justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Edit Sale Return</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewSaleReturns'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-10">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={saleReturnPayingData.warehouse}
                                    required
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* customer */}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={saleReturnPayingData.customer}
                                    required
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>

                            {/*Date*/}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                                <LinearProgress />
                            </Box>
                        ) : saleReturnData && saleReturnData.length > 0 ? (
                            <table className="mt-10 min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {saleReturnData.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm ">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.stokeQty}</p>
                                            </td>

                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, -1)} // Decrement
                                                        disabled={!(saleReturnData[index]?.quantity > 1)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='decrease' />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={saleReturnData[index]?.quantity || 1}
                                                        onChange={(e) =>
                                                            handleQtyChange(index, parseInt(e.target.value, 10), true) // Direct input handling
                                                        }
                                                        className="mx-2 w-16 py-[6px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                        max={saleReturnData[index]?.stokeQty || 0} // Restrict input to stock limits
                                                    />
                                                    <button
                                                        onClick={() => handleQtyChange(index, 1)} // Increment
                                                        disabled={!(saleReturnData[index]?.quantity < product.stokeQty)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='increase' />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency}{' '} {formatWithCustomCommas(product.price)}
                                            </td>

                                            {/* Product Tax */}
                                            <td className="px-6 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                {product.taxRate} %  {/* Show a default if no tax is available */}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency}{' '} {formatWithCustomCommas(product.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="px-6 py-4 text-sm text-gray-500">No data available.</div>
                        )}
                    </div>

                    <div className="">
                        <div className="grid grid-cols-1 gap-4 mt-10">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Reason: <span className='text-red-500'>*</span></label>
                                <textarea
                                    value={note}
                                    type="text"
                                    placeholder="Add a reason for the return"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 max-h-20 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm'
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-right text-lg font-semibold">
                        Paid Amount :  {currency}{' '} {formatWithCustomCommas(saleReturnPayingData.paidAmount)}
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Total:  {currency}{' '} {formatWithCustomCommas(calculateTotal())}
                    </div>

                    <button
                        onClick={() => handleUpdateSaleReturn(id, calculateTotal(), saleReturnPayingData.paidAmount, saleReturnPayingData.warehouse, saleReturnPayingData.selectedCustomer, saleReturnData, selectedDate, note, setError, setResponseMessage, setProgress, navigate)}
                        className="mt-5 submit w-[200px] text-white rounded py-2 px-4"
                    >
                        Update & Save
                    </button>
                </div>
                {/* Error and Response Messages */}
                <div className="mt-5">
                    <div className="relative">
                        {/* Reserve space for messages */}
                        <div className="absolute top-0 left-0 w-full">
                            {error && (
                                <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 text-center mx-auto max-w-sm">
                                    {error}
                                </p>
                            )}
                            {responseMessage && (
                                <p className="text-color px-5 py-2 rounded-md bg-green-100 text-center mx-auto max-w-sm">
                                    {responseMessage}
                                </p>
                            )}
                        </div>
                        {/* Reserve empty space to maintain layout */}
                        <div className="h-[50px]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default EditSaleReturnBody;
