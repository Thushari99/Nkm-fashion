import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleProductSelect } from '../sales/SaleController'
import { handleUpdateQuatation } from './QuatationController'
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import Decrease from '../../img/down-arrow (1).png'
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function EditQuatationBody() {
    // State management
    const { currency } = useCurrency()
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [quatationData, setQuatationData] = useState([])
    const [quatationProductData, setQuatationProductData] = useState([])
    const [selectedDate, setSelectedDate] = useState('');
    const [progress, setProgress] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const findSaleById = async () => {
            try {
                setProgress(true)
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findQuatationById/${id}`);
                const fetchedProductsQty = response.data.productsData || [];
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0]
                }));
                setQuatationProductData(initializedProductsQty);
                setQuatationData(response.data);
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
                setError('Cannot get sale by Id.');
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
        const subtotal = quatationProductData.reduce((acc, product, index) => {
            const productQty = quatationProductData[index]?.quantity || 1;
            const productTaxRate = quatationProductData[index]?.taxRate / 100 || 0;
            const discount = quatationProductData[index]?.discount || 0;
            const productPrice = quatationProductData[index]?.price || 0;
            const discountedPrice = productPrice - discount;

            // Calculate subtotal based on the specified formula
            const productSubtotal = ((discountedPrice) * productQty) + ((productPrice) * productQty * (productTaxRate * 100));
            return acc + productSubtotal;
        }, 0);

        const discountAmount = discountType === 'percentage'
            ? subtotal * (quatationData.discount / 100)
            : quatationData.discount || 0;

        const shipping = parseFloat(quatationData.shipping) || 0;
        const overallTaxRate = quatationData.tax ? parseFloat(quatationData.tax) / 100 : 0;
        const taxAmount = subtotal * overallTaxRate;
        const total = (subtotal - discountAmount) + taxAmount + shipping;
        return total.toFixed(2);
    };

    useEffect(() => {
        if (quatationData.date) {
            const formattedDate = new Date(quatationData.date).toISOString().slice(0, 10);
            setSelectedDate(formattedDate);
        }
    }, [quatationData.date]);
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleOrderStatusChange = (e) => {
        const newOrderStatus = e.target.value;
        setOrderStatus(newOrderStatus);
        setQuatationData((prevData) => ({
            ...prevData,
            orderStatus: newOrderStatus,
        }));
    };

    const handlePaymentStatusChange = (e) => {
        const newPaymentStatus = e.target.value;
        setPaymentStatus(newPaymentStatus);
        setQuatationData((prevData) => ({
            ...prevData,
            paymentStatus: newPaymentStatus,
        }));
    };

    const handlePaymentTypeChange = (e) => {
        const newPaymentType = e.target.value;
        setPaymentType(newPaymentType);
        setQuatationData((prevData) => ({
            ...prevData,
            paymentType: newPaymentType,
        }));
    };

    const handleDiscountType = (e) => {
        const value = e.target.value;
        setDiscountType(value);
        setQuatationData({
            ...quatationData,
            discountType: value,
        });
    };

    const handleDiscount = (e) => {
        const value = e.target.value;

        // If the discount type is 'percentage', validate the entered value
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue) || numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }

        // Update the saleProduct state with the new discount value
        setQuatationData({
            ...quatationData,
            discount: value
        });
    };

    const handleTax = (e) => {
        setQuatationData({ ...quatationData, tax: e.target.value });
    };

    const handleShippng = (e) => {
        setQuatationData({ ...quatationData, shipping: e.target.value });
    };

    const handleQtyChange = (index, delta) => {
        setQuatationProductData(prev => {
            const currentQty = prev[index]?.quantity || 1;
            let newQty = currentQty + delta;
            const stockQty = prev[index]?.stockQty || 0;

            // Ensure the new quantity is within the valid range
            newQty = Math.max(1, Math.min(newQty, stockQty));

            const productPrice = prev[index].price;
            const productTaxRate = prev[index].taxRate;
            const discount =  prev[index].discount;
            const discountedPrice = productPrice - discount
            const newSubtotal = ((discountedPrice) * newQty) + (productPrice * newQty * productTaxRate);

            const updatedQuatationProductData = prev.map((item, i) =>
                i === index
                    ? { ...item, quantity: newQty, subtotal: newSubtotal.toFixed(2) }
                    : item
            );
            console.log('Updated State:', updatedQuatationProductData);
            return updatedQuatationProductData;
        });
    };

    const handleDelete = async (quatationID, productID) => {
        if (!quatationID || !productID) {
            alert("Invalid quotation or product ID.");
            return;
        }

        const total = calculateTotal();
        console.log('quatationID:', quatationID, 'productID:', productID);

        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this item?");
            if (!confirmDelete) return;

            const response = await axios.delete(
                `${process.env.REACT_APP_BASE_URL}/api/deleteProductFromQuatation`,
                { params: { quatationID, productID, total } }
            );

            if (response.status === 200) {
                alert("Item deleted successfully!");
                // Update UI or refresh the data here if necessary
            } else {
                alert("Failed to delete the item.");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            setError('Error deleting the item');

            if (error.response) {
                alert(`Failed to delete item: ${error.response.data.message || 'Unknown server error'}`);
            } else if (error.request) {
                alert("No response from the server. Please check your network connection.");
            } else {
                alert(`Unexpected error: ${error.message}`);
            }
        }
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between mt-20 items-center'>
                <div>
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Edit Quatation</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewQuotation'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1"> {/* Use flex-1 to allow the field to take full width */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <input
                                    id="warehouse"
                                    name="warehouse"
                                    value={quatationData.warehouse}
                                    disabled
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    {/* <option value="">Select a warehouse</option>
                                    {warehouseData.map((wh) => (
                                        <option key={wh.name} value={wh.name}>
                                            {wh.name}
                                        </option>
                                    ))} */}
                                </input>
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* customer */}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    disabled
                                    value={quatationData.customer}
                                    required
                                    placeholder={"      Search..."}
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>
                            <div>
                            </div>

                            {/*Date*/}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>

                    <div>
                        {filteredProducts.length > 0 && (
                            <ul className="absolute left-0 z-10 ml-[82px] w-[1213px] bg-white border border-gray-300 rounded-md shadow-lg">
                                {filteredProducts.map((product) => (
                                    <li
                                        key={product._id}
                                        onClick={() => handleProductSelect(product, setSelectedProduct, setSearchTerm, setFilteredProducts)}
                                        className="cursor-pointer hover:bg-gray-100 px-4 py-4 text-left"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="mt-10 min-w-full bg-white border rounded-md border-gray-200">
                            <thead className="rounded-md bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            {quatationProductData.length > 0 && (
                                <tbody>
                                    {quatationProductData.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.stockQty}</p>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, -1)} // Decrement
                                                        disabled={!(quatationProductData[index]?.quantity > 1)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='decrease' />
                                                    </button>
                                                    <span className="mx-2">
                                                        {quatationProductData[index]?.quantity || 1}  {/* Display the current quantity */}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQtyChange(index, 1)} // Increment
                                                        disabled={!(quatationProductData[index]?.quantity < product.stockQty)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='increase' />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                {currency} {product.price}
                                            </td>

                                            {/* Product Tax */}
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.taxRate * 100} %  {/* Show a default if no tax is available */}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.variationValue ? product.variationValue : 'No Variation'}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                {currency} {product.subtotal}
                                            </td>

                                            {/* Delete Action */}
                                            <div className='flex justify-end'>
                                                <td className="px-6 justify-end py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button
                                                        onClick={() => handleDelete(id, product.currentID)}
                                                        className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                    >
                                                        <i className="fas fa-trash mr-1"></i>
                                                    </button>
                                                </td>
                                            </div>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>

                    <div className="">
                        {/* DISCOUNT, SHIPPING AND TAX INPUT */}
                        <div className="grid grid-cols-4 gap-4 mb-4 mt-60">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Type:</label>
                                <select
                                    onChange={handleDiscountType}
                                    value={quatationData.discountType}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option value=''>Discount type</option>
                                    <option value='fixed'>Fixed</option>
                                    <option value='percentage'>Percentage</option>
                                </select>
                            </div>
                            <div className='relative'>
                                <label className="block text-left text-sm font-medium text-gray-700">Discount:</label>
                                <input
                                    onChange={handleDiscount}
                                    value={quatationData.discount}
                                    type="text"
                                    placeholder="Discount"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {discountType === 'percentage' ? '%' : currency}
                                </span>
                            </div>
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Tax:</label>
                                <input
                                    onChange={handleTax}
                                    value={quatationData.tax}
                                    type="text"
                                    placeholder="Tax"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    %
                                </span>
                            </div>
                            <div className='relative'>
                                <label className="block text-left text-sm font-medium text-gray-700">Shipping:</label>
                                <input
                                    onChange={handleShippng}
                                    value={quatationData.shipping}
                                    type="text"
                                    placeholder="Shipping"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {currency}
                                </span>
                            </div>
                        </div>

                        {/* Order, Payment Status, and Payment Type Selects */}
                        <div>
                            <div className="grid grid-cols-3 gap-4 mt-10">
                                <div>
                                    <label className="block text-left text-sm font-medium text-gray-700">Status: <span className='text-red-500'>*</span></label>
                                    <select
                                        value={quatationData.orderStatus}
                                        onChange={handleOrderStatusChange}
                                        className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    >
                                        <option value="">Select Order Status</option>
                                        <option value="ordered">Ordered</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>

                                {/* Payment Status Select */}
                                <div>
                                    <label className="block text-left text-sm font-medium text-gray-700">Payment Status: <span className='text-red-500'>*</span></label>
                                    <select
                                        value={quatationData.paymentStatus}
                                        onChange={handlePaymentStatusChange}
                                        className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    >
                                        <option value="">Select Payment Status</option>
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>

                                {/* Payment Type Select */}
                                <div>
                                    <label className="block text-left text-sm font-medium text-gray-700">Payment Type: <span className='text-red-500'>*</span></label>
                                    <select
                                        value={quatationData.paymentType}
                                        onChange={handlePaymentTypeChange}
                                        className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    >
                                        <option value="">Select Payment Type</option>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="check">Check</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Total: {currency} {formatWithCustomCommas(calculateTotal())}
                    </div>
                    <button
                        onClick={() => handleUpdateQuatation(id, calculateTotal(), quatationData.orderStatus, quatationData.paymentStatus, quatationData.paidAmount, quatationData.paymentType, quatationData.shipping, quatationData.discountType, quatationData.discount, quatationData.tax, quatationData.warehouse, quatationData.selectedCustomer, quatationProductData, selectedDate, setError, setResponseMessage, setProgress, navigate)}
                        className="mt-5 submit w-[200px] text-white rounded py-2 px-4"
                    >
                        Update & Save
                    </button>

                    {/* Error and Response Messages */}
                    <div className="mt-10">
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
        </div>
    );
}
export default EditQuatationBody;
