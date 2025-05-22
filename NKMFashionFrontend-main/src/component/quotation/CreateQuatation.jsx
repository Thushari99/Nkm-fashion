import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleProductSelect, handleProductSearch, handleCustomerSearch, getDiscount, handleCustomerSelect, handleWarehouseChange, handleVariationChange, getQty, getPriceRange, handleDelete, handleQtyChange, getTax } from '../sales/SaleController'
import { handleSaveQuatation } from './QuatationController'
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../pos/utils/fetchByWarehose';
import Decrease from '../../img/down-arrow (1).png'
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import User from '../../img/add-user (1).png';
import { isValidMobileInput, isAllowedKey } from '../utill/MobileValidation';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function CreateQuatationBody() {
    // State management
    const { currency } = useCurrency()
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCustomer, setSearchCustomer] = useState('');
    const [filteredCustomer, setFilteredCustomer] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [date, setDate] = useState('')
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [productBillingHandling, setSearchedProductData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [discountSymbole, setDiscountSymbole] = useState(currency);
    const [discount, setDiscount] = useState('')
    const [shipping, setShipping] = useState('')
    const [tax, setTax] = useState('')
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [statusOfQuatation, setStatusOfQuatation] = useState(false)
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [nic, setNIC] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate()

    useEffect(() => {
        const fetchAllWarehouses = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`);
                console.log('All Warehouses Response:', response.data);
                setWarehouseData(response.data.warehouses || []);
            } catch (error) {
                console.error('Failed to fetch all warehouses:', error);
            }
        };

        fetchAllWarehouses();
    }, []);

    useEffect(() => {
        // Set the default value to today's date in 'YYYY-MM-DD' format
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setDate(formattedDate);
    }, []);

    const calculateTotal = () => {
        const productTotal = selectedProduct.reduce((total, product) => {
            const productPrice = Number(getPriceRange(product, product.selectedVariation));
            const productQty = product.barcodeQty || 1;
            const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
            const discount = Number(getDiscount(product, product.selectedVariation));
            const discountedPrice = productPrice - discount

            const subTotal = (discountedPrice * productQty) + (productPrice * productQty * taxRate);
            return total + subTotal;
        }, 0);
        let discountValue = 0;
        if (discountType === 'fixed') {
            discountValue = Number(discount);
        } else if (discountType === 'percentage') {
            discountValue = (productTotal * Number(discount)) / 100;
        }

        const shippingValue = Number(shipping);
        const globalTaxRate = Number(tax) / 100;
        const globalTax = productTotal * globalTaxRate;
        const grandTotal = productTotal - discountValue + shippingValue + globalTax;
        return grandTotal;
    };

    const handleDiscountType = (e) => {
        setDiscountType(e.target.value)
    }
    const handleDiscount = (e) => {
        if (!discountType) {
            alert('Please select a discount type first.');
            return;
        }
        const value = e.target.value;
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }
        setDiscount(value);
    };
    useEffect(() => {
        if (discountType === 'fixed') {
            return setDiscountSymbole(currency);
        }
        if (discountType === 'percentage') {
            return setDiscountSymbole('%');
        }
    }, [discountType]);

    const handleTax = (e) => {
        setTax(e.target.value)
    }
    const handleShippng = (e) => {
        setShipping(e.target.value)
    }
    const togglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    }
    const handleClose = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);

        try {
            if (!username.includes('@')) {
                const errorMsg = 'Username must be a valid email address containing "@"';
                setError(errorMsg);
                console.error(errorMsg);
                return;
            }

            // Mobile number validation
            const mobileRegex = /^\+94\d{9}$/;
            if (!mobileRegex.test(mobile)) {
                const errorMsg = 'Invalid mobile number. Format: +94xxxxxxxxx';
                setError(errorMsg);
                console.error(errorMsg);
                return;
            }

            // NIC validation: Ensure it is exactly 12 characters long
            const newNicFormat = /^\d{12}$/; // 12 digits for the new format
        const oldNicFormat = /^\d{9}[VX]$/; // 9 digits followed by V or X for the old format
        
        if (!newNicFormat.test(nic) && !oldNicFormat.test(nic)) {
            const errorMsg = 'NIC must be either 12 digits (new format) or 9 digits followed by V/X (old format)';
            setError(errorMsg);
            console.error(errorMsg);
            return;
        }
            // Customer data
            const customerData = {
                username,
                name,
                nic,
                country,
                city,
                mobile,
                address,
            };
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createCustomer`, customerData);

            if (response.data && response.data.message) {
                setResponseMessage(response.data.message);

                setTimeout(() => {
                    navigate('/createQuotation');
                    setIsPopupOpen(!isPopupOpen);
                }, 1000);
            } else {
                setTimeout(() => {
                    navigate('/createQuotation');
                    setIsPopupOpen(!isPopupOpen);
                }, 1000);
                setResponseMessage('Customer created successfully.');
                console.log('Success: Customer created.');
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || 'An error occurred while adding the customer.please try again.';
            setError(errorMessage || 'Error creating customer.');
            console.error('Error:', errorMessage, error);
        }
        finally {
            setProgress(false);
        }
    };
    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='mt-20 flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Quotation</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewQuotation'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-10">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Select warehouse <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    value={warehouse}

                                    onChange={(e) =>
                                        handleWarehouseChange(
                                            e,
                                            setWarehouse,
                                            fetchProductDataByWarehouse,
                                            setProductData,
                                            setSelectedCategoryProducts,
                                            setSelectedBrandProducts,
                                            setSearchedProductData,
                                            setLoading
                                        )
                                    }
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="" disabled>
                                        Select Warehouse
                                    </option>
                                    {warehouseData.map((wh) => (
                                        <option key={wh.name} value={wh.name}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>


                            {/* customer */}
                            <div className="flex-1 relative"> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                                    <input
                                        id="customer"
                                        name="customer"
                                        value={searchCustomer}
                                        required
                                        onChange={(e) => handleCustomerSearch(e, setSearchCustomer, setFilteredCustomer)}
                                        placeholder={searchCustomer ? "" : "        Search..."}
                                        className="searchBox w-full pl-2 pr-2 py-2 rounded-l-md border-0"
                                    />
                                    {/* Add Customer Button */}
                                    <button
                                        type="button"
                                        onClick={togglePopup}
                                        className="px-3 py-2 bg-gray-200 hover:bg-gray-100 rounded-r-md border-0"
                                    >
                                        <img
                                            className="flex items-center justify-center w-[26px] h-[24px]"
                                            src={User}
                                            alt="user"
                                        />
                                    </button>
                                </div>

                                {filteredCustomer.length > 0 && (
                                    <ul className="absolute z-10 mt-1 w-[345px] bg-white border border-gray-300 rounded-md shadow-lg">
                                        {filteredCustomer.map((customer) => (
                                            <li
                                                key={customer._id}
                                                onClick={() => handleCustomerSelect(customer, setSelectedCustomer, setSearchCustomer, setFilteredCustomer)}
                                                className="cursor-pointer hover:bg-gray-100 px-4 py-4 text-left"
                                            >
                                                {customer.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/*Date*/}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
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
                    </form>

                    <div className="flex-1 mt-5 relative">
                        {/* Input Field */}
                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Search Products
                        </label>
                        <input
                            id="text"
                            name="text"
                            type="text"
                            required
                            value={searchTerm}
                            onChange={(e) => handleProductSearch(e, setSearchTerm, setFilteredProducts, warehouse)}
                            placeholder="Search product..."
                            className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${
                                !warehouse ? "bg-gray-100 cursor-not-allowed" : ""
                            }`}
                            disabled={!warehouse}
                        />

                        {/* Dropdown List */}
                        {filteredProducts.length > 0 && (
                            <ul className="absolute left-0 z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                {filteredProducts.map((product) => (
                                    <li
                                        key={product._id}
                                        onClick={() => handleProductSelect(product, setSelectedProduct, setSearchTerm, setFilteredProducts)}
                                        className="cursor-pointer hover:bg-gray-100 text-left  px-4 py-2"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Optional Validation Message */}
                        {!warehouse && (
                            <p className="text-red-500 text-sm mt-1 text-left">Please select a warehouse to search products.</p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {selectedProduct.length > 0 && (
                            <table className="mt-10 min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProduct.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm "><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.productQty || getQty(product, product.selectedVariation)}</p></td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, -1)} // Decrement
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='increase' />
                                                    </button>
                                                    <span className="mx-2">
                                                        {product.ptype === "Variation"
                                                            ? product.variationValues[product.selectedVariation]?.barcodeQty || 1
                                                            : product.barcodeQty || 1
                                                        }
                                                    </span>
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, 1)} // Increment            
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='decrease' />
                                                    </button>
                                                </div>
                                            </td>


                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(getPriceRange(product, product.selectedVariation))}
                                            </td>

                                            {/* Display Product Tax */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.orderTax
                                                    ? `${product.orderTax}%`
                                                    : `${getTax(product, product.selectedVariation)}%`}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency}  {
                                                    (() => {
                                                        const price = getPriceRange(product, product.selectedVariation);
                                                        const quantity = product.variationValues?.[product.selectedVariation]?.barcodeQty || product.barcodeQty || 1;
                                                        const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
                                                        const discount = getDiscount(product, product.selectedVariation);
                                                        const discountedPrice = price - discount

                                                        const subtotal = (discountedPrice * quantity) + (price * quantity * taxRate);
                                                        return formatWithCustomCommas(subtotal);
                                                    })()
                                                }
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.ptype === 'Variation' && product.variationValues ? (
                                                    <select
                                                        value={product.selectedVariation}
                                                        onChange={(e) => handleVariationChange(index, e.target.value, setSelectedProduct)}
                                                        className="block w-full border py-2 border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                                    >
                                                        {Object.keys(product.variationValues).map((variationKey) => (
                                                            <option key={variationKey} value={variationKey}>
                                                                {variationKey}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span>No Variations</span>
                                                )}
                                            </td>


                                            {/* Delete Action */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleDelete(index, selectedProduct, setSelectedProduct)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="">
                        {/* DISCOUNT, SHIPPING AND TAX INPUT */}
                        <div className="grid grid-cols-4 gap-4 mb-4 mt-60">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Type:</label>
                                <select
                                    onChange={handleDiscountType}
                                    value={discountType}
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
                                    value={discount}
                                    type="text"
                                    placeholder="Discount"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {discountSymbole}
                                </span>
                            </div>
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Tax:</label>
                                <input
                                    onChange={handleTax}
                                    value={tax}
                                    type="text"
                                    placeholder="Tax"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2  pr-3 text-gray-500">
                                    %
                                </span>
                            </div>
                            <div className='relative'>
                                <label className="block text-left text-sm font-medium text-gray-700">Shipping:</label>
                                <input
                                    onChange={handleShippng}
                                    value={shipping}
                                    type="text"
                                    placeholder="Shipping"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2  pr-3 text-gray-500">
                                    {currency}
                                </span>
                            </div>
                        </div>

                        {/* Order, Payment Status, and Payment Type Selects */}
                        <div className="grid grid-cols-3 gap-4 mt-10">
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700">Order Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Order Status</option>
                                    <option value="ordered">Sent</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            {/* Payment Status Select */}
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700">Payment Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
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
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
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
                    <div className="mt-4 text-right text-lg font-semibold">
                        Total: {currency} {formatWithCustomCommas(calculateTotal())}
                    </div>
                    <div className="container mx-auto text-left">
                        <div className='mt-10 flex justify-start'>
                            <button onClick={() => handleSaveQuatation(
                                calculateTotal().toFixed(2), orderStatus, paymentStatus, paymentType, shipping, discountType, discount, tax, warehouse, selectedCustomer, selectedProduct, date, setResponseMessage, setError, setProgress, statusOfQuatation, navigate)} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
                                Save Quotation
                            </button>
                        </div>
                    </div>

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

                {isPopupOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white w-[800px] h-[62cdb0px] overflow-auto p-8 pt-4 rounded-md shadow-lg mt-28 mb-10" data-aos="fade-down">
                            <form onSubmit={handleSubmit}>
                                <div className="flex space-x-16">
                                    <div className="flex-1">
                                        {/* Username field */}
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">User Name <span className='text-red-500'>*</span></label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder='sample@gmail.com'
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                autoComplete="email"
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>

                                        {/* Country field */}
                                        <div className="mt-5">
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Country <span className='text-red-500'>*</span></label>
                                            <input
                                                id="country"
                                                name="country"
                                                type="text"
                                                required
                                                placeholder='Sri Lanka'
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                autoComplete="given-name"
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>

                                        {/* City field */}
                                        <div className="mt-5">
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">City <span className='text-red-500'>*</span></label>
                                            <input
                                                id="city"
                                                name="city"
                                                type="text"
                                                required
                                                placeholder='Kandy'
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                autoComplete="given-name"
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>

                                        {/* Address field */}
                                        <div className="mt-5">
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Address <span className='text-red-500'>*</span></label>
                                            <textarea
                                                id="address"
                                                name="address"
                                                type="text"
                                                required
                                                placeholder='No 46,Rock view Garden Thennekumbura'
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                autoComplete="given-name"
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>

                                    </div>

                                    <div className="flex-1">
                                        {/* Name field */}
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Name <span className='text-red-500'>*</span></label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                placeholder='Ben'
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                autoComplete="given-name"
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>

                                        {/* Date of Birth field */}
                                        <div className="mt-5">
                                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">NIC <span className='text-red-500'>*</span></label>
                                            <input
                                                id="nic"
                                                name="nic"
                                                type="text"
                                                placeholder='200123456789'
                                                required
                                                value={nic}
                                                onChange={(e) => setNIC(e.target.value)}
                                                maxLength={12}
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>

                                        {/* Mobile number field */}
                                        <div className="mt-5">
                                            <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                                Mobile number <span className='text-red-500'>*</span>
                                            </label>
                                            <div className="mt-0">
                                                <input
                                                    id="mobile"
                                                    name="mobile"
                                                    type="text"
                                                    required
                                                    placeholder='+94 xx xxxx xxx'
                                                    value={mobile}
                                                    onChange={(e) => {
                                                        const inputValue = e.target.value;
                                                        if (isValidMobileInput(inputValue)) {
                                                            setMobile(inputValue);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (!isAllowedKey(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    maxLength={12}
                                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="container mx-auto text-left">
                                    <div className='mt-10 flex justify-start'>
                                        <button
                                            type='submit'
                                            className={`button-bg-color  button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-50`}
                                        >
                                            Save
                                        </button>

                                        <button
                                            type="button"
                                            className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px]  focus:ring-gray-500 focus:ring-offset-2"
                                            onClick={handleClose}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </form>
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
                )}
            </div>
        </div>
    );
}
export default CreateQuatationBody;
