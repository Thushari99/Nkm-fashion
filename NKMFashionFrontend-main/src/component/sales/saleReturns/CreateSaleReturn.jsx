import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleReturnSale } from '../SaleController'
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Decrease from '../../../img/down-arrow (1).png';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';

function CreateSaleReturnBody() {
    // State management
    const { currency } = useCurrency()
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [saleProduct, setSaleProduct] = useState([]);
    const [restockingStatus, setRestocking] = useState(true);
    const [purchasedQty, setPurchasedQty] = useState([])
    const [progress, setProgress] = useState(false);
    const [note, setNote] = useState('');
    const [returnQty, setReturnQty] = useState([]);
    const [reason, setReason] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (purchasedQty.length > 0) {
            setSelectedProduct(prevSelectedProduct =>
                prevSelectedProduct.map((product, index) => {
                    const purchasedProduct = purchasedQty[index]; // Matching purchased product
                    if (purchasedProduct) {
                        return {
                            ...product,
                            taxRate: purchasedProduct.taxRate || 0 // Set the taxRate from purchasedQty or default 0
                        };
                    }

                    return product; // Return the product as is if no match
                })
            );
        }
    }, [purchasedQty]);

    useEffect(() => {
        const findSaleById = async () => {
            try {
                setProgress(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchSales`, { params: { id } });

                if (!response.data) {
                    console.warn('No data found for the given sale ID.');
                    return;
                }
                const sale = response.data; // Sale object with updated productsData
                const baseProductData = Array.isArray(sale.productsData) ? sale.productsData : []; // Ensure it's an array

                const initializedProducts = baseProductData.map(product => {
                    const price = parseFloat(product.price) || 0;
                    const quantity = parseInt(product.quantity, 10) || 1;
                    const taxRate = parseFloat(product.taxRate) || 0;
                    const discount = parseFloat(product.discount) || 0;
                    const discountedPrice = price - discount;

                    const subtotal = discountedPrice * quantity * (1 + taxRate); // Calculate subtotal including tax

                    return {
                        ...product,
                        selectedVariation: product.variationValue || "No Variation",  // Handle null values
                        stockQty: product.stockQty || "0",  // Ensure stockQty is correctly set
                        taxRate,
                        subtotal,  // Set calculated subtotal
                        restocking: true,
                    };
                });
                setSelectedProduct(initializedProducts);
                setPurchasedQty(baseProductData);
                setSaleProduct(sale);
                setRestocking(new Array(initializedProducts.length).fill(true));
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
            } finally {
                setProgress(false);
            }
        };
        if (id) {
            findSaleById();
        }
    }, [id]);

    useEffect(() => {
    }, [selectedProduct]);

    const handleQtyChange = (index, purchasedQuantity, qtyChange) => {
        const updatedProducts = [...selectedProduct];
        const updatedReturnQty = [...returnQty];
        const currentQty = updatedReturnQty[index] || 0;
        const newQty = currentQty + qtyChange;

        if (newQty < 0) {
            alert('Return quantity cannot be less than 1!');
            return;
        }

        if (newQty > purchasedQuantity) {
            alert('Return quantity cannot exceed purchased quantity!');
            return;
        }

        updatedReturnQty[index] = newQty;
        updatedProducts[index] = {
            ...updatedProducts[index],
            returnQty: newQty,
        };

        setReturnQty(updatedReturnQty);
        setSelectedProduct(updatedProducts);
    };

    const calculateReturnAmount = () => {
        const productReturnTotal = selectedProduct.reduce((ReturnTotal, product) => {
            const productPrice = product.price;
            const taxRate = product.taxRate;
            const productQty = product.returnQty || 0;
            const discount = product.discount;
            const discountedPrice = productPrice - discount;
            const ReturningSubTotal = (discountedPrice * productQty) + ( discountedPrice * productQty * taxRate);
            return ReturnTotal + ReturningSubTotal;
        }, 0);

        return productReturnTotal;
    };

    const handleCheckboxChange = (index) => {
        const restocking = [...restockingStatus];
        restocking[index] = !restocking[index];
        setRestocking(restocking);

        // Update the product state with the checkbox value
        const updatedProduct = [...selectedProduct];
        updatedProduct[index] = {
            ...updatedProduct[index],
            restocking: restocking[index]
        };
        setRestocking(restocking);
        setSelectedProduct(updatedProduct);
    };

    const handleReasonChange = (e) => {
        const selectedReason = e.target.value;
        setReason(selectedReason);
        if (selectedReason !== 'Other') {
            setNote(selectedReason);
        } else {
            setNote('');
        }
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
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Create Sale Return</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/ViewSale'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-10">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5">
                            {/* warehouse*/}
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <input
                                    id="warehouse"
                                    name="warehouse"
                                    value={saleProduct.warehouse}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                </input>
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* customer */}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={saleProduct.customer}
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
                                    type="text"
                                    required
                                    disabled
                                    value={saleProduct.date ? format(new Date(saleProduct.date), 'yyyy-MM-dd') : ''}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        {selectedProduct.length > 0 && (
                            <table className="mt-10 min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Re-stocking</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProduct.map((product, index) => (
                                        <tr key={index}>
                                            {/* Product Name from selectedProduct */}
                                            <td className="px-4 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                {product.name || 'Unknown Product'}
                                            </td>

                                            {/* Product Quantity */}
                                            <td className="px-4 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <span className="mx-2">{product.quantity || 1}</span>
                                                </div>
                                            </td>

                                            {/* Return Quantity */}
                                            <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    {/* Decrement Button */}
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.quantity, -1)} // Decrement by 1
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className="w-[16px] h-[16px]" src={Decrease} alt="decrease" />
                                                    </button>

                                                    <input
                                                        type="number"
                                                        value={returnQty[index] || ''}
                                                        onChange={(e) => {
                                                            const newQty = parseInt(e.target.value, 10);
                                                            handleQtyChange(index, product.quantity, newQty - (returnQty[index] || 0));
                                                        }}
                                                        className="mx-2 w-16 py-[5.5px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                    />

                                                    {/* Increment Button */}
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.quantity, 1)} // Increment by 1
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.price)}
                                            </td>

                                            {/* Display Product Tax */}
                                            <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {(product.taxRate) * 100} %
                                            </td>

                                             {/* Display Product Tax */}
                                             <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {formatWithCustomCommas(product.discount)} 
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.subtotal)}
                                            </td>

                                            {/* Variation Dropdown */}
                                            <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <span className="block w-full py-2 border-gray-300 rounded-md shadow-sm">
                                                    {product.variationValue || "No Variations"}
                                                </span>
                                            </td>

                                            {/*Qty restcoking  */}
                                            <td className="px-4 py-4 text-center whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 text-gray-600 transition duration-150 ease-in-out"
                                                    checked={restockingStatus[index] ?? true}
                                                    onChange={() => handleCheckboxChange(index)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="">
                        <div className="grid grid-cols-1 gap-4 mt-10">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">
                                    Reason: <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={reason}
                                    onChange={handleReasonChange}
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {reason === 'Other' && (
                                <div className="relative mt-4 ">
                                    <label className="block text-left text-sm font-medium text-gray-700">
                                        Reason: <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={note}
                                        type="text"
                                        placeholder="Add a reason for the return"
                                        className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 max-h-28 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm"
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='mt-5'>
                        <div className="mt-4 text-right text-lg font-semibold">
                            Total  :  {currency} {formatWithCustomCommas(saleProduct.grandTotal)}
                        </div>
                        <div className="mt-4 text-right text-lg font-semibold">
                            Paid Amount  :  {currency} {formatWithCustomCommas(saleProduct.paidAmount)}
                        </div>
                        <div className="mt-4 text-right text-lg font-semibold">
                            Return  Amount  :  {currency} {formatWithCustomCommas(calculateReturnAmount())}
                        </div>
                    </div>

                    <button onClick={() => handleReturnSale(id,
                        saleProduct.grandTotal, saleProduct.paidAmount, calculateReturnAmount(),  saleProduct.warehouse, saleProduct.customer, selectedProduct, saleProduct.date, note, setError, setResponseMessage, setProgress, navigate)} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
                        Return The Sale
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
export default CreateSaleReturnBody;
