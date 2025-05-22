import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleReturnPurchase } from '../PurchaseController'
import '../../../styles/role.css';
import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';

function CreatePurchaseReturnBody() {
    // State managemen
    const { currency } = useCurrency()
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [saleProduct, setSaleProduct] = useState([])
    const [progress, setProgress] = useState(false);
    const [note, setNote] = useState('');
    const [reason, setReason] = useState('');
    const [saleReturProductData, setPurchaseReturProductData] = useState([])
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (saleReturProductData.length > 0) {
            // Update selectedProduct based on the tax information in purchasedQty
            setSelectedProduct(prevSelectedProduct =>
                prevSelectedProduct.map((product, index) => {
                    const purchasedProduct = saleReturProductData[index]; 
                    if (purchasedProduct) {
                        return {
                            ...product,
                            taxRate: purchasedProduct.taxRate || 0 
                        };
                    }
                    return product; 
                })
            );
        }
    }, [saleReturProductData])

    useEffect(() => {
        const findSaleById = async () => {
            setProgress(true)
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findPurchaseById/${id}`);
                const baseProductData = response.data.productsDetails || [];
                const fetchedProductsQty = response.data.productsData || [];

                const initializedProducts = baseProductData.map(product => ({
                    ...product,
                    selectedVariation: product.selectedVariation || Object.keys(product.variationValues)[0]
                }));
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0]
                }));
                setPurchaseReturProductData(initializedProductsQty);
                setSelectedProduct(initializedProducts);
                setSaleProduct(response.data);
                setProgress(false)
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
            }
        };

        if (id) {
            findSaleById();
        }
    }, [id]);
   
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
            <div className='flex justify-between items-center mt-20'>
                <div>
                    <h2 className="text-lightgray-300 ml-4 m-0 p-0 text-2xl">Create Sale</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewCustomers'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[50px] w-full rounded-2xl px-8 shadow-md pb-14">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5">
                            {/* warehouse*/}
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    value={saleProduct.warehouse}
                                    disabled
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">{saleProduct.warehouse}</option>
                                </select>
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* customer */}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Suplier <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={saleProduct.supplier}
                                    required
                                    disabled
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>

                            {/*Date*/}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                <input
                                    id="text"
                                    name="text"
                                    type="text"
                                    required
                                    disabled
                                    value={new Date(saleProduct.date).toLocaleDateString()}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="mt-10 min-w-full bg-white border rounded-md border-gray-200">
                            <thead className="rounded-md bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                </tr>
                            </thead>
                            {saleReturProductData.length > 0 && (
                                <tbody>
                                    {saleReturProductData.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.stockQty}</p>
                                            </td>

                                            <td className="px-6 py-4  text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <span className="mx-2">
                                                        {saleReturProductData[index]?.quantity || 1} {/* Display the current quantity */}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.price)}
                                            </td>

                                            {/* Product Tax */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.taxRate * 100} %  {/* Show a default if no tax is available */}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
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

                    <div>
                        <div className="mt-8 text-right text-lg font-semibold">
                            Paid Amount  :  {currency} {formatWithCustomCommas(saleProduct.paidAmount)}
                        </div>
                        <div className="mt-4 text-right text-lg font-semibold">
                            Total  :  {currency} {formatWithCustomCommas(saleProduct.grandTotal)}
                        </div>
                    </div>

                    <button onClick={() => handleReturnPurchase(
                        saleProduct.grandTotal, saleProduct.paidAmount, note ,saleProduct.warehouse, saleProduct.supplier, saleReturProductData, saleProduct.date, saleProduct._id, setError, setResponseMessage, setProgress, navigate)} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
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
export default CreatePurchaseReturnBody;
