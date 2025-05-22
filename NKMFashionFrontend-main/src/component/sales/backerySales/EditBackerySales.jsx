import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleCustomerSelect, handleWarehouseChange, handleUpdateEndOfTheDaySale, handleProductSearch } from '../SaleController'
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../../pos/utils/fetchByWarehose';
import Decrease from '../../../img/down-arrow (1).png'
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useCurrency } from '../../../context/CurrencyContext';

function EditBackerySale() {
    // State management
    const { currency } = useCurrency()
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [filteredCustomer, setFilteredCustomer] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState([])
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [productBillingHandling, setSearchedProductData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [saleProduct, setSaleProduct] = useState([])
    const [saleReturProductData, setSaleReturProductData] = useState([])
    const [selectedDate, setSelectedDate] = useState('');
    const [total, setTotal] = useState(0);
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const findSaleById = async () => {
            try {
                setProgress(true);
                console.log("Fetching sale by ID:", id);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findSaleById/${id}`);
                console.log("Full API Response:", response);
                const fetchedProductsQty = response.data.productsData || [];
                console.log("Fetched Products Data:", fetchedProductsQty);
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0],
                    source: 'backend', // Mark this product as fetched from the backend
                }));
                setSaleReturProductData(initializedProductsQty);
                setSaleProduct(response.data);
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

    const fetchData = async (url, setter) => {
        setLoading(true);
        try {
            const { data } = await axios.get(url);
            setter(data);
        } catch (error) {
            console.error(`${url} fetch error:`, error);
            setter([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, setWarehouseData);
        return () => { };
    }, []);

    const getTax = (product, selectedVariation) => {
        if (product.variationValues && selectedVariation && product.variationValues[selectedVariation]) {
            const variationTax = Number(product.variationValues[selectedVariation].orderTax);
            return !isNaN(variationTax) ? variationTax : 0;
        }
        return 0;
    };

    const getPriceRange = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues) {
            if (selectedVariation && product.variationValues[selectedVariation]) {
                const variationPrice = Number(product.variationValues[selectedVariation].productPrice);
                return !isNaN(variationPrice) ? variationPrice : 'Price not available';
            }

            const prices = Object.values(product.variationValues)
                .map(variation => Number(variation.productPrice))
                .filter(price => !isNaN(price));

            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                return minPrice;
            }
        }

        const singlePrice = Number(product.price);
        return !isNaN(singlePrice) && singlePrice > 0 ? singlePrice : 'Price not available';
    };

    const getProductCost = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues) {
            if (selectedVariation && product.variationValues[selectedVariation]) {
                const variationPrice = Number(product.variationValues[selectedVariation].productCost);
                return !isNaN(variationPrice) ? variationPrice : 0;
            }
            const prices = Object.values(product.variationValues)
                .map(variation => Number(variation.productCost))
                .filter(price => !isNaN(price));

            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                return minPrice;
            }
        }
        const singlePrice = Number(product.productCost);
        return !isNaN(singlePrice) && singlePrice > 0 ? singlePrice : 0;
    };

    const getQty = (product, selectedVariation) => {
        if (product.variationValues && selectedVariation) {
            const variationQty = Number(product.variationValues[selectedVariation]?.productQty);
            return !isNaN(variationQty) && variationQty > 0 ? variationQty : 0;
        }
        const singleProductQty = Number(product.stockQty);
        return !isNaN(singleProductQty) && singleProductQty > 0 ? singleProductQty : 0;
    };

    const getDiscount = (product, selectedVariation) => {
        if (product.variationValues) {
            if (selectedVariation && product.variationValues[selectedVariation]) {
                const variationDiscount = Number(product.variationValues[selectedVariation].discount);
                return !isNaN(variationDiscount) ? variationDiscount : 0;
            }
            const discounts = Object.values(product.variationValues)
                .map(variation => Number(variation.discount))
                .filter(discount => !isNaN(discount));
            if (discounts.length > 0) {
                const minDiscount = Math.min(...discounts);
                return minDiscount;
            }
        }
        const singleDiscount = Number(product.discount);
        return !isNaN(singleDiscount) && singleDiscount > 0 ? singleDiscount : 0;
    };

    useEffect(() => {
        calculateTotal();
    }, [saleReturProductData]);
    
    const calculateTotal = () => {
        const newSubtotal = saleReturProductData.reduce((acc, product) => {
            const stockeQty = getQty(product, product.selectedVariation);
            const price = getPriceRange(product, product.selectedVariation);
            const remainingQty = product.quantity || 0;
            const soldOutQty = stockeQty - remainingQty;
            const taxRate = product.taxRate ? product.taxRate : getTax(product, product.selectedVariation) / 100;
            const discount = getDiscount(product, product.selectedVariation);
            const discountedPrice = price - discount;
            const productSubtotal = (discountedPrice * soldOutQty) * (1 + taxRate);
            return acc + productSubtotal;
        }, 0);
    
        setTotal(newSubtotal.toFixed(2)); 
    };
    
    const calculateProfitOfSale = () => {
        const profitTotal = saleReturProductData.reduce((totalProfit, product) => {
            const productPrice = Number(getPriceRange(product, product.selectedVariation));
            const productCost = Number(getProductCost(product, product.selectedVariation));
            const stockeQty = Number(getQty(product, product.selectedVariation));
            const remainingQty = product.quantity || 0;
            const soldOutQty = stockeQty - remainingQty;
            const discount = Number(getDiscount(product, product.selectedVariation));
            const discountedPrice = productPrice - discount;

            const totalProductCost = (productCost * soldOutQty);
            const subTotal = (discountedPrice * soldOutQty);
            const profitOfProduct = subTotal - totalProductCost;
            return totalProfit + profitOfProduct;

        }, 0);

        let discountValue = 0;
        if (discountType === 'fixed') {
            discountValue = Number(saleProduct.discount);
        } else if (discountType === 'percentage') {
            discountValue = (profitTotal * Number(saleProduct.discount)) / 100;
        }

        // Grand total = productTotal - discount + shipping + globalTax
        const pureProfit = profitTotal - discountValue;
        return pureProfit;
    };

    const handleQtyChange = (index, deltaOrValue, isDirectInput = false) => {
        setSaleReturProductData((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                let stockQty = item.productQty || 0;
                if (item.ptype === "Variation" && item.selectedVariation) {
                    const selectedVariation = item.variationValues?.[item.selectedVariation];
                    if (selectedVariation) {
                        stockQty = selectedVariation.productQty || 0;
                    }
                } else {
                    stockQty = item.stockQty || 0;
                }

                let newQty;
                if (isDirectInput) {
                    const parsedValue = parseInt(deltaOrValue, 10);
                    if (isNaN(parsedValue)) return item;
                    newQty = Math.max(1, Math.min(parsedValue, stockQty));
                } else {
                    newQty = Math.max(1, Math.min((item.quantity || 0) + deltaOrValue, stockQty));
                }

                const price = getPriceRange(item, item.selectedVariation);
                const soldOutQty = stockQty - newQty;
                const discount = getDiscount(item, item.selectedVariation);
                const discountedPrice = price - discount;
                const taxRate = item.taxRate ? item.taxRate : getTax(item, item.selectedVariation) / 100;
                const newSubtotal = (discountedPrice * soldOutQty) * (1 + taxRate);

                return {
                    ...item,
                    quantity: newQty,
                    subtotal: newSubtotal.toFixed(2),
                };
            })
        );
    };

    const handleVariationChange = (index, variation) => {
        setSaleReturProductData((prevProducts) =>
            prevProducts.map((product, i) => {
                if (i === index) {
                    const productWithSameVariation = prevProducts.find(
                        (p, j) => j !== index && p._id === product._id && p.selectedVariation === variation
                    );

                    if (productWithSameVariation) {
                        alert(`The variation "${variation}" is already added.`);
                        return product;
                    }
                    const selectedVariationDetails = product.variationValues[variation] || {};
                    const updatedPrice = selectedVariationDetails.productPrice || product.price;
                    const UpdatedProductCost = selectedVariationDetails.productCost || product.productCost;
                    const updatedTax = selectedVariationDetails.orderTax || product.orderTax;
                    const updatedQty = selectedVariationDetails.productQty || 1;
                    const adjustedQty = Math.min(product.quantity || 1, updatedQty);

                    if (adjustedQty < product.quantity) {
                        alert(`Purchase quantity adjusted to the available stock (${updatedQty}) for the "${variation}" variation.`);
                    }

                    const newSubtotal = (updatedPrice - getDiscount(product, variation)) * adjustedQty * (1 + (updatedTax / 100));

                    return {
                        ...product,
                        selectedVariation: variation,
                        productPrice: updatedPrice,
                        productCost: UpdatedProductCost,
                        orderTax: updatedTax,
                        productQty: updatedQty,
                        quantity: adjustedQty > 0 ? adjustedQty : 1,
                        subtotal: newSubtotal.toFixed(2),
                    };
                }
                return product;
            })
        );
    };

    useEffect(() => {
        if (saleProduct.date) {
            const formattedDate = new Date(saleProduct.date).toISOString().slice(0, 10);
            setSelectedDate(formattedDate);
        }
    }, [saleProduct.date]);
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    useEffect(() => {
        if (saleProduct && saleProduct.discountType) {
            setDiscountType(saleProduct.discountType);
            setSaleProduct((prevSaleProduct) => ({
                ...prevSaleProduct,
                discountType: saleProduct.discountType,
            }));
        }
    }, [saleProduct]);

    const handleProductSelect = (product) => {
        setSaleReturProductData((prevProducts) => {
            const isVariationProduct = product.ptype === 'Variation' && product.variationValues;
            const isSingleProduct = product.ptype === 'Single';
            const variationKeys = isVariationProduct ? Object.keys(product.variationValues) : [];
            const selectedVariation = isVariationProduct ? variationKeys[0] : null;

            // Check if the product already exists in the state
            const isDuplicate = prevProducts.some((p) => {
                if (isVariationProduct) {
                    // Check for duplicate variation products
                    return (
                        p.name === product.name && // Match by _id for variation products
                        p.ptype === 'Variation' && // Ensure the product type is 'Variation'
                        p.selectedVariation === selectedVariation // Match the selected variation
                    );
                } else if (isSingleProduct) {
                    // Check for duplicate single products by name and product type
                    return p.name === product.name && p.ptype === 'Single';
                }
                return false; // Default to no duplicates for unsupported types
            });

            if (isDuplicate) {
                const type = isVariationProduct
                    ? `Variation (${selectedVariation})`
                    : `Product (${product.name})`;
                alert(`${type} is already in the list.`);
                return prevProducts; // No changes to the list
            }

            let initialQuantity = 1; // Default quantity for selected product
            let stockQty = product.productQty || 0;

            // Create a new product object with defaults for variations or single products
            const newProduct = {
                ...product,
                selectedVariation: isVariationProduct ? selectedVariation : 'No variations', // Set default variation for single products
                barcodeFormat: product.barcode || '',
                quantity: 1,
                productPrice: getPriceRange(product, selectedVariation) || product.price || 0,
                taxRate: getTax(product, selectedVariation) / 100 || product.oderTax || 0,
                source: 'frontend', // Mark as a new product
            };

            // Append the new product to the previous list
            return [...prevProducts, newProduct];
        });

        // Clear search state
        setSearchTerm('');
        setFilteredProducts([]);
    };

    const handleDeleteExisting = async (saleID, productID) => {
        const total = calculateTotal();
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this item?");
            if (!confirmDelete) return;

            // Make the API call to delete the product from the backend
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteProductFromSale`, {
                params: { saleID, productID, total },
            });

            // Remove the product from the state immediately
            setSaleReturProductData(saleReturProductData.filter(product => product.currentID !== productID));

            if (response.status === 200) {
                toast.success('Sale deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            } else {
                alert("Failed to delete the item.");
                // If the deletion fails, re-add the product to the state
                setSaleReturProductData((prevProducts) => {
                    const deletedProduct = saleReturProductData.find(product => product._id === productID);
                    return [...prevProducts, deletedProduct];
                });
            }
        } catch (error) {
            console.error('Error deleting product from sale:', error);
            setSaleReturProductData((prevProducts) => {
                const deletedProduct = saleReturProductData.find(product => product._id === productID);
                return [...prevProducts, deletedProduct];
            });
            if (error.response) {
                console.error('Error details:', error.response.data);
                setError(error.response.data.message || 'An error occurred on the server');
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('No response received from server. Please try again later.');
            } else {
                console.error('Request setup error:', error.message);
                setError(error.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelectedProduct = (productId, setSaleReturProductData) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) {
            return;
        }
        setSaleReturProductData((prevProducts) => {
            return prevProducts.filter(product => product._id !== productId);
        });
        toast.success('Sale deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5 pb-10'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between mt-20 items-center'>
                <div>
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">End of the Day Sale Edit</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewSale'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-10">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1"> {/* Use flex-1 to allow the field to take full width */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <input
                                    id="warehouse"
                                    name="warehouse"
                                    value={saleProduct.warehouse}
                                    onChange={(e) =>
                                        handleWarehouseChange(
                                            e,
                                            setWarehouse,
                                            saleProduct.warehouse,
                                            fetchProductDataByWarehouse,
                                            setProductData,
                                            setSelectedCategoryProducts,
                                            setSelectedBrandProducts,
                                            setSearchedProductData,
                                            setLoading
                                        )
                                    }
                                    className="searchBox w-full pl-4 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>

                            <div>
                                {filteredCustomer.length > 0 && (
                                    <ul className="absolute left-0 z-10 mt-20 ml-[82px] w-[1213px] bg-white border border-gray-300 rounded-md shadow-lg">
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
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-4 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
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
                            onChange={(e) => handleProductSearch(
                                e,
                                setSearchTerm,
                                setFilteredProducts,
                                warehouse,
                                saleProduct?.warehouse
                            )}

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
                        <table className="mt-10 min-w-full bg-white border rounded-md border-gray-200">
                            <thead className="rounded-md bg-gray-50">
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
                            {saleReturProductData.length > 0 && (
                                <tbody>
                                    {saleReturProductData.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4  text-left whitespace-nowrap text-sm ">
                                                <p className="rounded-[5px] text-center p-[6px] bg-green-100 text-green-500">
                                                    {getQty(product, product.selectedVariation)}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, -1)} // Decrement
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className="w-[16px] h-[16px]" src={Decrease} alt="decrease" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={product.quantity ||  0}
                                                        onChange={(e) =>
                                                            handleQtyChange(index, e.target.value, true) // Handle direct input
                                                        }
                                                        className="mx-2 w-16 py-[5px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                    />
                                                    <button
                                                        onClick={() => handleQtyChange(index, 1)} // Increment
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.productPrice || getPriceRange(product, product.selectedVariation))}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                {currency} {product.subtotal}
                                            </td>

                                            {/* Variation Type */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.variationValues && Object.keys(product.variationValues).length > 0 ? (
                                                    <select
                                                        value={product.selectedVariation}
                                                        onChange={(e) => handleVariationChange(index, e.target.value)}
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
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => {
                                                        if (product.source === 'backend') {
                                                            handleDeleteExisting(id, product.currentID);
                                                        } else if (product.source === 'frontend') {
                                                            handleDeleteSelectedProduct(product._id, setSaleReturProductData);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>

                    <div className='flex justify-between'>
                        <div className="relative mt-10 w-full mr-5">
                            <label className="block text-left text-sm font-medium text-gray-700">Received Amount:</label>
                            <input
                                value={saleProduct.paidAmount}
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
                                value={total}
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

                    <button
                        onClick={() => handleUpdateEndOfTheDaySale(id, total, calculateProfitOfSale().toFixed(2), saleProduct.paidAmount, saleProduct.warehouse, saleReturProductData, selectedDate, setError, setResponseMessage, setProgress, navigate)}
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
export default EditBackerySale;