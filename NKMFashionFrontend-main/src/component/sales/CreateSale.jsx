import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleProductSelect, handleProductSearch, handleCustomerSearch, handleCustomerSelect, handleWarehouseChange, handleVariationChange, getProductCost, getDiscount, getQty, getPriceRange, handleDelete, handleQtyChange, getTax, handleSave } from './SaleController'
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../pos/utils/fetchByWarehose';
import Decrease from '../../img/down-arrow (1).png';
import { decryptData } from '../utill/encryptionUtils';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import formatWithCustomCommas from '../utill/NumberFormate';
import { useCurrency } from '../../context/CurrencyContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';


function CreateSaleBody() {
    const navigate = useNavigate();

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
    const [progress, setProgress] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [discountSymbole, setDiscountSymbole] = useState(currency);
    const [discount, setDiscount] = useState('')
    const [shipping, setShipping] = useState('')
    const [tax, setTax] = useState('')
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [note, setNote] = useState('null');
    const [invoiceData, setInvoiceData] = useState([]);
    const [balance, setBalance] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [shouldPrint, setShouldPrint] = useState(false);
    const [paymentType, setPaymentType] = useState({
        cash: false,
        card: false,
        bank_transfer: false
    });

    const [amounts, setAmounts] = useState({
        cash: '',
        card: '',
        bank_transfer: ''
    });
    const numberRegex = /^[0-9]*(\.[0-9]+)?$/;
    const [decryptedUser, setDecryptedUser] = useState(null);
    const [preFix, setPreFix] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState(null);

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
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setDate(formattedDate);
    }, []);

    const calculateBalance = () => {
        const total = calculateTotal();
        const paidAmount = Object.values(amounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
        return total - paidAmount; // Balance = Grand Total - Paid Amount
    };


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

        // Shipping cost remains the same
        const shippingValue = Number(shipping);

        // Calculate global tax for the total bill
        const globalTaxRate = Number(tax) / 100; // Convert to decimal
        const globalTax = productTotal * globalTaxRate; // Tax on total product amount

        // Grand total = productTotal - discount + shipping + globalTax
        const grandTotal = productTotal - discountValue + shippingValue + globalTax;

        return grandTotal;
    };

    const calculateProfitOfSale = () => {
        const profitTotal = selectedProduct.reduce((totalProfit, product) => {
            const productPrice = Number(getPriceRange(product, product.selectedVariation));
            const productCost = Number(getProductCost(product, product.selectedVariation));
            const productQty = product.barcodeQty || 1;
            const discount = Number(getDiscount(product, product.selectedVariation));
            const discountedPrice = productPrice - discount;

            const totalProductCost = (productCost * productQty)
            const subTotal = (discountedPrice * productQty);
            const profitOfProduct = subTotal - totalProductCost;
            return totalProfit + profitOfProduct;

        }, 0);

        let discountValue = 0;
        if (discountType === 'fixed') {
            discountValue = Number(discount);
        } else if (discountType === 'percentage') {
            discountValue = (profitTotal * Number(discount)) / 100;
        }

        // Grand total = productTotal - discount + shipping + globalTax
        const pureProfit = profitTotal - discountValue;
        return pureProfit;
    };

    const handleDiscountType = (e) => {
        setDiscountType(e.target.value)
    }
    const handleDiscount = (e) => {
        const value = e.target.value;
        let errorMessage = '';

        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (numericValue < 1 || numericValue > 100) {
                errorMessage = 'Percentage must be between 1 and 100.';
            }
        } else if (discountType === 'fixed' && !numberRegex.test(value)) {
            errorMessage = 'Discount must be a valid number.';
        }

        if (errorMessage) {
            setError(errorMessage);
        } else {
            setDiscount(value);
            setError('');
        }
    };

    const handleAmountChange = (type, value) => {
        const numericValue = Number(value);
        const totalAmount = Object.keys(amounts).reduce((acc, key) => acc + (Number(amounts[key]) || 0), 0);
        const newTotalAmount = totalAmount - (Number(amounts[type]) || 0) + numericValue;
        const saleTotal = Number(calculateTotal());
    
        if (newTotalAmount > saleTotal) {
            toast.error('Total amount cannot exceed the total value of the sale.', { autoClose: 2000 }, { className: "custom-toast" });
            return;
        }
    
        setAmounts((prev) => ({
            ...prev,
            [type]: value,
        }));
    };

    const handleCheckboxChange = (type) => {
        setPaymentType(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
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
    const handleShipping = (e) => {
        setShipping(e.target.value)
    }

    useEffect(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const user = decryptData(encryptedUser);
                setDecryptedUser(user);
            } catch (error) {
                sessionStorage.removeItem('user');
                alert('Session data corrupted. Please log in again.');
                return;
            }
        } else {
            console.error('User data could not be retrieved');
            alert('Could not retrieve user data. Please log in again.');
        }
    }, []);

    useEffect(() => {
        const fetchSettings = () => {
            if (!decryptedUser) {
                console.error('No decrypted user data available');
                return;
            }
            const preFix = decryptedUser.prefixes?.[0].salePrefix;
            if (!preFix) {
                console.error('No receipt settings available');
                setError('Receipt settings not found');
                return;
            }
            console.log('Fetched data:', preFix);
            setPreFix(preFix)
        };

        fetchSettings();
    }, [decryptedUser]);

    const handlePrintAndClose = () => {
    // Reset all relevant state
    setWarehouse('');
    setSearchTerm('');
    setSearchCustomer('');
    setFilteredCustomer([]);
    setSelectedCustomer([]);
    setFilteredProducts([]);
    setSelectedProduct([]);
    setDiscount('');
    setShipping('');
    setTax('');
    setOrderStatus('');
    setPaymentStatus('');
    setDiscountType('');
    setAmounts({ cash: '', card: '', bank_transfer: '' });
    setPaymentType({ cash: false, card: false, bank_transfer: false });
    setError('');
    setResponseMessage('');
    setBalance(0);
    setShouldPrint(false);
    setInvoiceNumber(null);
    setInvoiceData([]);

    // Redirect to sale view page
    navigate('/viewSale');
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh]  p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='mt-20 flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Sale</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewSale'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-20">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1"> {/* Use flex-1 to allow the field to take full width */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    value={warehouse}
                                    onChange={(e) => handleWarehouseChange(e, setWarehouse, fetchProductDataByWarehouse, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select a warehouse</option>
                                    {warehouseData.map((wh) => (
                                        <option key={wh.name} value={wh.name}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* customer */}
                            <div className="flex-1 relative"> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={searchCustomer}
                                    required
                                    onChange={(e) => handleCustomerSearch(e, setSearchCustomer, setFilteredCustomer)}
                                    placeholder={"        Search..."}
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                                />
                                {filteredCustomer.length > 0 && (
                                    <ul className="absolute z-10 mt-1 w-[344px] text-left bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredCustomer.map((customer) => (
                                            <li
                                                key={customer._id}
                                                onClick={() => handleCustomerSelect(customer, setSelectedCustomer, setSearchCustomer, setFilteredCustomer)}
                                                className="cursor-pointer hover:bg-gray-100 px-4 py-4"
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
                        <input
                            id="text"
                            name="text"
                            type="text"
                            required
                            value={searchTerm}
                            onChange={(e) => handleProductSearch(e, setSearchTerm, setFilteredProducts, warehouse)}
                            placeholder={searchTerm ? "" : "        Search..."}
                            className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${!warehouse ? "bg-gray-200 cursor-not-allowed opacity-50" : ""
                                }`}
                            disabled={!warehouse}
                        />

                        {filteredProducts.length > 0 && (
                            <ul className="absolute left-0 z-10 w-full  text-left bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                {filteredProducts.map((product) => (
                                    <li
                                        key={product._id}
                                        onClick={() => handleProductSelect(product, setSelectedProduct, setSearchTerm, setFilteredProducts)}
                                        className="cursor-pointer hover:bg-gray-100 px-4 py-4"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
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

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm "><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.productQty || getQty(product, product.selectedVariation)}</p></td>

                                            <td className="px-6 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, -1)} // Decrement
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='increase' />
                                                    </button>
                                                    {/* Input Field */}
                                                    <input
                                                        type="number"
                                                        value={product.ptype === "Variation"
                                                            ? product.variationValues[product.selectedVariation]?.barcodeQty || 1
                                                            : product.barcodeQty || 1
                                                        }
                                                        onChange={(e) =>
                                                            handleQtyChange(index, product.selectedVariation, setSelectedProduct, e.target.value)
                                                        }
                                                        className="mx-2 w-16 py-[6px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                    />

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
                                                {currency}  {getPriceRange(product, product.selectedVariation)}
                                            </td>

                                            {/* Display Product Tax */}
                                            <td className="px-6 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
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
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!value) {
                                            alert("Please select a discount type.");
                                        }
                                        handleDiscountType(e);
                                    }}
                                    value={discountType}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option value="">Discount type</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount:</label>
                                <input
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!/^\d*\.?\d*$/.test(value)) {
                                            alert("Only numbers are allowed for discount.");
                                            return;
                                        }
                                        handleDiscount({ target: { value } });
                                    }}
                                    value={discount}
                                    type="text"
                                    placeholder="Discount"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {discountSymbole}
                                </span>
                            </div>
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Tax:</label>
                                <input
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!/^\d*\.?\d*$/.test(value)) {
                                            alert("Only numbers are allowed for tax.");
                                            return;
                                        }
                                        handleTax({ target: { value } });
                                    }}
                                    value={tax}
                                    type="text"
                                    placeholder="Tax"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    %
                                </span>
                            </div>
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Shipping:</label>
                                <input
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!/^\d*\.?\d*$/.test(value)) {
                                            alert("Only numbers are allowed for shipping.");
                                            return;
                                        }
                                        handleShipping({ target: { value } });
                                    }}
                                    value={shipping}
                                    type="text"
                                    placeholder="Shipping"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {currency}
                                </span>
                            </div>
                        </div>

                        {/* Order, Payment Status, and Payment Type Selects */}
                        <div className="flex justify-between gap-4 mt-10">
                            <div className='w-1/2'>
                                <label className="text-left block text-sm font-medium text-gray-700">Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Order Status</option>
                                    <option value="ordered">Ordered</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            {/* Payment Status Select */}
                            <div className='w-1/2 text-right'>
                                <label className="text-left block text-sm font-medium text-gray-700">Payment Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Payment Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                        </div>

                        {/* Payment Type Select */}
                        <div className="mt-10 mb-14 w-full">
                            <div>
                                <label className="text-left block text-sm font-medium text-gray-700">
                                    Payment Type: <span className='text-red-500'>*</span>
                                </label>
                                <div className="mt-4 flex gap-10 w-full">
                                    {Object.keys(paymentType).map((type) => (
                                        <div key={type} className="flex items-center space-x-2 relative">
                                            <input
                                                type="checkbox"
                                                id={type}
                                                checked={paymentType[type]}
                                                onChange={() => handleCheckboxChange(type)}
                                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor={type} className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</label>
                                            {paymentType[type] && (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={amounts[type]}
                                                        onChange={(e) => handleAmountChange(type, e.target.value)}
                                                        placeholder="Enter amount"
                                                        className="block w-44 rounded-md border-0 pl-4 py-2.5 pr-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-xs text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                                    />
                                                    <span className="absolute inset-y-0 right-2 flex items-center text-gray-500">
                                                        {currency}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Balance: {currency} {formatWithCustomCommas(calculateBalance())}
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Total: {currency}  {formatWithCustomCommas(calculateTotal())}
                    </div>

                    <div className="mt-4 text-right text-lg font-semibold">
                        Profit: {currency}  {formatWithCustomCommas(calculateProfitOfSale())}
                    </div>

                    <div className="container mx-auto text-left">
                        <div className='mt-10 flex justify-start'>
                            <button onClick={() => handleSave(
                                calculateTotal().toFixed(2),
                                calculateProfitOfSale().toFixed(2),
                                orderStatus,
                                paymentStatus,
                                paymentType,
                                amounts,
                                shipping,
                                discountType,
                                discount,
                                tax,
                                warehouse,
                                selectedCustomer?.name,
                                selectedProduct,
                                date,
                                preFix,
                                '0',
                                setInvoiceNumber,
                                setResponseMessage,
                                setError,
                                setProgress,
                                setInvoiceData,
                                note,
                                balance,
                                handlePrintAndClose,
                                shouldPrint
                            )} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
                                Save sale
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
export default CreateSaleBody;
