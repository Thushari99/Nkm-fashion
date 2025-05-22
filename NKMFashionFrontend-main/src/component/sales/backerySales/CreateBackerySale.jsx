import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleProductSelect, handleProductSearch, handleWarehouseChange, handleVariationChange, getProductCost, getDiscount, getQty, getPriceRange, handleDelete, handleQtyChange, getTax, handleSave } from '../SaleController'
import '../../../styles/role.css';
import { Link } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../../pos/utils/fetchByWarehose';
import Decrease from '../../../img/down-arrow (1).png';
import { decryptData } from '../../utill/encryptionUtils';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useCurrency } from '../../../context/CurrencyContext';

function CreateBackerySale() {
    // State management
    const { currency } = useCurrency()
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [date, setDate] = useState('')
    const [paidAmount, setPaidAmount] = useState(0);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [productBillingHandling, setSearchedProductData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [decryptedUser, setDecryptedUser] = useState(null);
    const [preFix, setPreFix] = useState('');

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


    const calculateTotal = () => {
        const productTotal = selectedProduct.reduce((total, product) => {
            const stockeQty = product.productQty || getQty(product, product.selectedVariation);
            const remainingQty = product.barcodeQty || 0;
            const soldOutQty = stockeQty - remainingQty;
            const productPrice = Number(getPriceRange(product, product.selectedVariation));
            const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
            const discount = Number(getDiscount(product, product.selectedVariation));
            const discountedPrice = productPrice - discount

            const subTotal = (discountedPrice * soldOutQty) + (discountedPrice * soldOutQty * taxRate);
            return total + subTotal;

        }, 0);
        const grandTotal = productTotal;
        return grandTotal;
    };

    const calculateProfitOfSale = () => {
        const profitTotal = selectedProduct.reduce((totalProfit, product) => {
            const productPrice = Number(getPriceRange(product, product.selectedVariation));
            const productCost = Number(getProductCost(product, product.selectedVariation));
            const stockeQty = product.productQty || getQty(product, product.selectedVariation);
            const remainingQty = product.barcodeQty || 0;
            const soldOutQty = stockeQty - remainingQty;
            const discount = Number(getDiscount(product, product.selectedVariation));
            const discountedPrice = productPrice - discount;

            const totalProductCost = (productCost * soldOutQty)
            const subTotal = (discountedPrice * soldOutQty);
            const profitOfProduct = subTotal - totalProductCost;
            return totalProfit + profitOfProduct;

        }, 0);

        const pureProfit = profitTotal;
        return pureProfit;
    };

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

    const handlePaidAmount = (e) => {
        setPaidAmount(e.target.value)
    }

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
                        <div className="flex w-full space-x-5">
                            {/* warehouse*/}
                            <div className="flex-1">
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

                            {/*Date*/}
                            <div className="flex-1 ">
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
                            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total (-Dis / +Tax)</th>
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
                                                            ? product.variationValues[product.selectedVariation]?.barcodeQty || 0
                                                            : product.barcodeQty || 0
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

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency}  {
                                                    (() => {
                                                        const stockeQty = product.productQty || getQty(product, product.selectedVariation);
                                                        const remainingQty = product.variationValues?.[product.selectedVariation]?.barcodeQty || product.barcodeQty || 1;
                                                        const soldOutQty = stockeQty - remainingQty;
                                                        const price = getPriceRange(product, product.selectedVariation);
                                                        const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
                                                        const discount = getDiscount(product, product.selectedVariation);
                                                        const discountedPrice = price - discount

                                                        const subtotal = (discountedPrice * soldOutQty) + (discountedPrice * soldOutQty * taxRate);
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

                    <div className='flex justify-between'>
                        <div className="relative mt-10 w-full mr-5">
                            <label className="block text-left text-sm font-medium text-gray-700">Received Amount:</label>
                            <input
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (!/^\d*\.?\d*$/.test(value)) {
                                        alert("Only numbers are allowed for shipping.");
                                        return;
                                    }
                                    handlePaidAmount({ target: { value } });
                                }}
                                value={paidAmount}
                                type="text"
                                placeholder="Received Amount"
                                className="block w-full  rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                {currency}
                            </span>
                        </div>

                        <div className="relative mt-10  w-full mr-5">
                            <label className="block text-left text-sm font-medium text-gray-700">Total Amount:</label>
                            <input
                               value={formatWithCustomCommas(calculateTotal())}
                                type="text"
                                placeholder="Total Amount"
                                readOnly
                                className="block w-full  rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                {currency}
                            </span>
                        </div>

                        <div className="relative mt-10  w-full">
                            <label className="block text-left text-sm font-medium text-gray-700">Net Profit</label>
                            <input
                                value={formatWithCustomCommas(calculateProfitOfSale())}
                                type="text"
                                readOnly
                                placeholder="Net Profit"
                                className="block w-full  rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                {currency}
                            </span>
                        </div>
                    </div>

                    <div className="container mx-auto text-left">
                        <div className='mt-10 flex justify-start'>
                            <button onClick={() => handleSave(
                                calculateTotal().toFixed(2), calculateProfitOfSale().toFixed(2), paidAmount, warehouse, selectedProduct, date, preFix, setResponseMessage, setError, setProgress)} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
                                Save sale
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error and Response Messages */}
                <div className="mt-5">
                    <div className="relative">
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
                        <div className="h-[50px]"></div>
                    </div>
                </div>
            </div>
        </div >
    );
}
export default CreateBackerySale;
