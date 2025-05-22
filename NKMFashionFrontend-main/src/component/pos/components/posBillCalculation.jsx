import { useState, useEffect, useRef, useContext } from 'react';
import PayingSection from "./payingSection";
import delSound from '../../../../src/audio/delet pop.mp3';
import axios from 'axios';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { UserContext } from '../../../context/UserContext';
import { toast } from 'react-toastify';

const BillingSection = ({ productBillingHandling, setProductBillingHandling, setProductData, selectedCustomer, setSelectedCustomer, warehouse, setReloadStatus, setHeldProductReloading, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setError }) => {
    const { currency } = useCurrency();
    const [permissionData, setPermissionData] = useState({});
    const { userData } = useContext(UserContext);
    const [productDetailsForPrinting, setProductDetailsForPrinting] = useState([]);
    const [productDetailsForHolding, setProductDetailsForHolding] = useState([]);
    const [refferenceNumber, setRefferenceNumber] = useState('')
    const [showPayingSec, setShowPayingSection] = useState(false)
    const [showProductHolding, setShowProductHolding] = useState(false)
    const [discountType, setDiscountType] = useState('fixed');
    const [discountSymbole, setDiscountSymbole] = useState(currency);
    const [discount, setDiscount] = useState('')
    const [shipping, setShipping] = useState('')
    const [tax, setTax] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [totalPcs, setTotalPcs] = useState(0);
    const [profit, setProfit] = useState(0);
    const [openAuthModel, setOpenAuthModel] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [specialDiscountPopUp, setSpecialDiscountPopUp] = useState(false);
    const [specialDiscount, setSpecialDiscount] = useState(0);
    const [responseMessage, setResponseMessage] = useState('');
    const [selectedProductIndex, setSelectedProductIndex] = useState(null);
    const [offersData, setOffers] = useState([]);
    const [openOffersModel, setOpenOffersModel] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState('');
    const [offerPercentage, setOfferPercentage] = useState(0);
    const [progress, setProgress] = useState(false);
    const adminPasswordRef = useRef(null);
    const discountInputRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(sessionStorage.getItem('isFullscreen'));

    useEffect(() => {
        if (userData?.permissions) {
            setPermissionData(extractPermissions(userData.permissions));
        }
    }, [userData]);

    const extractPermissions = (permissions) => {
        let extractedPermissions = {};

        Object.keys(permissions).forEach((category) => {
            Object.keys(permissions[category]).forEach((subPermission) => {
                extractedPermissions[subPermission] = permissions[category][subPermission];
            });
        });
        return extractedPermissions;
    };

    useEffect(() => {
        if (specialDiscountPopUp) {
            setTimeout(() => {
                adminPasswordRef.current?.focus();
            }, 100);
        }
    }, [specialDiscountPopUp]);

    const handleAddSpecialDiscount = () => {
        if (selectedProductIndex !== null) {
            const updatedProducts = [...productBillingHandling];
            updatedProducts[selectedProductIndex].specialDiscount = parseFloat(specialDiscount) || 0;
            setProductBillingHandling(updatedProducts);
            setSpecialDiscountPopUp(false);
            setSelectedProductIndex(null);

            setTimeout(() => {
                calculateTotalPrice();
                setSpecialDiscount('');
            }, 0);
        }
    };

    useEffect(() => {
        calculateTotalPrice();
    }, [productBillingHandling]);

    const handleDiscountAccess = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }
        const data = { username: username, password: password };
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/getDiscountAccess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const result = await response.json();
            const status = result.status;
            sessionStorage.setItem('status', status);
            if (status === 'success') {
                setSpecialDiscountPopUp(true);
                if (discountInputRef.current) {
                    discountInputRef.current.focus();
                }
                toast.success('Access granted successfully!');
            } else {
                toast.error('Access denied. Please check your credentials.');
            }
            setOpenAuthModel(false);
        } catch (error) {
            console.error('There was a problem with your fetch operation:', error);
            toast.error('An error occurred while processing your request.');
        }
    };

    const fetchOfferData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchOffers`, {
                params: {
                    sort: '-createdAt'
                },
            });
            setOffers(response.data.offers);
        } catch (error) {
            setOffers([]);
        } finally {
            //setLoading(false);
        }
    };
    useEffect(() => {
        fetchOfferData();
    }, []);

    const handleOfferChange = (e) => {
        const selectedOfferId = e.target.value;
        setSelectedOffer(selectedOfferId);

        if (selectedOfferId === '') {
            setSelectedOffer('');
            setOfferPercentage(0);
            setOpenOffersModel(false)
        }
        else {
            const selectedOfferObj = offersData.find(offer => offer.offerName === selectedOfferId);
            if (selectedOfferObj) {
                const percentage = selectedOfferObj.percentage;
                console.log(percentage)
                setOfferPercentage(selectedOfferObj.percentage);
                setOpenOffersModel(false)
            }
        }
    };

    useEffect(() => {
        const fetchReferenceNumber = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/generateHoldReferenceNo`); // Call new API
                if (response.data && response.data.referenceNo) {
                    setRefferenceNumber(response.data.referenceNo);
                }
            } catch (error) {
                console.error('Error generating reference number:', error);
            }
        };

        if (showProductHolding) {
            fetchReferenceNumber();
        }
    }, [showProductHolding]);


    const handleIncrement = (index) => {
        setProductBillingHandling((prev) => {
            const product = prev[index];
            const variation = product.selectedVariation
                ? product.variationValues[product.selectedVariation]
                : null;
            const availableStock = variation ? variation.productQty : product.stokeQty;

            if (product.qty >= availableStock) {
                alert(`Cannot increase more, only ${availableStock} in stock.`);
                return prev;
            }

            return prev.map((p, i) => (i === index ? { ...p, qty: p.qty + 1 } : p));
        });
    };

    const handleQtyChange = (e, index) => {
        const inputValue = e.target.value;
        const newQty = Number(inputValue);
        const product = productBillingHandling[index];
        const variation = product.selectedVariation
            ? product.variationValues[product.selectedVariation]
            : null;
        const availableStock = variation ? variation.productQty : product.stokeQty;

        if (inputValue === "") {
            setProductBillingHandling((prev) =>
                prev.map((p, i) => (i === index ? { ...p, qty: "" } : p))
            );
            return;
        }
        if (isNaN(newQty) || newQty < 1) {
            alert("Quantity must be at least 1.");
            return;
        }
        if (newQty > availableStock) {
            alert(`Cannot enter more than ${availableStock} in stock.`);
            return;
        }
        setProductBillingHandling((prev) =>
            prev.map((p, i) => (i === index ? { ...p, qty: newQty } : p))
        );
    };

    // useEffect for validating quantities when loading held products for editing
    useEffect(() => {
        const adjustQuantitiesForStock = () => {
            setProductBillingHandling((prevProducts) =>
                prevProducts.map((product) => {
                    const variation = product.selectedVariation
                        ? product.variationValues[product.selectedVariation]
                        : null;
                    const availableStock = variation ? variation.productQty : product.stokeQty;
                    if (product.qty > availableStock) {
                        alert(
                            `Quantity for "${product.name}" adjusted to available stock (${availableStock}).`
                        );
                        return { ...product, qty: availableStock };
                    }
                    return product;
                })
            );
        };

        adjustQuantitiesForStock();
    }, []);


    // Handle decrementing the quantity of a product or its variation
    const handleDecrement = (index) => {
        setProductBillingHandling((prev) =>
            prev.map((product, i) => {
                if (i === index && product.qty > 1) {
                    return { ...product, qty: product.qty - 1 };
                }
                return product;
            })
        );
    };

    // Handle deleting a product or its variation from the list
    const handleDelete = (index) => {
        setProductBillingHandling((prev) => prev.filter((_, i) => i !== index));
    };

    //calculating total price
    const calculateTotalPrice = () => {
        let total = productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .reduce((acc, product) => {
                const warehouseData = product.warehouseData || {};
                const price = parseFloat(warehouseData.price) || parseFloat(product.price) || 0;
                const tax = parseFloat(warehouseData.tax) || parseFloat(product.tax) || 0;
                const qty = product.qty || 0;
                const discount = parseFloat(warehouseData.discount) || parseFloat(product.discount) || 0;
                const specialDiscount = parseFloat(product.specialDiscount) || 0;
                const newPrice = price - discount - specialDiscount;

                if (isNaN(newPrice) || isNaN(tax) || isNaN(qty)) {
                    console.warn(`[WARNING] Skipping product due to NaN values: ${product.name}`, { newPrice, tax, qty });
                    return acc;
                }

                const productTotal = (newPrice * qty) + ((price * qty * (tax / 100)));

                return acc + productTotal;
            }, 0);

        let discountAmount = 0;
        if (discountType === 'fixed') {
            discountAmount = parseFloat(discount) || 0;
        } else if (discountType === 'percentage') {
            discountAmount = (total * (parseFloat(discount) || 0) / 100);
        }

        // Apply additional tax
        const taxAmount = (total * (parseFloat(tax) || 0) / 100);
        const shippingCost = parseFloat(shipping) || 0;

        // Apply the offer percentage
        const offerPercentageDecimal = parseFloat(offerPercentage) / 100;
        const offerDiscountAmount = total * offerPercentageDecimal;

        // Update total with discounts and additional costs
        total = total - discountAmount - offerDiscountAmount + taxAmount + shippingCost;

        return isNaN(total) ? "0.00" : total.toFixed(2);
    };

    // useEffect(() => {
    //     const newTotal = calculateTotalPrice();
    //     setTotalPrice(newTotal); // Ensure state updates the total price
    // }, [productBillingHandling]);


    // Function to calculate the profit for a product
    const calculateProfit = () => {
        let pureProfit = productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .reduce((acc, product) => {
                const warehouseData = product.warehouseData || {};
                const price = parseFloat(warehouseData.price) || parseFloat(product.price) || 0;
                const productCost = parseFloat(warehouseData.productCost) || parseFloat(product.productCost) || 0;
                const qty = product.qty || 0;
                const specialDiscount = parseFloat(product.specialDiscount) || 0;
                const discount = parseFloat(warehouseData.discount) || parseFloat(product.discount) || 0;
                const newPrice = price - discount - specialDiscount;

                const totalProductCost = (productCost * qty);
                const subTotal = (newPrice * qty);
                const profitOfProduct = subTotal - totalProductCost;

                return acc + profitOfProduct;
            }, 0);

        const offerPercentageDecimal = parseFloat(offerPercentage) / 100;
        pureProfit = pureProfit - (pureProfit * offerPercentageDecimal);

        setProfit(pureProfit);
        return pureProfit;
    };

    useEffect(() => {
        const calculatedProfit = calculateProfit();
        console.log('Profit Details:', calculatedProfit);
    }, [profit]);

    const calculateTotalItemsAndPcs = () => {
        let itemsCount = 0;
        let pcsCount = 0;
        productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .forEach(product => {
                if (product.qty > 0) {
                    itemsCount += 1;
                    pcsCount += product.qty;
                }
            });
        return { itemsCount, pcsCount };
    };

    useEffect(() => {
        const { itemsCount, pcsCount } = calculateTotalItemsAndPcs();
        setTotalItems(itemsCount);
        setTotalPcs(pcsCount);
    }, [productBillingHandling]);


    // Reset the billing section (clear the cart)
    const handleBillReset = () => {
        setProductBillingHandling([]);
        setDiscount('');
        setShipping('');
        setTax('');
        setSelectedCustomer('')
        sessionStorage.removeItem('status');
    };

    // Close the popup modal
    const handlePopupClose = () => {
        setShowPayingSection(false);
        setShowProductHolding(false)
    };

    // Play the delete sound effect
    const playSound = () => {
        const audio = new Audio(delSound);
        audio.play().catch((error) => console.error('Audio play failed:', error));
    };

    const handleDiscountType = (e) => {
        setDiscountType(e.target.value)
    }
    useEffect(() => {
        if (discountType === 'fixed') {
            return setDiscountSymbole(currency);
        }
        if (discountType === 'percentage') {
            return setDiscountSymbole('%');
        }
    }, [discountType]);

    const handleDiscount = (e) => {
        if (!discountType) {
            alert('Please select a discount type first.');
            return;
        }
        const value = e.target.value;
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }

        setDiscount(value);
    };

    const handleTax = (e) => {
        setTax(e.target.value)
    }
    const handleShippng = (e) => {
        setShipping(e.target.value)
    }

    const gatherProductDetails = () => {
        return productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .map(product => {
                const discount = product.discount || 0;
                const tax = product.tax || 0;
                const subTotal = (((product.price - discount) * product.qty) + ((product.price - discount) * product.qty * (tax) / 100)).toFixed(2);

                return {
                    currentID: product.id,
                    name: product.name,
                    ptype: product.ptype,
                    specialDiscount: product.specialDiscount || 0,
                    warehouse: product.warehouse || {},
                    variation: product.selectedVariation ? product.selectedVariation : null,
                    qty: product.qty,
                    discount: discount,
                    tax: tax,
                    price: product.price,
                    subTotal: subTotal
                };
            });
    };

    const handleHoldingProduct = async () => {
        if (!refferenceNumber || productDetailsForHolding.length === 0) {
            alert('Reference Number and products are required');
            return;
        }

        const dataToSend = {
            referenceNo: refferenceNumber,  // Use the generated reference number
            products: productDetailsForHolding
        };

        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/holdProducts`, dataToSend);

            if (response.status === 201) {
                console.log('Hold successful:', response.data);
                sessionStorage.setItem('heldProducts', JSON.stringify(productDetailsForHolding));

                handleBillReset();  // Reset billing after holding products
                setShowProductHolding(false);  // Close the popup
                setHeldProductReloading(true); // Trigger reloading of held products
            }
        } catch (error) {
            console.error('Error saving held products:', error);
        }
    };


    return (
         <div className=''>
            <div className='flex justify-between h-[100%] overflow-y-auto scroll-container'>
                <h2 className="text-lg font-semibold text-sm mb-4 text-gray-500"> {new Date().toLocaleDateString('en-GB')} - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h2>
                <h2 className="text-lg font-semibold mb-4 text-gray-500">{selectedCustomer}</h2>
            </div>

            <div style={{ minHeight: '250px' }}>
                <div className="overflow-y-auto scroll-container" style={{ maxHeight: '245px' }}>
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Product</th>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Quantity</th>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Price</th>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Sub</th>
                                <th className="px-2 py-2 text-left text-gray-500 text-base text-right">#</th>
                            </tr>
                        </thead>
                        {productBillingHandling.length === 0 ? (
                            <div className="text-center">
                                <p className="text-left pl-4">No products</p>
                            </div>
                        ) : (
                            <tbody>
                                {productBillingHandling.length === 0 ? (
                                    <tr>
                                        <td className="text-center" colSpan="5">
                                            No products selected yet.
                                        </td>
                                    </tr>
                                ) : (
                                    productBillingHandling.slice().reverse().map((product, displayIndex) => {
                                        // Calculate the original index based on the display index
                                        const originalIndex = productBillingHandling.length - 1 - displayIndex;
                                        return (
                                            <tr key={originalIndex} className="border-t">
                                                <td className="px-4 py-2 text-sm font-medium text-left">
                                                    {product.name}
                                                    {/* Show variation info if the product is a Variation type */}
                                                    {product.selectedVariation && (
                                                        <span className="text-gray-500 text-xs ml-1">
                                                            ({product.selectedVariation})
                                                        </span>
                                                    )}
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => {
                                                            const status = sessionStorage.getItem('status');
                                                            if (status === 'success') {
                                                                setSelectedProductIndex(originalIndex);
                                                                setSpecialDiscountPopUp(true);
                                                            } else {
                                                                setSelectedProductIndex(originalIndex);
                                                                setOpenAuthModel(true);
                                                                setUsername('');
                                                                setPassword('');
                                                            }
                                                        }}
                                                    >
                                                        <img
                                                            className="mt-[2px] ml-2 w-[15px] h-[15px]"
                                                            src="https://static-00.iconduck.com/assets.00/edit-icon-512x490-oaajgjo6.png"
                                                            alt="edit"
                                                        />
                                                    </button>
                                                </td>

                                                {/* Quantity Control Section */}
                                                <td className="px-4 py-2 text-sm flex items-center text-left">
                                                    <button
                                                        onClick={() => handleDecrement(originalIndex)}
                                                        className={`px-2 py-1 rounded-md bg-gray-200 text-gray-600`}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        className="w-[30px] text-center mx-2"
                                                        value={product.qty || 1}
                                                        onChange={(e) => handleQtyChange(e, originalIndex)}
                                                    />
                                                    <button
                                                        onClick={() => handleIncrement(originalIndex)}
                                                        className={`px-2 py-1 rounded-md bg-gray-200 text-gray-600`}
                                                    >
                                                        +
                                                    </button>
                                                </td>

                                                {/* Product Price */}
                                                <td className="px-4 py-2 text-sm text-gray-600 text-left">
                                                    {currency} {formatWithCustomCommas(product.price)}
                                                </td>

                                                {/* Total Price = price * qty */}
                                                <td className="px-4 py-2 text-sm text-gray-600 text-left">
                                                    {currency} {formatWithCustomCommas(
                                                        ((product.price - product.discount - (product.specialDiscount || 0)) * product.qty) +
                                                        (((product.price) * product.qty * (product.tax ? product.tax : 0) / 100))
                                                    )}
                                                </td>

                                                {/* Delete Button */}
                                                <td className="px-2 py-2 text-sm text-gray-600">
                                                    <button
                                                        onClick={() => {
                                                            playSound();
                                                            handleDelete(originalIndex);
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div >
            <div className="mt-2">
                <div className="px-4 py-2 text-left text-gray-500 text-base text-xl text-right">
                    <h1>Total Items: {totalItems}</h1>
                </div>
                <div className="px-4 py-2 text-left text-gray-800 text-base text-right">
                    <h1 className="text-3xl">Total : {currency}  {formatWithCustomCommas(calculateTotalPrice())}</h1>
                </div>
            </div>

            {/* Container for Discount, Shipping, and Tax Inputs */}
            <div className={`fixed w-full justify-between mb-1 relative bottom-0 w-[32.5%] z-10 ${isFullscreen === 'true'? 'mt-0' : 'mt-10'}`}>
                <div className="flex gap-2 px-[9px] justify-between py-1 mt-0 w-[100%]">
                    {permissionData.assign_offer && (
                        <div className="flex md:w-1/2 gap-2 py-1 mt-4 w-full">
                            <select
                                onChange={handleDiscountType}
                                className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-3 px-3 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                            >
                                <option value=''>Discount type</option>
                                <option value='fixed'>Fixed</option>
                                <option value='percentage'>Percentage</option>
                            </select>
                        </div>
                    )}
                    {permissionData.assign_offer && (
                        <div className="flex md:w-1/2 py-1 mt-4 w-full">
                            <div className="relative w-full">
                                <input
                                    onChange={handleDiscount}
                                    value={discount}
                                    type="text"
                                    placeholder="Discount"
                                    className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-3 px-2 pr-10 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                                    {discountSymbole}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex w-full gap-2 px-1.5 py-1 mt-0'>
                    {permissionData.assign_offer && (
                        <div className="relative w-[32%]">
                            <button
                                onClick={(e) => setOpenOffersModel(true)}
                                className="w-full bg-white bg-opacity-[1%] submit rounded-md h-[45px] py-2 px-3 pr-10 text-white font-semibold sm:text-sm"
                            >
                                Offers
                            </button>
                        </div>
                    )}
                    <div className="relative w-[32%]">
                        <input
                            onChange={handleTax}
                            value={tax}
                            type="text"
                            placeholder="Tax"
                            className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-3 px-3 pr-10 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                            %
                        </span>
                    </div>

                    <div className="relative w-[32.1%]">
                        <input
                            onChange={handleShippng}
                            value={shipping}
                            type="text"
                            placeholder="Shipping"
                            className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-3 px-3 pr-10 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                            {currency}
                        </span>
                    </div>
                </div>

                {specialDiscountPopUp && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-xs z-[1000]">
                        <div className="bg-white w-[350px] sm:w-[460px] p-6 rounded-2xl shadow-2xl">
                            <h2 className="text-xl font-semibold text-gray-700 text-center mb-6">
                                Add Discount
                            </h2>
                            <div className="relative mb-4">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Amount : </label>
                                <input
                                    type="number"
                                    placeholder="Discount"
                                    value={specialDiscount}
                                    onChange={(e) => setSpecialDiscount(e.target.value)}
                                    ref={discountInputRef} // Set ref
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                    required
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    onClick={handleAddSpecialDiscount}
                                    className="submit w-1/2 mr-2 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSpecialDiscountPopUp(false)}
                                    className="bg-gray-500 w-1/2 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {openAuthModel && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-xs z-[1000]">
                        <div className="bg-white w-[350px] sm:w-[460px] p-6 rounded-2xl shadow-2xl">
                            <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
                                Get access for discount
                            </h2>
                            <label className="block text-left text-sm font-medium text-gray-700">Username</label>
                            <div className="relative mb-4">
                                <input
                                    type="email"
                                    placeholder="hello@gmail.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                    required
                                />
                            </div>

                            <label className="block text-left text-sm font-medium text-gray-700">Admin Password</label>
                            <div className="relative mb-4">
                                <input
                                    type="password"
                                    placeholder="x x x x x x x"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                    required
                                    autoComplete="new-password"
                                    name={`password-${Math.random()}`}
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    onClick={handleDiscountAccess}
                                    className="submit w-1/2 mr-2 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    logging
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenAuthModel(false)}
                                    className="bg-gray-500 w-1/2 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {openOffersModel && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-xs z-[1000]">
                        <div className="bg-white w-[350px] sm:w-[460px] p-6 rounded-2xl shadow-2xl">
                            <button
                                onClick={(e) => setOpenOffersModel(false)}
                                className="flex justify-last bold text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                            <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
                                Select the Offer
                            </h2>
                            <div className="relative mb-4">
                                <label className="block text-left text-sm font-medium text-gray-700">Offer: </label>
                                <select
                                    value={selectedOffer}
                                    onChange={handleOfferChange}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                >
                                    <option value="">Select the Offer</option>
                                    {offersData.map((offer, index) => (
                                        <option key={index} value={offer.id}>
                                            {offer.offerName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons Section */}
                <div className="flex gap-2 px-1.5 py-1 mt-0 w-[100%]">
                    <button
                        onClick={handleBillReset}
                        className="button-dark-color w-[32%] rounded-md px-4 py-3 text-white font-semibold text-sm shadow-md focus:outline-none"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => {
                            const ProductHoldList = gatherProductDetails();
                            if (ProductHoldList.length > 0) {
                                setShowProductHolding(true);
                                setProductDetailsForHolding(ProductHoldList);
                                sessionStorage.removeItem('status');
                            } else {
                                alert('No product data available');
                            }
                        }}
                        className="button-dark-color w-[32%] rounded-md px-4 py-3 text-white font-semibold text-sm shadow-md focus:outline-none"
                    >
                        Hold
                    </button>
                    <button
                        onClick={() => {
                            setShowPayingSection(true);
                            setResponseMessage('')
                            const productDetails = gatherProductDetails();
                            setProductDetailsForPrinting(productDetails);
                            sessionStorage.removeItem('status');
                        }}
                        className="button-bg-color  w-[32%] rounded-md px-4 py-3 text-white font-semibold text-sm shadow-md focus:outline-none"
                    >
                        Pay Now
                    </button>
                </div>
            </div>

            {/* PAYING SECTION */}
            <div>
                {showPayingSec && (
                    <PayingSection
                        handlePopupClose={handlePopupClose}
                        totalItems={totalItems}
                        totalPcs={totalPcs}
                        profit={profit}
                        tax={tax}
                        shipping={shipping}
                        discount={discount}
                        productDetails={productDetailsForPrinting}
                        handleBillReset={handleBillReset}
                        setSelectedCategoryProducts={setSelectedCategoryProducts}
                        setSelectedBrandProducts={setSelectedBrandProducts}
                        setSearchedProductData={setSearchedProductData}
                        setProductData={setProductData}
                        selectedCustomer={selectedCustomer}
                        discountType={discountType}
                        warehouse={warehouse}
                        responseMessage={responseMessage}
                        setResponseMessage={setResponseMessage}
                        setReloadStatus={setReloadStatus}
                        offerPercentage={offerPercentage}
                        calculateTotalPrice={calculateTotalPrice}
                        setError={setError}
                        setProgress={setProgress}
                        setSelectedOffer={setSelectedOffer}
                    />
                )}
            </div>

            {/*PRODUCT HOLDING POP UP*/}
            <div>
                {showProductHolding && productDetailsForHolding && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white w-[600px] h-[700px] p-6 rounded-md shadow-lg z-50">
                            <h1 className='className="text-lg font-semibold'>Hold this product in the list</h1>
                            <div className='mt-5'>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Add a Refference number</label>
                                <input
                                    value={refferenceNumber}
                                    type="text"
                                    readOnly
                                    placeholder="Reference number"
                                    className="block w-full mb-10 mt-2 rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />

                            </div>
                            <table className="w-full table-auto border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="px-4 py-2 border text-left">Product Name</th>
                                        <th className="px-4 py-2 border text-left">Quantity</th>
                                        <th className="px-4 py-2 border text-left">Price</th>
                                        <th className="px-4 py-2 border text-left">Sub Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productDetailsForHolding.map((product, index) => {
                                        const price = parseFloat(product.price) || 0;
                                        const qty = parseInt(product.qty, 10) || 0;
                                        return (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2 border text-left">{product.name}</td>
                                                <td className="px-4 py-2 border text-left">{qty}</td>
                                                <td className="px-4 py-2 border text-left">{currency} {formatWithCustomCommas(price)}</td>
                                                <td className="px-4 py-2 border text-left">{currency} {formatWithCustomCommas((price * qty))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className='flex  mt-5'>
                                <button
                                    className="px-4 py-2  bg-gray-500 text-white rounded-md"
                                    onClick={handlePopupClose}
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleHoldingProduct}
                                    className="submit ml-2 rounded-md px-2 py-2 h-[41px] text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[140px] text-center"
                                >
                                    Hold
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
export default BillingSection;
