import { useState, useEffect, useRef, useContext } from 'react';
import ProductFilters from './ProductFilters';
import CryptoJS from 'crypto-js';
import { useCurrency } from '../../../context/CurrencyContext';
import { Link } from 'react-router-dom';
import '../../../styles/role.css';
import 'react-loading-skeleton/dist/skeleton.css'
import '../../../styles/tempory.css'
import '../utils/fetchDefaultData';
import formatWithCustomCommas from '../../utill/NumberFormate';
import Menu from '../../../img/held POS 1.png';
import pro from '../../../img/Main Close POS 1.png';
import Full from '../../../img/Full Screen POS 1.png';
import Cal from '../../../img/Cal POS 1.png';
import Back from '../../../img/Back POS 1.png';
import SL_R from '../../../img/saleReturn.png';
import User from '../../../img/add-user (1).png';
import Box from '@mui/material/Box';
import Skeleton from 'react-loading-skeleton'
import BillingSection from './posBillCalculation';
import popSound from '../../../../src/audio/b.mp3';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import Calculator from './posCalCulator';
import ProductVariationModal from './productVariationEdit';
import { handleFindProductBySearch, handleProductSubmit } from '../utils/searchProduct';
import { getHeldProducts, handleDeleteHoldProduct } from '../utils/holdProductControll';
import { fetchCategoryData } from '../utils/fetchByCategory';
import { fetchBrandData } from '../utils/fetchByBrand';
import { fetchAllData } from '../utils/fetchAllData';
import { handleFullScreen } from '../utils/fullScreenView';
import { handlePopupOpen } from '../utils/registerHandling';
import { fetchProductDataByWarehouse } from '../utils/fetchByWarehose';
import { getPriceRange, getQty, getTax, getDiscount, getProductCost } from '../utils/qtyAndPriceCalculation';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { UserContext } from '../../../context/UserContext';
import Draggable from 'react-draggable';

function PosSystemBody({ defaultWarehouse }) {
    const ProductIcon = 'https://cdn0.iconfinder.com/data/icons/creative-concept-1/128/PACKAGING_DESIGN-512.png';
    // State management
    const { userData } = useContext(UserContext);
    const [filters, setFilters] = useState({ brands: [], warehouses: [], categories: [] });
    const [warehouse, setWarehouse] = useState(sessionStorage.getItem("defaultWarehouse") || "");
    const [productData, setProductData] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [searchCustomerResults, setSearchCustomerResults] = useState([]);
    const [searchedProductData, setSearchedProductData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [Productkeyword, setProductKeyword] = useState('');
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [productBillingHandling, setProductBillingHandling] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectVariation, setSelectVariation] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [isHoldList, setIsHoldList] = useState(false)
    const [heldProducts, setHeldProducts] = useState([])
    const [isExitingPopupOpen, setIsExitingPopupOpen] = useState(false);
    const [isPopUpRegisterReport, setIsPopUpRegisterReport] = useState(false);
    const [registerData, setRegisterData] = useState({
        openTime: '',
        username: '',
        name: '',
        cashHandIn: 0,
        totalBalance: 0
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [error, setError] = useState('')
    const [reloadStatus, setReloadStatus] = useState(false);
    const [heldProductReloading, setHeldProductReloading] = useState(false)
    const inputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walkInCustomerName, setWalkInCustomerName] = useState('');
    const [walkInCustomerNic, setWalkInCustomerNic] = useState('');
    const [walkInCustomerMobile, setWalkInCustomerMobile] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [permissionData, setPermissionData] = useState([]);

    const [reportWarehouse, setReportWarehouse] = useState('all');
    const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
    const [cashPaymentAmount, setCashPaymentAmount] = useState(0);
    const [bankTransferPaymentAmount, setBankTransferPaymentAmount] = useState(0);
    const [tax, setTax] = useState(0)
    const [totalDiscountAmount, setTotalDiscountAmount] = useState(0);
    const [inputs, setInputs] = useState({
        amount20: 0, amount50: 0, amount100: 0, amount500: 0, amount1000: 0, amount5000: 0, amount1: 0, amount2: 0, amount5: 0, amount10: 0,
    });
    const [ProductNameOrCode, setProductNameOrCode] = useState('')
    const [searchedProductDataByName, setSearchedProductDataByName] = useState([]);
    const selectedWarehouseAccess = permissionData?.warehousePermissions?.[warehouse]?.access ?? false;
    const { currency } = useCurrency();

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = searchedProductData.length > 0
        ? searchedProductData
        : selectedCategoryProducts.length > 0
            ? selectedCategoryProducts
            : selectedBrandProducts.length > 0
                ? selectedBrandProducts
                : productData.length > 0
                    ? productData
                    : [];

    const navigate = useNavigate();

    useEffect(() => {
        if (userData) {
            const permissions = userData?.permissions || {};
            const warehousePermissions = Object.values(permissions?.managePOS?.warehouses || {}).reduce((acc, warehouse) => {
                if (warehouse.warehouseName) {
                    acc[warehouse.warehouseName] = warehouse;
                }
                return acc;
            }, {});

            // Function to check if the user has any permission on a specific key
            const hasAnyPermission = (permissionKey) => {
                const subPermissions = permissions[permissionKey] || {};
                return Object.values(subPermissions).some(Boolean);
            };

            setPermissionData({
                ...Object.keys(permissions).reduce((acc, key) => {
                    acc[key] = hasAnyPermission(key);
                    return acc;
                }, {}),
                warehousePermissions,
            });
        }
    }, [userData]);


    useEffect(() => {
        if (reloadStatus && !warehouse) {
            fetchAllData(setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setProgress, setError);
            setReloadStatus(false);
        }
    }, [reloadStatus]);

    //FETCHING ALL DATA (DEFAULT, BRAND OR CATEGORY)
    useEffect(() => {
        if (!warehouse) {
            fetchAllData(setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setProgress, setError);
        }
    }, [warehouse]);


    // FETCHING ALL DATA BY WAREHOUSE
    const handleWarehouseChange = (e) => {
        const selectedWarehouse = e.target.value;
        setWarehouse(selectedWarehouse);

        // Ensure selectedWarehouse matches the format of the keys in warehousePermissions
        const warehousePerms = permissionData?.warehousePermissions?.[selectedWarehouse] || {};
        if (selectedWarehouse) {
            fetchProductDataByWarehouse(
                selectedWarehouse,
                setProductData,
                setSelectedCategoryProducts,
                setSelectedBrandProducts,
                setSearchedProductData,
                setLoading
            );
        } else {
            setProductData([]);
        }
    };

    useEffect(() => {
        if (productData.length > 0) {
        }
    }, [productData]);


    // Check permissions for the selected warehouse
    const canSelectProduct = (productWarehouseName) => {

        if (!productWarehouseName) {
            return false;
        }
        // Ensure that we're checking permissions for the selected warehouse, not the product's warehouse
        const warehouseEntry = permissionData?.warehousePermissions?.[warehouse] || {};  // Use 'warehouse' state here

        if (!warehouseEntry) {
            return false;
        }

        // Check if the user has `access` and `create_pos_sale` permissions
        const isSelectable = !!(warehouseEntry.access && warehouseEntry.create_sale_from_pos);

        if (isSelectable) {
        } else {
        }

        return isSelectable;
    };


    const playSound = () => {
        const audio = new Audio(popSound);
        audio.play().catch(error => {
            console.error('Audio play failed:', error);
        });
    };

    useEffect(() => {
    }, [productBillingHandling]);

    const toggleCalculator = () => {
        setShowCalculator((prevState) => {
            return !prevState;
        });
    };

    useEffect(() => {
        const savedWarehouse = sessionStorage.getItem("defaultWarehouse");
        if (savedWarehouse) {
            setWarehouse(savedWarehouse);
            fetchProductDataByWarehouse(
                savedWarehouse,
                setProductData,
                setSelectedCategoryProducts,
                setSelectedBrandProducts,
                setSearchedProductData,
                setLoading
            );
        }
    }, []);

    useEffect(() => {
        getHeldProducts(setHeldProducts);
        setHeldProductReloading(false);
    }, [heldProductReloading]);

    useEffect(() => {
        if (searchedProductData.length > 0) {
            searchedProductData.forEach((product) => {
                if (!product.warehouse || Object.keys(product.warehouse).length === 0) {
                    console.error("Product is missing warehouse data:", product);
                    alert("This product is missing warehouse data and cannot be added.");
                    return;
                }

                handleAddingProduct({
                    id: product._id,
                    name: product.name,
                    price: getPriceRange(product),
                    productCost: getProductCost(product),
                    stokeQty: product.productQty || getQty(product),
                    tax: product.oderTax ? product.oderTax : getTax(product),
                    discount: getDiscount(product),
                    ptype: product.ptype,
                    warehouse: product.warehouse,
                    variation: product.variation,
                    variationType: product.variationType,
                    variationValues: product.variationValues,
                });
            });
        }
    }, [searchedProductData]);


    const handleAddingProduct = (product) => {
        setProductBillingHandling((prevBilling) => {
            const selectedWarehouse = warehouse || sessionStorage.getItem("defaultWarehouse");
            const defaultWarehouse = sessionStorage.getItem("defaultWarehouse");

            if (!selectedWarehouse) {
                alert("No warehouse selected.");
                return prevBilling;
            }

            if (selectedWarehouse !== defaultWarehouse) {
                alert("You can only add products from the default warehouse.");
                return prevBilling;
            }

            if (!product.warehouse || Object.keys(product.warehouse).length === 0) {
                alert("Product data is missing warehouse details.");
                return prevBilling;
            }

            const warehouseKey = Object.keys(product.warehouse || {}).find(
                key => key.toLowerCase() === selectedWarehouse.toLowerCase()
            );

            if (!warehouseKey) {
                alert(`Warehouse '${selectedWarehouse}' does not exist for this product.`);
                return prevBilling;
            }
            const warehouseData = product.warehouse[warehouseKey];

            if (!warehouseData) {
                alert(`No data found for warehouse '${warehouseKey}'.`);
                return prevBilling;
            }

            if (product.ptype === "Single") {
                const existingProduct = prevBilling.find(
                    (p) => p.id === product.id && p.warehouse === selectedWarehouse
                );

                if (existingProduct) {
                    if (existingProduct.qty + 1 > warehouseData.productQty) {
                        console.warn("[WARNING] Cannot add more than available stock.");
                        alert("Cannot add more than available stock.");
                        return prevBilling;
                    } else {
                        return prevBilling.map((p) =>
                            p.id === product.id && p.warehouse === selectedWarehouse
                                ? { ...p, qty: p.qty + 1 }
                                : p
                        );
                    }
                } else {
                    if (warehouseData.productQty > 0) {
                        return [...prevBilling, { ...product, qty: 1, warehouse: selectedWarehouse }];
                    } else {
                        console.error("[ERROR] Product is out of stock.");
                        alert("This product is out of stock.");
                        return prevBilling;
                    }
                }
            } else if (product.ptype === "Variation") {
                const existingVariation = prevBilling.find(
                    (p) => p.id === product.id && p.selectedVariation === product.selectedVariation
                );

                if (existingVariation) {
                    alert("This variation is already added from held products.");
                    return prevBilling;
                }

                const variationValues = warehouseData.variationValues || {};
                if (!Object.keys(variationValues).length) {
                    alert("No variations found for this product in the selected warehouse.");
                    return prevBilling;
                }

                setSelectVariation(true);
                setSelectedProduct({
                    ...product,
                    warehouse: selectedWarehouse,
                    variationValues,
                });
                return prevBilling;
            }
            return prevBilling;

        });

        setTimeout(() => {
            fetchAllData(
                setProductData,
                setSelectedCategoryProducts,
                setSelectedBrandProducts,
                setSearchedProductData,
                setProgress,
                setError
            );
            setProductKeyword("");
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
        inputRef.current.focus();
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [Productkeyword]);

    const getQtyForSelectedWarehouse = (product, selectedWarehouse) => {
        if (product.warehouse && typeof product.warehouse === 'object' && selectedWarehouse) {
            // Get the specific warehouse data for the selected warehouse
            const selectedWarehouseData = product.warehouse[selectedWarehouse];

            if (selectedWarehouseData) {
                // If the warehouse has variations, calculate the quantity for each variation
                if (selectedWarehouseData.variationValues) {
                    const quantities = Object.values(selectedWarehouseData.variationValues)
                        .map(variation => {
                            const qty = Number(variation.productQty);
                            return qty;
                        })
                        .filter(qty => !isNaN(qty));
                    return quantities.length > 0 ? quantities.reduce((total, current) => total + current, 0) : 0;
                } else {
                    return Number(selectedWarehouseData.productQty) || 0;
                }
            } else {
                console.log("No data found for selected warehouse");
            }
        } else {
            console.log("Invalid warehouse or product data");
        }

        // Return 0 if no warehouse data is found for the selected warehouse or if selectedWarehouse is invalid
        return 0;
    };


    const handleHoldOpen = () => {
        setIsHoldList(!isHoldList);
    };

    // Handle search input change
    const handleFindUser = (e) => {
        setKeyword(e.target.value);
    };

    // Determine search type based on the keyword
    const determineSearchType = (keyword) => {
        if (/^\d+$/.test(keyword)) { // If the keyword is numeric
            return 'mobile';
        } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(keyword)) { // If the keyword looks like an email
            return 'username';
        } else {
            return 'name'; // Default to name if nothing else fits
        }
    };

    // Handle search form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const searchType = determineSearchType(keyword);
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCustomer`, {
                params: { keyword, searchType }
            });
            console.log(response.data)
            setSearchCustomerResults(response.data); // Save the search results// Select the first result if available
        } catch (error) {
            console.error('Find customer error:', error);
        }
    };

    const handleWalkInCustomerSubmit = async (e) => {
        e.preventDefault();

        // Input validation
        if (!walkInCustomerName.trim()) {
            alert('Customer name is required.');
            return;
        }
        const newNICRegex = /^\d{12}$/;         // New format: 12 digits only
        const oldNICRegex = /^\d{9}[VXvx]$/;    // Old format: 9 digits + 'V' or 'X'

        if (!newNICRegex.test(walkInCustomerNic) && !oldNICRegex.test(walkInCustomerNic)) {
            alert('NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).');
            return;
        }
        if (!walkInCustomerMobile.trim() || !/^\+94\d{9}$/.test(walkInCustomerMobile)) {
            alert('Mobile is required and must follow the format +94XXXXXXXXX.');
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/walkInCustomer`,
                {
                    name: walkInCustomerName.trim(),
                    nic: walkInCustomerNic.trim(),
                    mobile: walkInCustomerMobile.trim(),
                }
            );

            // Handle success
            toast.success(
                "Customer created successfully!",
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
            setSuccess(response.data.message);
            setWalkInCustomerName('');
            setWalkInCustomerNic('');
            setWalkInCustomerMobile('');
            setError('');
            setIsModalOpen(false); // Close modal on success
        } catch (error) {
            toast.error("Customer not added",
                { autoClose: 2000 },
                { className: "custom-toast" });
            console.error('Walk-in customer error:', error);

            // Handle error from backend
            setError(
                error.response?.data?.message || 'An error occurred while creating the customer.'
            );
        }
    };

    const handleEditHoldProduct = async (heldProduct) => {
        try {
            const productToAdd = heldProduct.products.map(product => {
                const baseDetails = product.baseProductDetails || {};

                let productPrice = product.price;
                let productQty = baseDetails.productQty || null;

                if (product.variation && product.variationValues) {
                    const selectedVariation = product.variationValues[product.variation];

                    if (selectedVariation) {
                        productPrice = selectedVariation.productPrice || productPrice;
                        productQty = selectedVariation.productQty || productQty;
                    }
                }
                return {
                    holdProductID: product._id,
                    id: product.currentID,
                    name: product.name,
                    tax: product.tax,
                    price: product.price || productPrice,
                    stokeQty: product.stokeQty || productQty,
                    qty: product.purchaseQty,
                    discount: product.discount,
                    ptype: product.ptype || 'Single',
                    selectedVariation: product.variation ? product.variation : null,
                    variationValues: {
                        ...baseDetails.variationValues
                    },
                };

            });

            const uniqueProductsToAdd = productToAdd.filter(newProduct => {
                return !productBillingHandling.some(existingProduct => {
                    return existingProduct.curruntID === newProduct.curruntID &&
                        existingProduct.selectedVariation === newProduct.selectedVariation;
                });
            });
            setProductBillingHandling(uniqueProductsToAdd);
            handleDeleteHoldProduct(heldProduct._id, heldProducts, setHeldProducts)
            setIsHoldList(false);

        } catch (error) {
            console.error('Error fetching products by IDs:', error);
        }

    };

    const handlePopupClose = () => {
        setIsPopupOpen(false);
    };

    const handleExitingPopupClose = () => {
        setIsExitingPopupOpen(false);
    }

    const handleRegisterReportOpen = async () => {
        setIsPopUpRegisterReport(true);
        const fetchReportData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findRegisterData`);
                if (response.data) {
                    setRegisterData(response.data.data);
                    console.log(response.data)
                } else {
                    console.error('Unexpected response format:', response.data);
                    setRegisterData([]);
                }
            } catch (err) {
                console.error('Error fetching report data:', err);
                setErrorMessage('Failed to fetch report data');
            }
        };
        fetchReportData();

        setIsPopupOpen(false)
    }

    const handleRegisterReportClose = () => {
        setIsPopUpRegisterReport(false)
    }

    const handlePOSClose = async () => {
        const cashRegisterID = sessionStorage.getItem('cashRegisterID');
        if (!cashRegisterID) return;

        try {
            // Transform inputs object to array format
            const transformedInputs = Object.entries(inputs)
                .map(([key, value]) => ({
                    denomination: parseInt(key.replace('amount', ''), 10), // Base 10 parsing
                    quantity: value,
                    amount: parseInt(key.replace('amount', ''), 10) * value
                }))
                .filter(item => item.quantity > 0);


            // Prepare transaction data
            const transactionData = {
                cardPaymentAmount,
                cashPaymentAmount,
                bankTransferPaymentAmount,
                totalDiscountAmount,
                inputs: transformedInputs,
                registerData,
                cashVariance: Math.max(0, cashPaymentAmount - calculateTotal())
            };
            console.log(transactionData)

            //1. First save transaction data
            await axios.post(`${process.env.REACT_APP_BASE_URL}/api/saveZreadingBill`, transactionData, {
                headers: { 'Content-Type': 'application/json' }
            });

            // 2. Close the register after successful save
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/closeRegister/${cashRegisterID}`);

            //Cleanup
            toast.success('POS close successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            sessionStorage.removeItem('cashRegisterID');
            sessionStorage.removeItem('cashierUsername');
            sessionStorage.removeItem('name');
            setIsPopupOpen(false);
            navigate('/dashboard');

        } catch (error) {
            console.error('POS Closure Error:', error);
            const errorContext = error.config?.url?.includes('saveZreadingBill')
                ? 'Failed to save transaction data'
                : 'Failed to close register';

            setErrorMessage(error.response?.data?.message || `${errorContext}: ${error.message}`);
            toast.error('Error closing POS!', { autoClose: 2000 }, { className: "custom-toast" });

            if (error.config?.url?.includes('closeRegister')) {
                sessionStorage.removeItem('cashRegisterID');
                sessionStorage.removeItem('cashierUsername');
            }
        }
    };

    const handleExitingFromPos = () => {
        setIsExitingPopupOpen(false);
        navigate('/dashboard');
    };

    let username = '';
    const encryptedCashierUsername = sessionStorage.getItem('cashierUsername');
    if (encryptedCashierUsername) {
        try {
            const userKey = CryptoJS.AES.decrypt(encryptedCashierUsername, 'ldunstvd');
            username = userKey.toString(CryptoJS.enc.Utf8);

            if (!username) {
                //console.error('Decryption successful, but username is empty.');
            }
        } catch (error) {
            console.error('Error decrypting username:', error);
        }
    } else {
        console.error('No cashierUsername found in sessionStorage.');
    }

    const handleHorizontalScroll = (e, containerId) => {
        e.preventDefault();
        const container = document.getElementById(containerId);
        if (container) {
            container.scrollBy({
                left: e.deltaY,
            });
        }
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const warehouse = reportWarehouse;
                let url = `${process.env.REACT_APP_BASE_URL}/api/getTodayReportData/${warehouse}`;
                const response = await axios.get(url);
                const sales = response.data.data.sales;
                const formatAmount = (amount) => {
                    const value = amount / 1000;
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(2)}M`;
                    }
                    return `${value.toFixed(2)}K`;
                };

                const { total, totalTaxAmount } = sales.reduce((totals, sale) => {
                    if (sale && sale.productsData) {
                        let saleTax = 0;

                        if (sale.tax && sale.grandTotal) {
                            saleTax = (parseFloat(sale.tax) / 100) * parseFloat(sale.grandTotal);
                        }
                        sale.productsData.forEach(product => {
                            const quantity = parseInt(product.quantity || 0, 10);
                            const tax = parseFloat(product.taxRate || 0);
                            const price = parseFloat(product.price || 0);

                            const subTotal = price * quantity;
                            totals.total += subTotal;
                            const taxAmount = (tax * price * quantity) + saleTax;
                            totals.totalTaxAmount += taxAmount;
                        });
                    }
                    return totals;
                }, { total: 0, totalTaxAmount: 0 });

                const { grandTotal, totalDiscountAmount } = sales.reduce((totals, sale) => {
                    if (sale && sale.productsData) {
                        let saleSubtotal = 0;
                        let productDiscounts = 0;

                        sale.productsData.forEach(product => {
                            const quantity = parseInt(product.quantity || 0, 10);
                            const price = parseFloat(product.price || 0);
                            const discount = parseFloat(product.discount || 0);
                            const specialDiscount = parseFloat(product.specialDiscount || 0);

                            const subTotal = price * quantity;
                            saleSubtotal += subTotal;
                            productDiscounts += (discount + specialDiscount) * quantity;
                        });

                        let saleDiscount = 0;
                        if (sale.discount) {
                            const discountValue = parseFloat(sale.discount);
                            saleDiscount = sale.discountType === 'percentage'
                                ? saleSubtotal * (discountValue / 100)
                                : discountValue;
                        }
                        const offerDiscount = saleSubtotal * (parseFloat(sale.offerPercentage || 0) / 100);
                        totals.grandTotal += saleSubtotal;
                        totals.totalDiscountAmount += productDiscounts + saleDiscount + offerDiscount;
                    }
                    return totals;
                }, { grandTotal: 0, totalDiscountAmount: 0 });

                setTotalDiscountAmount(totalDiscountAmount);
                setTax(totalTaxAmount);
            } catch (error) {
                console.error('Error fetching report data:', error);
                setError('Failed to fetch report data');
            }
            finally {
                setLoading(false)
            }
        };

        fetchReportData();
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const warehouse = reportWarehouse;
                let url = `${process.env.REACT_APP_BASE_URL}/api/getTodayReportData/${warehouse}`;
                const response = await axios.get(url);
                const sales = response.data.data.sales;

                // Initialize payment type totals
                let cardTotal = 0;
                let cashTotal = 0;
                let bankTransferTotal = 0;

                sales.forEach(sale => {
                    // Process each payment method in the paymentType array
                    sale.paymentType?.forEach(payment => {
                        switch (payment.type) {
                            case 'card':
                                cardTotal += payment.amount;
                                break;
                            case 'cash':
                                cashTotal += payment.amount;
                                break;
                            case 'bank_transfer':
                                bankTransferTotal += payment.amount;
                                break;
                            default:
                                cashTotal += payment.amount;
                                break;
                        }
                    });
                });

                setCardPaymentAmount(cardTotal);
                setCashPaymentAmount(cashTotal);
                setBankTransferPaymentAmount(bankTransferTotal);

            } catch (error) {
                console.error('Error fetching report data:', error);
                setError('Failed to fetch report data');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs({
            ...inputs,
            [name]: value
        });
    };

    const calculateTotal = () => {
        const total =
            (inputs.amount20 * 20) +
            (inputs.amount50 * 50) +
            (inputs.amount100 * 100) +
            (inputs.amount500 * 500) +
            (inputs.amount1000 * 1000) +
            (inputs.amount5000 * 5000) +
            (inputs.amount1 * 1) +
            (inputs.amount2 * 2) +
            (inputs.amount5 * 5) +
            (inputs.amount10 * 10);
        return total;
    };

    const handleRealTimeSearch = async (searchTerm) => {
        if (searchTerm.trim() === "") {
            setSearchedProductDataByName([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findProductByName`, {
                params: {
                    keyword: searchTerm,
                    warehouse: warehouse
                },
            });

            // Directly set the product array, not nested
            setSearchedProductDataByName(response.data.products || []);
        } catch (error) {
            console.error("Error searching products:", error);
            setSearchedProductDataByName([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce function to limit how often we search
    const debounce = (func, delay) => {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Debounced version of our search function
    const debouncedSearch = debounce(handleRealTimeSearch, 300);

    // Handle input change
    const handleInputNameChange = (e) => {
        const value = e.target.value;
        setProductNameOrCode(value);
        if (value.trim() === "") {
            setSearchedProductDataByName([]); // Clear results when input is empty
        } else {
            debouncedSearch(value);
        }
    };

    useEffect(() => {
        console.log("Combined products:", combinedProductData);
    }, [searchedProductData, combinedProductData]);

    return (
        <div className="bg-[#eff3f7] absolute w-full h-screen p-2 overflow-hidden">
            {/* HEADER SECTION */}
            <div className="flex justify-between  w-full h-[80px]">
                <div className="flex justify-between w-[34.9%] bg-white h-[80px] rounded-[15px] ">
                    <div className="w-1/2 h-[82px] flex items-center relative  pb-[2px]">
                        <form onChange={handleSubmit} className="flex items-center relative w-full">
                            <input
                                name="keyword"
                                type="text"
                                placeholder="Find Customer"
                                className="searchBox w-[100%] m-2 pl-10 py-5 px-4 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                                value={keyword}
                                onChange={handleFindUser}
                            />
                            <button type="submit" className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-400">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </form>
                        {keyword && searchCustomerResults.length > 0 && (
                            <div className="absolute top-[90px] w-[94%] mr-2 text-left overflow-y-scroll h-[350px] left-[7px] bg-white border border-gray-300 rounded-lg shadow-md">
                                <ul className=''>
                                    {searchCustomerResults.map((customer, index) => (
                                        <li
                                            key={index}
                                            className="p-2 cursor-pointer hover:bg-gray-100"
                                            onClick={() => {
                                                setSelectedCustomer(customer.name);
                                                setKeyword('');
                                            }}
                                        >
                                            {customer.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            {/* Button to open modal */}
                            <button
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-300"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <img
                                    className="w-[20px] h-[20px] hover:scale-110 transition-transform duration-300"
                                    src={User}
                                    alt="add user"
                                />
                            </button>

                            {/* Modal for Walk-In Customer */}
                            {isModalOpen && (
                                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-sm z-[1000]">
                                    <div
                                        className="bg-white w-[350px] sm:w-[400px] p-6 rounded-2xl shadow-2xl transform scale-100 opacity-0 animate-fadeIn"
                                    >
                                        <div className="flex items-center justify-center mb-6">
                                            <h2 className="text-2xl font-semibold text-gray-700 text-center">
                                                Add Customer
                                            </h2>
                                        </div>
                                        <form onSubmit={handleWalkInCustomerSubmit}>
                                            <div className="relative mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Enter customer name"
                                                    value={walkInCustomerName}
                                                    onChange={(e) => setWalkInCustomerName(e.target.value)}
                                                    className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    required
                                                    title="Customer name is required."
                                                />
                                                <span className="absolute left-3 top-3 text-gray-400">
                                                    <i className="fas fa-user"></i>
                                                </span>
                                            </div>
                                            <div className="relative mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Enter NIC"
                                                    value={walkInCustomerNic}
                                                    onChange={(e) => setWalkInCustomerNic(e.target.value)}
                                                    className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    required
                                                    title="NIC is required and must be exactly 12 characters."
                                                />
                                                <span className="absolute left-3 top-3 text-gray-400">
                                                    <i className="fas fa-id-card"></i>
                                                </span>
                                            </div>
                                            <div className="relative mb-6">
                                                <input
                                                    type="text"
                                                    placeholder="Enter Mobile: +94XXXXXXXXX"
                                                    value={walkInCustomerMobile}
                                                    onChange={(e) => setWalkInCustomerMobile(e.target.value)}
                                                    className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    required
                                                    pattern="^\+94\d{9}$"
                                                    title="Enter a valid mobile number in the format +94XXXXXXXXX."
                                                />
                                                <span className="absolute left-3 top-3 text-gray-400">
                                                    <i className="fas fa-phone-alt"></i>
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <button
                                                    type="submit"
                                                    className="submit text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                >
                                                    Create
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(false)}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="w-1/2 h-[82px] flex items-center pb-[2px] relative rounded-[15px] mr-1 ">
                        <form className="w-full">
                            <select
                                id="warehouse"
                                name="warehouse"
                                value={warehouse}
                                onChange={handleWarehouseChange}
                                className="searchBox w-[97%]  pl-4 pr-2 py-5 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                            >
                                <option value="">Select a warehouse</option>
                                {filters.warehouses.map((wh) => (
                                    <option key={wh.name} value={wh.name}>
                                        {wh.name}
                                    </option>
                                ))}
                            </select>
                        </form>
                    </div>
                </div>

                <div className="w-[65%] ml-2 rounded-[15px] relative h-[80px] bg-white flex flex-col lg:flex-row items-start lg:items-center">
                    <div className="w-1/2 flex flex-col sm:w-full sm:flex-row gap-2">
                        {/* Search by Code */}
                        <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-2 mr-4">
                            <form
                                ref={inputRef}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleProductSubmit(Productkeyword, setLoading, setSearchedProductData, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setError);
                                }}
                                className="relative w-full sm:w-auto flex-grow"
                            >
                                <input
                                    name="Productkeyword"
                                    type="text"
                                    placeholder="Find By code"
                                    className="searchBox w-full m-2 pl-10 pr-2 py-5 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                                    value={Productkeyword}
                                    ref={inputRef}
                                    onChange={(e) => {
                                        setProductKeyword(e.target.value);
                                    }}
                                />
                                <p type="button" className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-400">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z" clipRule="evenodd" />
                                    </svg>
                                </p>
                            </form>

                            {/* Search by Name */}
                            <form
                                onSubmit={handleSubmit}
                                className="relative w-full sm:w-auto flex-grow"
                            >
                                <input
                                    name="Productkeyword"
                                    type="text"
                                    placeholder="Find By Name / code"
                                    className="searchBox w-full m-2 pl-10 pr-2 py-5 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                                    value={ProductNameOrCode}
                                    onChange={handleInputNameChange}
                                />
                                <p type="button" className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-400">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z" clipRule="evenodd" />
                                    </svg>
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-0 h-[78px]  justify-end md:mt-2 md:mb-2 sm:justify-between sm:bg-white sm:w-[99.5%] sm:ml-1 sm:mb-80 sm:mr-1 rounded-xl leading-none box-border">
                        <div className="relative p-2 m-2 w-[65px] h-[65px] border bg-[#44BC8D] rounded-[10px] flex items-center justify-center">
                            <button onClick={() => handleHoldOpen(setIsHoldList)}>
                                <img className="w-[45px] h-[45px]" src={Menu} alt="" />
                            </button>

                            {/* Notification Badge */}
                            {heldProducts && heldProducts.length > 0 && (
                                <span className="absolute top-[-8px] right-[-8px] bg-red-400 text-white text-xs rounded-full w-6 h-6 p-2 flex items-center justify-center">
                                    {heldProducts.length}
                                </span>
                            )}
                        </div>

                        {/* Popup for Hold list */}
                        {isHoldList && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                <div className="bg-white w-[600px] max-h-[450px] p-6 rounded-md shadow-lg overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Held Products</h2>

                                    {/* Handle no held products */}
                                    {heldProducts && heldProducts.length === 0 ? (
                                        <div className="text-center text-gray-500">
                                            <p>No held products available.</p>
                                        </div>
                                    ) : (
                                        /* Table to display held products */
                                        <table className="min-w-full bg-white border">
                                            <thead>
                                                <tr>
                                                    <th className="border px-4 py-2 text-gray-600">ID</th>
                                                    <th className="border px-4 py-2 text-gray-600">Reference No</th>
                                                    <th className="border px-4 py-2 text-gray-600">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {heldProducts.map((product) => (
                                                    <tr key={product._id}>
                                                        <td className="border px-4 py-2 text-left">{product._id}</td>
                                                        <td className="border px-4 py-2 text-left">{product.referenceNo}</td>
                                                        <td className="border px-4 py-2 flex text-left">
                                                            {/* Edit and Delete actions */}
                                                            <button
                                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                                style={{ background: 'transparent' }}
                                                                onClick={() => handleEditHoldProduct(product)}
                                                            >
                                                                <i className="fas fa-edit mr-1"></i>
                                                            </button>
                                                            <button
                                                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                                style={{ background: 'transparent' }}
                                                                onClick={() => handleDeleteHoldProduct(product._id, heldProducts, setHeldProducts)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    <div className="flex justify-end mt-4">
                                        <button
                                            className="px-4 py-2 bg-red-500 text-white rounded-md"
                                            onClick={() => handleHoldOpen(setIsHoldList)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-2 m-2 w-[65px] h-[65px] border bg-[#44BC8D] rounded-[10px] flex items-center justify-center">
                            <button onClick={() => handlePopupOpen(setIsPopupOpen)}>
                                <img className="w-[45px] h-[45px]" src={pro} alt="" />
                            </button>
                        </div>

                        <div className="p-2 m-2 w-[65px] h-[65px] border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                            <Link to={'/viewSale'}>
                                <img className="w-[45px] h-[45px]" src={SL_R} alt="" />
                            </Link>
                        </div>

                        {/* Popup for POS Close */}
                        {isPopupOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                <div className="bg-white w-[400px] h-[260px] p-8 rounded-xl shadow-lg flex flex-col justify-between">
                                    <div className="text-center">
                                        <h2 className="text-2xl text-gray-800 font-bold mb-2">Closing POS</h2>
                                        <p className="text-gray-800 text-base py-6">Are you sure you want to close the register?</p>
                                    </div>

                                    <div className="flex justify-center space-x-4 mt-8">
                                        
                                        <button
                                            className="px-4 py-2 button-bg-color text-white rounded-md"
                                            onClick={() => {
                                                console.log('POS closed');
                                                handleRegisterReportOpen(setIsPopUpRegisterReport, setIsPopupOpen);
                                            }}
                                        >
                                            Confirm
                                        </button>

                                        <button
                                            className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                                            onClick={() => handlePopupClose(setIsPopupOpen)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Popup Register report*/}
                        {isPopUpRegisterReport && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                <div className="bg-white
                                md:w-[75%] lg:h-[700px]   
                                lg:w-[70%] lg:h-[680px] 
                                xl:w-[64%] xl:h-[670px]
                                2xl:w-[60%] xl:h-[650px] 
                                p-6 rounded-md shadow-lg">
                                    <h2 className="text-xl text-gray-800 font-semibold">Register Report</h2>
                                    {loading ? (
                                        <p>Loading</p>
                                    ) : registerData.length > 0 ? (
                                        <div className="overflow-x-auto scroll-container pl-6 pr-6 pt-2 pb-1">
                                            <table className="min-w-full bg-white border border-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Time</th>
                                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">user</th>
                                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash hand in</th>
                                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {registerData.map((reg) => (
                                                        <tr key={reg._id}>
                                                            <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900"><p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">{reg.openTime}</p></td>
                                                            <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900">{reg.username || 'Unknown'}</td>
                                                            <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900">{reg.name}</td>
                                                            <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900"> <p className="rounded-[5px] text-center py-[6px] bg-blue-100 text-blue-500">{currency} {formatWithCustomCommas(reg.cashHandIn)}</p></td>
                                                            <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900"> <p className="rounded-[5px] text-center py-[6px] bg-green-100 text-green-500">{currency} {formatWithCustomCommas(reg.totalBalance)}</p></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) :
                                        null}
                                    <div className="overflow-x-auto pl-6 pr-6 pt-2 pb-4">
                                        <div className='flex gap-2'>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Total Discount : </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formatWithCustomCommas(totalDiscountAmount || 0)}
                                                        className="w-full border border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    />
                                                    <span className="absolute rounded-l-lg left-[1px] p-3 bg-gray-100 top-1/2 transform -translate-y-1/2">{currency}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Cash : </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formatWithCustomCommas(cashPaymentAmount || 0)}
                                                        className="w-full border border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    />
                                                    <span className="absolute rounded-l-lg left-[1px] p-3 bg-gray-100 top-1/2 transform -translate-y-1/2">{currency}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Card : </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formatWithCustomCommas(cardPaymentAmount || 0)}
                                                        className="w-full border border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    />
                                                    <span className="absolute rounded-l-lg left-[1px] p-3 bg-gray-100 top-1/2 transform -translate-y-1/2">{currency}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Bank Transfer : </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formatWithCustomCommas(bankTransferPaymentAmount || 0)}
                                                        className="w-full border  border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                    />
                                                    <span className="absolute rounded-l-lg left-[1px] p-3 bg-gray-100 top-1/2 transform -translate-y-1/2">{currency}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="justify-left sw-4/4 overflow-x-auto pl-6 pr-6 pt-2 pb-4">
                                        <h1 className='text-left pb-2 semibold'>Handle Cash Balancing</h1>
                                        <div className='flex bg-opacity-50 bg-gray-100 pl-6 pr-6 pt-2 pb-4 rounded-xl'>
                                            <div className='flex w-[40%]'>
                                                <div className='gap flex flex-col'>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">20 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount20"
                                                            value={inputs.amount20}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">50 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount50"
                                                            value={inputs.amount50}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">100 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount100"
                                                            value={inputs.amount100}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">500 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount500"
                                                            value={inputs.amount500}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">1000 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount1000"
                                                            value={inputs.amount1000}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">5000 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount5000"
                                                            value={inputs.amount5000}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                </div>

                                                <div className='ml-5 gap flex flex-col'>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">1 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount1"
                                                            value={inputs.amount1}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">2 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount2"
                                                            value={inputs.amount2}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">5 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount5"
                                                            value={inputs.amount5}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <label className="mr-2">10 x </label>
                                                        <input
                                                            type="number"
                                                            name="amount10"
                                                            value={inputs.amount10}
                                                            onChange={handleInputChange}
                                                            className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='ml-10 justify-end gap'>
                                                <div className='flex flex-col justify-end relative'>
                                                    <label className="mb-2 text-left">Total Cash</label>
                                                    <div className="relative w-[170px]">
                                                        <span className="absolute rounded-l-lg left-2 top-1/2 transform -translate-y-1/2 text-gray-500">{currency}</span>
                                                        <input
                                                            type="text"
                                                            value={formatWithCustomCommas(calculateTotal())}
                                                            readOnly
                                                            className="w-full border border-gray-300 px-3 py-2 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='ml-4'>
                                                <div className={`flex flex-col justify-end relative ${'2xl:flex xl:flex lg:block md:block'}`}>
                                                    <label className="mb-2 text-left">Cash Variance</label>
                                                    <div className="relative w-[170px]">
                                                        <span className="absolute rounded-l-lg left-2 top-1/2 transform -translate-y-1/2 text-gray-500">{currency}</span>
                                                        <input
                                                            type="text"
                                                            value={formatWithCustomCommas(Math.max(0, cashPaymentAmount - calculateTotal()))}
                                                            readOnly
                                                            className="w-full border border-gray-300 px-3 py-2 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='ml-4 md:hidden lg:hidden xl:block 2xl:block'>
                                                <div className="p-2 m-2 w-[65px] h-[63px] pb-2 border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                                                    <button onClick={toggleCalculator}>
                                                        <img className="w-[45px] h-[45px]" src={Cal} alt="Calculator" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mt-2 ml-5">
                                        <button
                                            className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                                            onClick={() => handleRegisterReportClose(setIsPopupOpen)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 button-bg-color text-white rounded-md"
                                            onClick={() => {
                                                console.log('POS closed');
                                                handlePOSClose(setIsPopupOpen, navigate);
                                            }}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-2 m-2 w-[65px] h-[65px]  border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                            <button className='' onClick={handleFullScreen}>
                                <img className="w-[45px] h-[45px]" src={Full} alt="" />
                            </button>
                        </div>


                        <div className="p-2 m-2 w-[65px] h-[65px] pb-2 border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                            <button onClick={toggleCalculator}>
                                <img className="w-[45px] h-[45px]" src={Cal} alt="Calculator" />
                            </button>
                        </div>


                        <div className="p-2 m-2 w-[65px] h-[65px]  pb-2 border bg-[#1A5B63]  rounded-[10px] flex items-center justify-center">
                            <button onClick={() => setIsExitingPopupOpen(true)} className="focus:outline-none">
                                <img className="w-[45px] h-[45px]" src={Back} alt="Back" />
                            </button>
                        </div>
                        {/* The Popup modal */}
                        {isExitingPopupOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                <div className="bg-white w-[400px] h-[260px] p-8 rounded-xl shadow-lg flex flex-col justify-between">
                                    <div className="text-center" >
                                    <h2 className="text-2xl text-gray-800 font-bold mb-2">Exiting POS</h2>
                                    <p className="text-gray-800 text-base py-6">Do you want to exit without closing the POS?</p>
                                    </div>
                                    <div className="flex justify-center space-x-4 mt-8">
                                        
                                        {/* Confirm button */}
                                        <button
                                            className="px-4 py-2 button-bg-color text-white rounded-md"
                                            onClick={handleExitingFromPos}
                                        >
                                            Confirm
                                        </button>

                                        {/* Cancel button */}
                                        <button
                                            className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                                            onClick={() => handleExitingPopupClose(setIsExitingPopupOpen)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN BODY SECTION */}
            {/* Produc billing section in right */}
            <div className="flex justify-between mt-2 w-full h-screen ">
                <div className="w-[35%] h-screen rounded-[15px] bg-white p-2">
                    <div>
                        <BillingSection
                            productBillingHandling={productBillingHandling}
                            setProductBillingHandling={setProductBillingHandling}
                            handleDeleteHoldProduct={handleDeleteHoldProduct}
                            setProductData={setProductData}
                            selectedCustomer={selectedCustomer}
                            setSelectedCustomer={setSelectedCustomer}
                            warehouse={warehouse}
                            setReloadStatus={setReloadStatus}
                            setHeldProductReloading={setHeldProductReloading}
                            setSelectedCategoryProducts={setSelectedCategoryProducts}
                            setSelectedBrandProducts={setSelectedBrandProducts}
                            setSearchedProductData={setSearchedProductData}
                            setError={setError}
                        />
                    </div>
                </div>

                <div className="w-[64.8%] ml-2 rounded-[15px] h-screen bg-white">
                    {/* Brands selection section */}
                    <ProductFilters setFilters={setFilters} setLoading={setLoading} />
                    <div className='h-32 sm:mt-40 md:mt-0 xl:mt-0 xxl:mt-0 '>
                        {/* Brands selection section */}
                        <div id="brands-scroll-container" className="flex space-x-2 overflow-x-scroll scrollbar-hide smooth-scroll my-2 mx-2" onWheel={(e) => handleHorizontalScroll(e, 'brands-scroll-container')}>
                            <div className="flex space-x-2">
                                {/* All Brands Button */}
                                <button
                                    onClick={() => {
                                        setSelectedBrand(null); // Set to null for "All Brands"
                                        if (warehouse) {
                                            fetchProductDataByWarehouse(
                                                warehouse,
                                                setProductData,
                                                setSelectedCategoryProducts,
                                                setSelectedBrandProducts,
                                                setSearchedProductData,
                                                setLoading
                                            );
                                        }
                                    }}
                                    className={`p-2.5 rounded-lg px-4 flex-shrink-0 flex flex-col items-center justify-center transition-colors ${selectedBrand === null ? 'custom text-white' : 'bg-gray-200 text-gray-900'
                                        }`}
                                >
                                    <h3 className="text-center text-m font-medium">All Brands</h3>
                                </button>


                                {loading ? (
                                    <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                                        <LinearProgress />
                                    </Box>
                                ) : (
                                    filters.brands.map((b) => (
                                        <button
                                            key={b._id}
                                            onClick={() => {
                                                setSelectedBrand(b.brandName); // Update selected brand
                                                fetchBrandData(b.brandName, setSelectedBrandProducts, setSelectedCategoryProducts, setSearchedProductData, setProgress);
                                            }}
                                            className={`flex-shrink-0 border border-gray-200 rounded-lg px-4 flex flex-col items-center justify-center hover:shadow-md ${selectedBrand === b.brandName ? 'custom text-white' : 'bg-gray-200 text-gray-900'
                                                }`}
                                        >
                                            <h3 className="text-center text-m font-medium">{b.brandName}</h3>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Category selection section */}
                        <div
                            id="categories-scroll-container" className="flex space-x-2 overflow-x-scroll scrollbar-hide smooth-scroll mx-2 my-4 pt-1"
                            onWheel={(e) => handleHorizontalScroll(e, 'categories-scroll-container')}
                        >
                            <div className="flex space-x-4 w-[200px]">
                                {/* All Category Button */}
                                <button onClick={() => {
                                    setSelectedCategory(null);
                                    if (warehouse) {
                                        fetchProductDataByWarehouse(
                                            warehouse,
                                            setProductData,
                                            setSelectedCategoryProducts,
                                            setSelectedBrandProducts,
                                            setSearchedProductData,
                                            setLoading
                                        );
                                    }
                                }}
                                    className={`p-2.5 rounded-lg px-4 flex-shrink-0 flex flex-col items-center justify-center transition-colors ${selectedCategory === null ? 'custom text-white' : 'bg-gray-200 text-gray-900'
                                        }`}>
                                    <h3 className="text-center text-m font-medium">All Categories</h3>
                                </button>
                                {loading ? (
                                    <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                                        <LinearProgress />
                                    </Box>
                                ) : (
                                    filters.categories.map((c) => (
                                        <button
                                            key={c._id}
                                            onClick={() => {
                                                setSelectedCategory(c.category);
                                                fetchCategoryData(c.category, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setProgress);
                                            }}
                                            className={`flex-shrink-0 border border-gray-200 rounded-lg px-4 flex flex-col items-center justify-center hover:shadow-md ${selectedCategory === c.category ? 'custom text-white' : 'bg-gray-200 text-gray-900'
                                                }`}
                                        >
                                            <h3 className="text-center text-m font-medium">{c.category}</h3>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Product data display section */}
                    {progress ? (
                        <div className="grid gap-y-2 gap-x-1 sm:gap-y-3 sm:gap-x-2 md:gap-y-4 md:gap-x-2 lg:gap-y-4 lg:gap-x-3 xl:gap-y-4 xl:gap-x-4 px-[10px] bg-white"
                            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(176px, 1fr))' }}>
                            <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                                <LinearProgress />
                            </Box>
                            {Array(20).fill().map((_, index) => (
                                <div key={index} className="w-[176px] rounded-[15px]">
                                    <Skeleton height={176} width={176} className="rounded-[15px]" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="xl:h-[500px] 2xl:h-[700px] lg:h-[600px] md:h-[500px] overflow-y-auto scroll-container">
                            {!selectedWarehouseAccess ? (
                                <p className='text-center mt-5 text-gray-700'>You don't have access to this warehouse.</p>
                            ) : combinedProductData.length > 0 ? (

                                <div className={`
                                    grid px-2 bg-white gap-y-4 gap-x-0
                                    sm:grid-cols-5 
                                    md:grid-cols-5 
                                    lg:grid-cols-6 
                                    xl:grid-cols-7
                                  `}
                                    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(175px, 0.75fr))` }}>
                                    {(searchedProductDataByName.length > 0 ? searchedProductDataByName : combinedProductData).map((p) => {
                                        const warehouseName = p.warehouse ? Object.keys(p.warehouse)[0] : null;
                                        const warehouseData = warehouseName ? p.warehouse[warehouseName] : null;
                                        const isSelectable = canSelectProduct(warehouseName);

                                        const productQtyForSelectedWarehouse = getQtyForSelectedWarehouse(p, warehouse);
                                        return (
                                            <div
                                                key={p._id}
                                                className={`shadow-md hover:shadow-lg w-[176px] h-[176px] border border-gray-200 rounded-lg p-4 flex flex-col items-center ${isSelectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                                onClick={isSelectable ? () => {
                                                    playSound();
                                                    handleAddingProduct({
                                                        id: p._id,
                                                        name: p.name,
                                                        price: getPriceRange(p),
                                                        productCost: getProductCost(p),
                                                        stokeQty: warehouseData ? warehouseData.productQty || getQty(p) : 0,
                                                        tax: getTax(p),
                                                        discount: getDiscount(p),
                                                        ptype: p.ptype,
                                                        warranty: p.warranty,
                                                        warehouse: p.warehouse || {},
                                                        variation: p.variation,
                                                        variationType: p.variationType || "Unknown",
                                                        variationValues: warehouseData ? warehouseData.variationValues || {} : {},
                                                    });
                                                } : undefined}
                                            >
                                                <img
                                                    src={p.image || ProductIcon}
                                                    alt={p.name}
                                                    className="w-[62px] h-[62px] object-cover rounded-md mt-1"
                                                />
                                                <h3 className="mt-1 text-center text-m font-medium text-gray-900 text-[13px]">
                                                    {p.name}
                                                </h3>
                                                <p className="text-center text-xs text-gray-600">{p.code}</p>
                                                <div className="flex space-between items-center text-left mt-[2px]">
                                                    <p className="bg-blue-600 mr-1 text-left px-1 py-[1.5px] rounded-[5px] text-center text-[11px] text-white">
                                                        {productQtyForSelectedWarehouse}{' ' + p.saleUnit}
                                                    </p>
                                                    <p className="bg-blue-400 px-2 py-[1.5px] rounded-[5px] text-center text-[11px] text-white">
                                                        {currency + ' ' + formatWithCustomCommas(getPriceRange(p))}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className='text-center mt-5 text-gray-700'>You don't have access to this warehouse.</p>
                            )}
                        </div>
                    )}

                    {/* VARIATION */}
                    <div>
                        {selectVariation && (
                            <ProductVariationModal
                                selectedProduct={selectedProduct}
                                setSelectVariation={setSelectVariation}
                                productBillingHandling={productBillingHandling}
                                setProductBillingHandling={setProductBillingHandling}
                                setProductKeyword={setProductKeyword}
                                inputRef={inputRef}
                            />
                        )}
                    </div>

                    {/* CALCULATOR */}
                    {showCalculator && (
                        <Draggable>
                            <div className="fixed top-0 right-0 p-4 z-50 rounded-lg">
                                <Calculator />
                                <button onClick={toggleCalculator} className="flex relative bottom-[95px] mt-5 ml-12 mt-4 bg-gray-200 p-2 rounded-lg hover:bg-gray-300">
                                    Close
                                </button>
                            </div>
                        </Draggable>
                    )}
                </div>
            </div>
            <div>
                {errorMessage && <p className="button-bg-color mt-5 text-center">{errorMessage}</p>}
            </div>
        </div >
    );
}
export default PosSystemBody;
