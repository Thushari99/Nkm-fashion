import React, { useState, useEffect } from 'react';
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Decrease from '../../../img/down-arrow (1).png';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { handleReturnPurchaseToSupplier } from '../../purchase/PurchaseController';
import { toast } from 'react-toastify';

function CreateSaleReturnForSupplier() {
    // State management
    const { currency } = useCurrency()
    const [productsData, setProductsData] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [suplierData, setSuplierData] = useState([]);
    const [supplier, setSuplier] = useState("all");
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [purchasedQty, setPurchasedQty] = useState([])
    const [progress, setProgress] = useState(false);
    const [note, setNote] = useState('');
    const [returnQty, setReturnQty] = useState([]);
    const [warehouse, setWarehosue] = useState('Multiple +')
    const [reason, setReason] = useState('');
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const paidAmount = '0.00'
    const navigate = useNavigate();

    useEffect(() => {
        if (purchasedQty.length > 0) {
            setSelectedProduct(prevSelectedProduct =>
                prevSelectedProduct.map((product, index) => {
                    const purchasedProduct = purchasedQty[index];
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
    }, [purchasedQty]);

    useEffect(() => {
        setProgress(true);
        fetchData(
            `${process.env.REACT_APP_BASE_URL}/api/fetchSupplier`, setSuplierData, (data) => data.suppliers || []);
    }, []);

    const fetchData = async (url, setData, processFunction) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            setData(processFunction(data));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setProgress(true);
            await fetchData(
                `${process.env.REACT_APP_BASE_URL}/api/fetchReturnsProdutData/all`,
                setProductsData,
                (data) => data.productsData || []
            );
            setProgress(false);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (supplier !== "all") {
            setProgress(true);
            fetchData(
                `${process.env.REACT_APP_BASE_URL}/api/fetchReturnsProdutData/${supplier}`,
                setProductsData,
                (data) => data.productsData || []
            ).finally(() => setProgress(false));

            setSelectedProduct([]);
            setReturnQty([]);
        }
    }, [supplier]);

    useEffect(() => {
    }, [selectedProduct]);

    const handleQtyChange = (
        index, customerReturnedQty, qtyChange, productCost, variationValue, name, taxRate, currentID, ptype, warehouse, selectedProduct, setSelectedProduct, setReturnQty, returnQty
    ) => {
        const updatedProducts = [...selectedProduct];
        const updatedReturnQty = [...returnQty];
        const currentQty = updatedReturnQty[index] || 0;
        const newQty = currentQty + qtyChange;

        if (newQty < 0) {
            toast.error('Return quantity cannot be less than 1!', { autoClose: 2000 }, { className: "custom-toast" });
            return;
        }

        if (newQty > customerReturnedQty) {
            toast.error('Return quantity cannot exceed customer returned quantity', { autoClose: 2000 }, { className: "custom-toast" });
            return;
        }
        const subtotal = newQty * productCost;
        updatedReturnQty[index] = newQty;

        updatedProducts[index] = {
            ...updatedProducts[index],
            returnQty: newQty,
            productCost: productCost || 0,
            variationValue: variationValue || 'No variations',
            name: name || 'Unknown',
            taxRate: taxRate || 0,
            currentID: currentID || '',
            warehouse: warehouse,
            ptype: ptype || '',
            subtotal: subtotal,
        };

        setReturnQty(updatedReturnQty);
        setSelectedProduct(updatedProducts.filter(product => product.returnQty > 0));
    };

    const calculateTotal = () => {
        const subtotal = productsData.reduce((total, product, index) => {
            const qty = Number(returnQty[index] || 0);
            const productCost = product.productCost || 0;
            return total + Number((qty * productCost));
        }, 0);

        const total = subtotal;

        return {
            subtotal,
            total,
        };
    };
    const { subtotal, total } = calculateTotal();

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
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Send Sale Returns To Supplier</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/ViewSale'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-10">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5">
                            {/* customer */}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Supplier <span className='text-red-500'>*</span>
                                </label>
                                <div className="">
                                    <select
                                        id="supplier"
                                        name="supplier"
                                        required
                                        value={supplier}
                                        onChange={(e) => setSuplier(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    >
                                        <option value="all">Select a supplier</option>
                                        {suplierData.map((s) => (
                                            <option key={s.name} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                    value={currentDate}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2 px-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        {productsData.length > 0 && (
                            <table className="mt-10 min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Cost</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Customer Returned Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Send To Supplier</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productsData
                                        .filter(product => product.returnQty >= 1)
                                        .map((product, index) => (
                                            <tr key={index}>
                                                {/* Product Name from selectedProduct */}
                                                <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                    {product.name || 'Unknown Product'}
                                                </td>

                                                {/* Display Product Tax */}
                                                <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                    {product.variationValue || 'No variations'}
                                                </td>

                                                {/* Product Price */}
                                                <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                    {currency} {formatWithCustomCommas(product.productCost || 0)}
                                                </td>

                                                {/* Display Product Tax */}
                                                <td className="px-4 py-4 text-center whitespace-nowrap text-sm text-gray-500">
                                                    {product.returnQty || 0}
                                                </td>

                                                {/* Product Qty */}
                                                <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() => handleQtyChange(index, product.returnQty, -1, product.productCost, product.variationValue, product.name, product.taxRate, product.currentID, product.ptype, product.warehouse, selectedProduct, setSelectedProduct, setReturnQty, returnQty)}
                                                            className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                        >
                                                            <img className="w-[16px] h-[16px]" src={Decrease} alt="decrease" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={returnQty[index] || 0}
                                                            onChange={(e) => {
                                                                const newQty = parseInt(e.target.value, 10) || 0;
                                                                handleQtyChange(index, product.returnQty, newQty - (returnQty[index] || 0), product.productCost, product.variationValue, product.name, product.taxRate, product.currentID, product.ptype, product.warehouse, selectedProduct, setSelectedProduct, setReturnQty, returnQty);
                                                            }}
                                                            className="mx-2 w-16 py-[5.5px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                            min="0"
                                                        />
                                                        <button
                                                            onClick={() => handleQtyChange(index, product.returnQty, 1, product.productCost, product.variationValue, product.name, product.taxRate, product.currentID, product.ptype, product.warehouse, selectedProduct, setSelectedProduct, setReturnQty, returnQty)}
                                                            className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                        >
                                                            <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                    {currency} {formatWithCustomCommas((returnQty[index] || 0) * (product.productCost || 0))}
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

                    <div>
                        <div className="mt-8 text-right text-lg font-semibold">
                            Total:  {currency} {formatWithCustomCommas(total)}
                        </div>
                    </div>

                    <button
                        onClick={() => handleReturnPurchaseToSupplier(
                            total,
                            paidAmount,
                            supplier,
                            currentDate,
                            note,
                            selectedProduct,
                            warehouse,
                            setError,
                            setResponseMessage,
                            setProgress,
                            navigate
                        )}
                        className="mt-5 submit w-[300px] text-white rounded py-2 px-4"
                    >
                        Send Products To Supplier
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
                                <p className="text-color px-5 py-2 rounded-md  text-center mx-auto max-w-sm">
                                    {responseMessage}
                                </p>
                            )}
                        </div>
                        {/* Reserve empty space to maintain layout */}

                    </div>
                </div>
            </div>
        </div >
    );
}
export default CreateSaleReturnForSupplier;
