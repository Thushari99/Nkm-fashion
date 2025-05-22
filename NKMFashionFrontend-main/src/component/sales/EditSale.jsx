import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleCustomerSelect, handleWarehouseChange, handleUpdateSale, handleProductSearch } from './SaleController'
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../pos/utils/fetchByWarehose';
import Decrease from '../../img/down-arrow (1).png'
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';
import formatWithCustomCommas from '../utill/NumberFormate';
import { useCurrency } from '../../context/CurrencyContext';

function EditSaleBody() {
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
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentType, setPaymentType] = useState({ cash: false, card: false, bank_transfer: false, });
    const [amounts, setAmounts] = useState({ cash: '', card: '', bank_transfer: '', });
    const [saleProduct, setSaleProduct] = useState([])
    const [saleReturProductData, setSaleReturProductData] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [progress, setProgress] = useState(false);
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const findSaleById = async () => {
            try {
                setProgress(true);
                console.log("Fetching sale by ID:", id);

                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findSaleById/${id}`);
                const fetchedProductsQty = Array.isArray(response.data?.productsData) ? response.data.productsData : [];
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0],
                    source: 'backend',
                }));

                setSaleReturProductData(initializedProductsQty);
                setSaleProduct(response.data);

                if (response.data.paymentType) {
                    const updatedPaymentType = { cash: false, card: false, bank_transfer: false };
                    const updatedAmounts = { cash: '', card: '', bank_transfer: '' };
                    response.data.paymentType.forEach(({ type, amount }) => {
                        if (updatedPaymentType.hasOwnProperty(type)) {
                            updatedPaymentType[type] = true;
                            updatedAmounts[type] = amount;
                        }
                    });
                    setPaymentType(updatedPaymentType);
                    setAmounts(updatedAmounts);
                }

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

    const getPriceRange = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues && selectedVariation) {
            return product.variationValues[selectedVariation]?.productPrice || product.productPrice || 0;
        }
        return product.productPrice || 0;
    };

    const getProductCost = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues && selectedVariation) {
            return product.variationValues[selectedVariation]?.productCost || product.productCost || 0;
        }
        return product.productCost || 0;
    };

    const getTax = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues && selectedVariation) {
            return product.variationValues[selectedVariation]?.orderTax / 100 || product.orderTax / 100 || 0;
        }
        return product.orderTax / 100 || 0;
    };

    const getQty = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues && selectedVariation) {
            return product.variationValues[selectedVariation]?.productQty || product.stockQty || 0;
        }
        return product.stockQty || 0;
    };

    const getDiscount = (product, selectedVariation) => {
        if (product.ptype === 'Variation' && product.variationValues && selectedVariation) {
            return product.variationValues[selectedVariation]?.discount || product.discount || 0;
        }
        return product.discount || 0;
    };

    // Update the calculateTotal function
    const calculateTotal = () => {
        const newSubtotal = saleReturProductData.reduce((acc, product) => {
            const price = product.price || product.productPrice || getPriceRange(product, product.selectedVariation) || 0;
            const quantity = product.quantity || 1;
            const taxRate = product.taxRate || getTax(product, product.selectedVariation);
            const discount = product.discount || getDiscount(product, product.selectedVariation) || 0;
            const specialDiscount = product.specialDiscount || 0;
            const discountedPrice = price - discount - specialDiscount;

            const taxableAmount = price * quantity;

            const taxAmount = taxableAmount * taxRate;

            const productSubtotal = (discountedPrice * quantity) + taxAmount;

            return acc + productSubtotal;
        }, 0);

        const newDiscountAmount = discountType === 'percentage'
            ? (newSubtotal * (saleProduct.discount / 100))
            : saleProduct.discount || 0;

        const offerPercentage = parseFloat(saleProduct.offerPercentage) || 0;
        const offerDiscountAmount = newSubtotal * (offerPercentage / 100);

        // Calculate shipping and tax
        const newShipping = parseFloat(saleProduct.shipping) || 0;
        const overallTaxRate = saleProduct.tax ? parseFloat(saleProduct.tax) / 100 : 0;
        const newTaxAmount = (newSubtotal - newDiscountAmount - offerDiscountAmount) * overallTaxRate;

        // Calculate final total
        const newTotal = (newSubtotal - newDiscountAmount - offerDiscountAmount) + newTaxAmount + newShipping;
        setTotal(newTotal.toFixed(2));
        return newTotal;
    };

    const calculateProfitOfSale = () => {
        const profitTotal = saleReturProductData.reduce((totalProfit, product) => {
            const productPrice = product.price || product.productPrice || getPriceRange(product, product.selectedVariation) || 0;
            const productCost = product.productCost || (getProductCost(product, product.selectedVariation));
            const productQty = product.quantity || 1;
            const discount = Number(getDiscount(product, product.selectedVariation));
            const specialDiscount = product.specialDiscount || 0;
            const discountedPrice = productPrice - discount - specialDiscount;

            const totalProductCost = (productCost * productQty);
            const subTotal = (discountedPrice * productQty);
            const profitOfProduct = subTotal - totalProductCost;
            return totalProfit + profitOfProduct;
        }, 0);

        let discountValue = 0;
        if (discountType === 'fixed') {
            discountValue = Number(saleProduct.discount);
        } else if (discountType === 'percentage') {
            discountValue = (profitTotal * Number(saleProduct.discount)) / 100;
        }
        const offerPercentage = parseFloat(saleProduct.offerPercentage) || 0;
        const offerDiscountValue = (profitTotal * offerPercentage) / 100;
        const pureProfit = profitTotal - discountValue - offerDiscountValue;

        return pureProfit;
    };

    useEffect(() => {
        setSaleReturProductData(prevProducts =>
            prevProducts.map(product => {
                const price = product.price || getPriceRange(product, product.selectedVariation);
                const quantity = product.quantity || 1;
                const taxRate = product.taxRate * 100
                    ? product.taxRate
                    : getTax(product, product.selectedVariation);
                const discount = getDiscount(product, product.selectedVariation);
                const specialDiscount = product.specialDiscount || 0;
                const discountedPrice = price - discount - specialDiscount;
                const newSubtotal = (discountedPrice * quantity) + (price * quantity * taxRate);
                return {
                    ...product,
                    subtotal: newSubtotal.toFixed(2),
                };
            })
        );
    }, [saleReturProductData]);

    const handleUpdateClick = () => {
        // Ensure saleReturProductData is an array and has items
        if (!Array.isArray(saleReturProductData) || saleReturProductData.length === 0) {
            toast.error('Please add at least one product to the sale');
            return;
        }
    
        const formattedPaymentType = Object.keys(paymentType)
            .filter((type) => paymentType[type])
            .map((type) => ({
                type,
                amount: amounts[type] ? Number(amounts[type]) : 0,
            }))
            .filter(({ amount }) => amount > 0);
    
        handleUpdateSale(
            id, 
            total, 
            calculateProfitOfSale().toFixed(2),
            saleProduct.orderStatus || 'pending', 
            saleProduct.paymentStatus || 'partial', 
            formattedPaymentType, 
            amounts, 
            saleProduct.shipping || 0,
            saleProduct.discountType || 'fixed',
            saleProduct.discount || 0,
            saleProduct.tax || 0, 
            saleProduct.warehouse,
            saleProduct.selectedCustomer, 
            saleReturProductData, 
            selectedDate, 
            saleProduct.offerPercentage || 0,
            setError, 
            setResponseMessage, 
            setProgress, 
            navigate
        );
    };

    const handleQtyChange = (index, deltaOrValue, isDirectInput = false) => {
        setSaleReturProductData((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                // Get current stock quantity
                let stockQty;
                if (item.ptype === "Variation" && item.selectedVariation) {
                    // For variation products, use the variation's stock
                    stockQty = item.variationValues?.[item.selectedVariation]?.productQty || 0;
                } else {
                    // For single-type products, use the product's stock
                    stockQty = item.stockQty || item.productQty || 0;
                }

                // Calculate new quantity
                let newQty;
                if (isDirectInput) {
                    const parsedValue = parseInt(deltaOrValue, 10);
                    if (isNaN(parsedValue)) return item;
                    newQty = Math.max(1, Math.min(parsedValue, stockQty));
                } else {
                    newQty = Math.max(1, Math.min((item.quantity || 1) + deltaOrValue, stockQty));
                }

                // Get product values
                const price = item.productPrice || getPriceRange(item, item.selectedVariation) || 0;
                const taxRate = item.source === 'frontend'
                    ? (item.orderTax / 100) || (getTax(item, item.selectedVariation) / 100)
                    : item.orderTax || getTax(item, item.selectedVariation);
                const discount = item.discount || getDiscount(item, item.selectedVariation) || 0;
                const specialDiscount = item.specialDiscount || 0;

                // Calculate new subtotal
                const discountedPrice = price - discount - specialDiscount;
                const newSubtotal = (discountedPrice * newQty) + (price * newQty * taxRate);

                return {
                    ...item,
                    quantity: newQty,
                    subtotal: newSubtotal.toFixed(2),
                };
            })
        );
    };

    useEffect(() => {
        calculateTotal();
    }, [saleReturProductData]);

    const handleVariationChange = (index, variation) => {
        setSaleReturProductData((prevProducts) =>
            prevProducts.map((product, i) => {
                if (i === index) {
                    // Check for duplicate variation
                    const productWithSameVariation = prevProducts.find(
                        (p, j) => j !== index && p._id === product._id && p.selectedVariation === variation
                    );

                    if (productWithSameVariation) {
                        toast.error(`The variation "${variation}" is already added.`);
                        return product;
                    }

                    // Get variation details
                    const variationDetails = product.variationValues[variation] || {};
                    const updatedPrice = variationDetails.productPrice || product.productPrice;
                    const updatedCost = variationDetails.productCost || product.productCost;
                    const updatedTax = variationDetails.orderTax || product.orderTax;
                    const updatedQty = variationDetails.productQty || product.stockQty;
                    const currentQty = product.quantity || 1;

                    // Adjust quantity if exceeds available stock
                    const adjustedQty = Math.min(currentQty, updatedQty);
                    if (adjustedQty < currentQty) {
                        toast.warning(`Quantity adjusted to available stock (${updatedQty}) for "${variation}"`);
                    }

                    // Calculate new subtotal
                    const taxRate = updatedTax / 100;
                    const discount = variationDetails.discount || product.discount;
                    const specialDiscount = product.specialDiscount || 0;
                    const discountedPrice = updatedPrice - discount - specialDiscount;
                    const newSubtotal = (discountedPrice * adjustedQty) + (updatedPrice * adjustedQty * taxRate);

                    return {
                        ...product,
                        selectedVariation: variation,
                        productPrice: updatedPrice,
                        productCost: updatedCost,
                        orderTax: updatedTax,
                        stockQty: updatedQty,
                        quantity: adjustedQty,
                        discount: discount,
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

    const handleOrderStatusChange = (e) => {
        const newOrderStatus = e.target.value;
        setOrderStatus(newOrderStatus);
        setSaleProduct((prevData) => ({
            ...prevData,
            orderStatus: newOrderStatus,
        }));
    };

    const handlePaymentStatusChange = (e) => {
        const newPaymentStatus = e.target.value;
        setPaymentStatus(newPaymentStatus);
        setSaleProduct((prevData) => ({
            ...prevData,
            paymentStatus: newPaymentStatus,
        }));
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

    const handleDiscountType = (e) => {
        const value = e.target.value;
        setDiscountType(value);
        setSaleProduct((prevSaleProduct) => ({
            ...prevSaleProduct,
            discountType: value,
        }));
    };

    const handleDiscount = (e) => {
        const value = e.target.value;
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue) || numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }
        setSaleProduct({
            ...saleProduct,
            discount: value
        });
    };

    const handleTax = (e) => {
        setSaleProduct({ ...saleProduct, tax: e.target.value });
    };

    const handleShippng = (e) => {
        setSaleProduct({ ...saleProduct, shipping: e.target.value });
    };

    const handleCheckboxChange = (type) => {
        setPaymentType((prev) => {
            const updatedPaymentType = { ...prev, [type]: !prev[type] };
            setAmounts((prevAmounts) => ({
                ...prevAmounts,
                [type]: updatedPaymentType[type] ? '' : prevAmounts[type] || '',
            }));
            return updatedPaymentType;
        });
    };

    // Handle amount change
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

    // Updated handleProductSelect to properly initialize tax for frontend products
    const handleProductSelect = (product) => {
        setSaleReturProductData((prevProducts) => {
            // Check for duplicate products
            const isDuplicate = prevProducts.some(p =>
                p._id === product._id &&
                (!product.selectedVariation || p.selectedVariation === product.selectedVariation)
            );

            if (isDuplicate) {
                toast.error('This product is already added');
                return prevProducts;
            }

            // Initialize values
            const price = product.productPrice || getPriceRange(product, product.selectedVariation) || 0;
            const taxValue = product.orderTax / 100 || 0;
            const discount = getDiscount(product, product.selectedVariation);
            const stockQty = getQty(product, product.selectedVariation);

            const newProduct = {
                ...product,
                _id: product._id,
                name: product.name,
                code: product.code,
                barcode: product.barcode,
                ptype: product.ptype,
                selectedVariation: product.selectedVariation || null,
                quantity: 1,
                productPrice: price,
                productCost: getProductCost(product, product.selectedVariation) || 0,
                stockQty: stockQty,
                taxRate: taxValue,
                orderTax: taxValue,
                discount: discount,
                specialDiscount: product.specialDiscount || 0,
                variationValues: product.variationValues || {},
                warehouse: product.warehouse || warehouse,
                source: 'frontend',
                subtotal: calculateProductSubtotal(product, product.selectedVariation, 1)
            };

            return [...prevProducts, newProduct];
        });

        // Clear search state
        setSearchTerm('');
        setFilteredProducts([]);
    };

    // Helper function to calculate product subtotal
    const calculateProductSubtotal = (product, variation, quantity = 1) => {
        const price = variation && product.variationValues?.[variation]?.productPrice
            ? product.variationValues[variation].productPrice
            : product.productPrice || 0;

        const taxRate = product.source === 'frontend'
            ? (product.orderTax / 100 || getTax(product, variation) / 100)
            : (product.orderTax || getTax(product, variation));

        const discount = product.discount || getDiscount(product, variation) || 0;
        const specialDiscount = product.specialDiscount || 0;
        const discountedPrice = price - discount - specialDiscount;
        return (discountedPrice * quantity) + (price * quantity * taxRate);
    };

    const handleDeleteExisting = async (saleID, productID) => {
        const total = calculateTotal();
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this item?");
            if (!confirmDelete) return;
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteProductFromSale`, {
                params: { saleID, productID, total },
            });
            setSaleReturProductData(saleReturProductData.filter(product => product.currentID !== productID));

            if (response.status === 200) {
                toast.success('Sale deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            } else {
                alert("Failed to delete the item.");
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
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Edit Sale</h2>
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
                                    readOnly
                                    value={saleProduct.warehouse} // Pre-filled warehouse for editing
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
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>

                            {/* customer */}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={saleProduct.customer}
                                    required
                                    //onChange={(e) => handleCustomerSearch(e, setSearchCustomer, setFilteredCustomer)}
                                    placeholder={searchCustomer ? "" : "        Search..."}
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
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
                                                    {product.productQty ? product.productQty : product.stockQty || getQty(product, product.selectedVariation)}
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
                                                        value={product.quantity}
                                                        onChange={(e) =>
                                                            handleQtyChange(index, e.target.value, true) // Handle direct input
                                                        }
                                                        className="mx-2 w-16 py-[5px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                    />
                                                    <button
                                                        onClick={() => handleQtyChange(index, 1)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.price || getPriceRange(product, product.selectedVariation))}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.subtotal)}
                                            </td>

                                            {/* Variation Type */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.variationValues && Object.keys(product.variationValues).length > 0 ? (
                                                    <select
                                                        value={product.selectedVariation}
                                                        onChange={(e) => product.source === 'frontend' && handleVariationChange(index, e.target.value)}
                                                        disabled={product.source === 'backend'}
                                                        className={`block w-full border py-2 border-gray-300 rounded-md shadow-sm focus:border-transparent ${product.source === 'backend' ? 'bg-gray-100 cursor-not-allowed' : ''
                                                            }`}
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

                    <div className="">
                        {/* DISCOUNT, SHIPPING AND TAX INPUT */}
                        <div className="grid grid-cols-4 gap-4 mb-4 mt-60">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Type:</label>
                                <select
                                    onChange={handleDiscountType}
                                    value={saleProduct.discountType}
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
                                    value={saleProduct.discount}
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
                                    value={saleProduct.tax}
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
                                    value={saleProduct.shipping}
                                    type="text"
                                    placeholder="Shipping"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {currency}
                                </span>
                            </div>
                        </div>

                        {/* Order, Payment Status, and Payment Type Selects */}
                        <div className="flex justify-between gap-4 mt-10">
                            <div className='w-1/2'>
                                <label className="block text-sm font-medium text-left text-gray-700">Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={saleProduct.orderStatus}
                                    onChange={handleOrderStatusChange}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Order Status</option>
                                    <option value="ordered">Ordered</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            {/* Payment Status Select */}
                            <div className='w-1/2 text-right'>
                                <label className="block text-sm font-medium  text-left text-gray-700">Payment Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={saleProduct.paymentStatus}
                                    onChange={handlePaymentStatusChange}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Payment Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                </select>
                            </div>
                        </div>


                        {/* Payment Type Select */}
                        <div className="mt-10 mb-14 w-full">
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
                                        <label htmlFor={type} className="text-sm text-gray-700 capitalize">
                                            {type.replace('_', ' ')}
                                        </label>
                                        {paymentType[type] && (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={amounts[type]}
                                                    onChange={(e) => handleAmountChange(type, e.target.value)}
                                                    placeholder="Enter amount"
                                                    className="block w-44 rounded-md border-0 py-2.5 px-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-xs text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
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
                    <div className="mt-1 text-right text-lg font-semibold">
                        Balance: {currency} {formatWithCustomCommas(
                            (total - Object.values(amounts).reduce((acc, val) => acc + (Number(val) || 0), 0)).toFixed(2)
                        )}
                    </div>

                    <div className="mt-4 text-right text-lg font-semibold">
                        Total: {currency} {formatWithCustomCommas(total)}
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Profit: {currency} {
                            saleReturProductData?.length > 0
                                ? formatWithCustomCommas(calculateProfitOfSale())
                                : '0.00'
                        }
                    </div>
                    
                    <button
                        onClick={handleUpdateClick}
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
export default EditSaleBody;