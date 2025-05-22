import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleUpdatePurchaseReturn, handleProductSelect } from '../PurchaseController'
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import Decrease from '../../../img/down-arrow (1).png'
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useCurrency } from '../../../context/CurrencyContext';

function EditPurchaseReturnBody() {
    // State management
    const { currency } = useCurrency()
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [saleReturnPayingData, setSaleReturnPayingData] = useState([])
    const [saleReturnData, setSaleReturnData] = useState([]);
    const [note, setNote] = useState('');
    const [reason, setReason] = useState('');
    const [progress, setProgress] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const findSaleById = async () => {
            setProgress(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findPurchaseReturnById/${id}`);
                const fetchedProductsQty = response.data.productsData || [];
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0]
                }));
                const existingNote = response.data.note || '';
                if (existingNote === "Damaged" || existingNote === "Expired") {
                    setReason(existingNote);
                    setNote('');
                } else if (existingNote) {
                    setReason("Other");
                    setNote(existingNote);
                }
                setSaleReturnData(initializedProductsQty);
                setSaleReturnPayingData(response.data);
                setProgress(false);
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
                setError('Error fetching sale return');
                setProgress(false);
            }
        };
        if (id) {
            findSaleById();
        }
    }, [id]);

    useEffect(() => {
        if (saleReturnPayingData?.note) {
            const backendNote = saleReturnPayingData.note;
            if (backendNote === "Damaged" || backendNote === "Expired") {
                setReason(backendNote);
                setNote("");
            } else {
                setReason("Other");
                setNote(backendNote);
            }
        }
    }, [saleReturnPayingData]);

    const calculateTotal = () => {
        const subtotal = saleReturnData.reduce((acc, product, index) => {
            const productQty = saleReturnData[index]?.quantity || 1;
            const productTaxRate = saleReturnData[index]?.taxRate / 100 || 0;
            const productSubtotal = (product.price * productQty) + (product.price * productQty * productTaxRate);
            return acc + productSubtotal;
        }, 0);
        const total = (subtotal) ;
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

    const handleQtyChange = (index, delta) => {
        setSaleReturnData(prev => {
            const currentQty = prev[index]?.quantity || 1; 
            let newQty = currentQty + delta; 

            const stockQty = prev[index]?.stockQty || 0;
            newQty = Math.max(1, Math.min(newQty, stockQty));

            const productPrice = prev[index]?.price || 0;
            const productTaxRate = prev[index]?.taxRate || 0; 
            const newSubtotal = (productPrice * newQty) + (productPrice * newQty * (productTaxRate / 100));

            const updatedSaleReturnData = prev.map((item, i) =>
                i === index
                    ? { ...item, quantity: newQty, subtotal: newSubtotal.toFixed(2) }
                    : item
            );
            return updatedSaleReturnData; 
        });
    };

    // This function handles the manual input field for quantity
    const handleQtyInputChange = (index, value) => {
        setSaleReturnData(prev => {
            const parsedValue = parseInt(value, 10) || 1;
            const stockQty = prev[index]?.stokeQty || 0;
            const newQty = Math.max(1, Math.min(parsedValue, stockQty));

            // Calculate the new subtotal based on quantity and price
            const productPrice = prev[index]?.price || 0;
            const productTaxRate = prev[index]?.taxRate || 0; 
            const newSubtotal = (productPrice * newQty) + (productPrice * newQty * (productTaxRate / 100));

            // Create a new state with updated quantity and subtotal
            const updatedSaleReturnData = prev.map((item, i) =>
                i === index
                    ? { ...item, quantity: newQty, subtotal: newSubtotal.toFixed(2) }
                    : item
            );
            return updatedSaleReturnData;
        });
    };

    const handleReasonChange = (e) => {
        const selectedReason = e.target.value;
        setReason(selectedReason);
        if (selectedReason !== 'Other') setNote('');
    };

    const getFinalNote = () => {
        return reason === 'Other' ? note : reason;
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
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Edit Purchase Return</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewPurchaseReturns'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-14">
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
                                    disabled
                                    required
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* customer */}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Supplier <span className='text-red-500'>*</span></label>
                                <input
                                    id="supplier"
                                    name="supplier"
                                    value={saleReturnPayingData.supplier}
                                    disabled
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
                                        className="cursor-pointer hover:bg-gray-100 px-4 py-4"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {saleReturnData.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.stockQty}</p>
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    {/* Decrement Button */}
                                                    <button
                                                        onClick={() => handleQtyChange(index, -1)} // Decrement
                                                        disabled={saleReturnData[index]?.quantity <= 1} // Disable if quantity <= 1
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='decrease' />
                                                    </button>

                                                    {/* Input field for quantity */}
                                                    <input
                                                        type="number"
                                                        value={saleReturnData[index]?.quantity || 1} // Use the current quantity
                                                        onChange={(e) => handleQtyInputChange(index, e.target.value)} // Handle user input
                                                        className="mx-2 w-16 py-[6px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                        max={saleReturnData[index]?.stokeQty || 1} // Max quantity is the stock quantity
                                                    />

                                                    {/* Increment Button */}
                                                    <button
                                                        onClick={() => handleQtyChange(index, 1)} // Increment
                                                        disabled={saleReturnData[index]?.quantity >= saleReturnData[index]?.stokeQty} // Disable if quantity >= stockQty
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='increase' />
                                                    </button>
                                                </div>
                                            </td>


                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {product.price}
                                            </td>

                                            {/* Product Tax */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.taxRate} %  {/* Show a default if no tax is available */}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.variationValue}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency}  {formatWithCustomCommas(product.subtotal)}
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
                    <div className="mt-8 text-right text-lg font-semibold">
                        Total:  {currency}  {formatWithCustomCommas(calculateTotal())}
                    </div>

                    <button
                        onClick={() => handleUpdatePurchaseReturn(id, calculateTotal(), saleReturnPayingData.paidAmount, saleReturnPayingData.warehouse, saleReturnPayingData.supplier, saleReturnData, selectedDate, getFinalNote(), setError, setResponseMessage, setProgress, navigate)}
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
export default EditPurchaseReturnBody;
