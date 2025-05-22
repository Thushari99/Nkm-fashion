import React, { useState, useEffect} from 'react';
import axios from 'axios';
import '../../../styles/role.css';
import '../../../styles/login.css'
import { handleProductSelect, handleProductSearch, handleCustomerSearch, handleCustomerSelect, handleWarehouseChange, handleVariationChange,getProductCost, getDiscount, getQty, getPriceRange, handleDelete, handleQtyChange, getTax, handleSave } from '../SaleController'
import { Link, useHistory, useNavigate } from 'react-router-dom';
import Decrease from '../../../img/down-arrow (1).png';
import { decryptData } from '../../utill/encryptionUtils';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useCurrency } from '../../../context/CurrencyContext';
import { fetchAllData } from '../../pos/utils/fetchAllData';
import { fetchProductDataByWarehouse } from '../../pos/utils/fetchByWarehose';
import { toast } from 'react-toastify';

function CreateStaffRefreshmentsModal({ open, setOpen }) {
    const { currency } = useCurrency()
        const [warehouseData, setWarehouseData] = useState([]);
        const [warehouse, setWarehouse] = useState('');
        const [searchTerm, setSearchTerm] = useState('');
        const [filteredProducts, setFilteredProducts] = useState([]);
        const [selectedProduct, setSelectedProduct] = useState([]);
        const [date, setDate] = useState('')
        const [productData, setProductData] = useState([]);
        const [loading, setLoading] = useState(false);
        const [progress, setProgress] = useState(false);
        const [error, setError] = useState('');
        const [responseMessage, setResponseMessage] = useState('');
        const numberRegex = /^[0-9]*(\.[0-9]+)?$/;
        const [decryptedUser, setDecryptedUser] = useState(null);
        const navigate = useNavigate();
    const [formData, setFormData] = useState({
        productName: '',
        price: '',
        quantity: '',
    });

        useEffect(() => {
        fetchAllData(
            setProductData,
            setSelectedCategoryProducts,
            setSelectedBrandProducts,
            setSearchedProductData,
            setLoading,
            setError
        );
    }, []);

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
        // Retrieve the default warehouse from session storage
        const defaultWarehouse = sessionStorage.getItem('defaultWarehouse');

        if (defaultWarehouse) {
            setWarehouse(defaultWarehouse);  // Set the default warehouse
        }
    }, []);

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
    
    useEffect(() => {
        // Set the default value to today's date in 'YYYY-MM-DD' format
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setDate(formattedDate);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIssuedQtyChange = (index, value, setSelectedProduct) => {
        const updatedProducts = [...selectedProduct];
        updatedProducts[index].issuedQty = value === '' ? '' : parseInt(value, 10) || 0;  // Handle empty string input as well
        setSelectedProduct(updatedProducts);
    };
    
    const handleReturnQtyChange = (index, value, setSelectedProduct) => {
        const updatedProducts = [...selectedProduct];
        updatedProducts[index].returnQty = value === '' ? '' : parseInt(value, 10) || 0;  // Handle empty string input as well
        setSelectedProduct(updatedProducts);
    };
    

    if (!open) return null; 

    const calculateTotal = (product = null) => {
        // If a specific product is provided, calculate its subtotal
        if (product) {
            const productCost = product.selectedVariation 
                ? product.variationValues[product.selectedVariation]?.productCost || 0 
                : product.productCost || 0;
    
            const issuedQty = product.issuedQty || 0;
            const returnQty = product.returnQty || 0;
            const netQty = issuedQty - returnQty;
    
            return netQty * productCost;
        }
    
        // If no product is provided, calculate the grand total by summing all product totals
        return selectedProduct.reduce((total, product) => {
            return total + calculateTotal(product);  // Recursively calculate total for each product
        }, 0);
    };
    
    
    const handleSubmit = async (
        totalAmount,
        warehouse,
        products,
        date,
        setResponseMessage,
        setError
    ) => {
        try {
            console.log("🟢 Initial products value:", products); // Check initial products value
    
            // Validate selectedProduct structure before sending
            console.log('Selected products before submitting:', selectedProduct);
    
            // ✅ Ensure products is an array
            if (typeof products === "string") {
                try {
                    products = JSON.parse(products); // If it's a JSON string, parse it
                } catch (error) {
                    console.warn("⚠️ Products is a string but not valid JSON, splitting by commas.");
                    products = products.split(",").map((item) => item.trim()); // Otherwise, split by commas
                }
            }
    
            console.log("🔵 Processed products value:", products); // Check products after processing
    
            if (!Array.isArray(products)) {
                console.error("❌ Expected products to be an array but got:", typeof products);
                if (typeof setError === "function") {
                    setError("Invalid products data");
                }
                return;
            }
    
            // Prepare the products data in the correct format for the backend
            const saleData = {
                totalAmount,
                warehouse,
                products: selectedProduct.map((product) => {
                    // Calculate new stock quantity
                    const issuedQty = parseFloat(product.issuedQty) || 0;
                    const returnQty = parseFloat(product.returnQty) || 0;
                    const netQty = issuedQty - returnQty;
    
                    console.log(`🟠 Product ID: ${product._id} - issuedQty: ${issuedQty}, returnQty: ${returnQty}, netQty: ${netQty}`);
    
                    // Check if selectedVariation exists and fetch correct productQty
                    const productQty = product.selectedVariation 
                        ? product.variationValues?.[product.selectedVariation]?.productQty 
                        : product.productQty;
    
                    console.log(`🔵 Product ID: ${product._id} - productQty (before update): ${productQty}`);
    
                    const newStockQty = (productQty || 0) - netQty; // Use 0 if productQty is undefined or null
                    console.log(`🟢 Product ID: ${product._id} - newStockQty (after netQty adjustment): ${newStockQty}`);
    
                    // Ensure productQty matches the updated stock quantity
                    const updatedProductQty = newStockQty; // Set productQty equal to stockQty after calculation
                    console.log(`🔴 Product ID: ${product._id} - updatedProductQty (set to newStockQty): ${updatedProductQty}`);
    
                    return {
                        currentId: product._id,
                        name: product.name,
                        issuedQty: issuedQty || 0,
                        returnQty: returnQty || 0,
                        stockQty: newStockQty, // Updated stock quantity
                        productQty: updatedProductQty, // Set productQty to match stockQty
                        productCost: product.selectedVariation && product.variationValues?.[product.selectedVariation]?.productCost
                            ? product.variationValues[product.selectedVariation].productCost
                            : product.productCost || 0,
                        totalCost: calculateTotal(product),
                        variation: product.selectedVariation || null,
                        warehouseId: product.selectedWarehouseId || warehouse, // Ensure warehouseId is always present
                    };
                }),
                date,
            };
    
            console.log("🚀 Sending saleData to backend:", saleData); // Log final sale data
    
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/createStaffRefreshments`,  // Assuming correct endpoint
                saleData
            );
    
            console.log("✅ Backend response:", response.data); // Log response from backend
    
            if (response.data.success) {
                toast.success("Record Saved successfully!", { autoClose: 2000 });
                navigate('/staffRefreshments');
            } else {
                toast.success("Record Saved successfully!", { autoClose: 2000 });
                // window.location.href = '/staffRefreshments';
            }
        } catch (error) {
            console.error("❌ Error saving sale:", error);
            if (typeof setError === "function") {
                setError("An error occurred while saving the sale.");
            }
            setResponseMessage(""); // Clear response message
        }
    };
    
    
    
    if (!open) return null; // Prevent rendering when modal is closed

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-[95%] max-w-6xl relative shadow-lg mt-10 max-h-[90vh] overflow-y-auto z50">
                <button
                    className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                    onClick={() => setOpen(false)}
                >
                    ✖
                </button>
    
                <h2 className="text-2xl font-normal mb-4 text-center">Add New Record</h2>
    
                <div className="bg-white mt-4 w-full rounded-2xl px-10 shadow-md pb-10">
                    <form>
                        <div className="grid grid-cols-2 gap-5"> 
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
                            
                            {/* Date */}
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
                     <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Add Products <span className='text-red-500'>*</span></label>
                                            {/* Input Field */}
                                            <input
                                                id="text"
                                                name="text"
                                                type="text"
                                                required
                                                value={searchTerm}
                                                onChange={(e) => handleProductSearch(e, setSearchTerm, setFilteredProducts, warehouse)}
                                                placeholder={searchTerm ? "" : "        Search Product..."}
                                                className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                        {filteredProducts.length > 0 && (
                            <ul className="absolute left-0 z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
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
    
                   {/* Products Table */}
<div className="overflow-x-auto mt-10">
    {selectedProduct.length > 0 && (
        <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {['Name', 'Stock Qty', 'Issued Qty', 'Return Qty', 'Product Cost', 'Sub Total', 'Variation', 'Action'].map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {selectedProduct.map((product, index) => (
                    <tr key={index}>
                        <td className="px-6 py-4 text-gray-500">{product.name}</td>
                        <td className="px-6 py-4 text-center bg-green-100 text-green-500 rounded-md">{product.productQty || getQty(product, product.selectedVariation)}</td>

                        {/* Issued Qty */}
                        <td className="px-6 py-4">
    <div className="flex items-center justify-center space-x-2">
        <input
            type="number"
            value={product.issuedQty === '' ? '' : product.issuedQty || 0}
            onChange={(e) => handleIssuedQtyChange(index, e.target.value, setSelectedProduct)}
            className="w-16 text-center border rounded py-1"
            min="0"
            placeholder="0"
        />
    </div>
</td>

<td className="px-6 py-4">
    <div className="flex items-center justify-center space-x-2">
        <input
            type="number"
            value={product.returnQty === '' ? '' : product.returnQty || 0}
            onChange={(e) => handleReturnQtyChange(index, e.target.value, setSelectedProduct)}
            className="w-16 text-center border rounded py-1"
            min="0"
            placeholder="0"
        />
    </div>
</td>

                        {/* Product Cost (fixed value) */}
                        <td className="px-6 py-4 text-gray-500">
    {currency} {formatWithCustomCommas(product.selectedVariation ? product.variationValues[product.selectedVariation]?.productCost : product.productCost || 0)}
</td>
                        
                        {/* Sub Total */}
                        <td className="px-6 py-4 text-gray-500">{currency} {formatWithCustomCommas(calculateTotal(product))}</td>

                        {/* Variation */}
                        <td className="px-6 py-4">
                            {product.ptype === 'Variation' ? (
                                <select value={product.selectedVariation} onChange={(e) => handleVariationChange(index, e.target.value, setSelectedProduct)} className="w-full border py-2 border-gray-300 rounded-md shadow-sm">
                                    {Object.keys(product.variationValues).map((variationKey) => (
                                        <option key={variationKey} value={variationKey}>{variationKey}</option>
                                    ))}
                                </select>
                            ) : (
                                <span>No Variations</span>
                            )}
                        </td>

                        {/* Action - Delete */}
                        <td className="px-6 py-4 text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleDelete(index, selectedProduct, setSelectedProduct)}>🗑</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )}
</div>

    
                    <div className="mt-6 text-right text-lg font-semibold">
                        Grand Total: {currency} {formatWithCustomCommas(calculateTotal())}
                    </div>
    
                    <div className="mt-8 flex justify-start">
                        <button onClick={() => handleSubmit(calculateTotal().toFixed(2), warehouse, selectedProduct, date, setResponseMessage, setError)} className="submit text-white rounded py-4 px-6">Save Sale</button>
                    </div>
    
                    <div className="mt-5 text-center">
                        {error && <p className="text-red-600 bg-red-100 px-5 py-2 rounded-md inline-block">{error}</p>}
                        {responseMessage && <p className="text-green-600 bg-green-100 px-5 py-2 rounded-md inline-block">{responseMessage}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}    

export default CreateStaffRefreshmentsModal;
