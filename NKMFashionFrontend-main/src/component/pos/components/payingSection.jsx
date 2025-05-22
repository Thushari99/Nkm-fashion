import { useState, useEffect, useRef, } from "react";
import { fetchAllData } from "../utils/fetchAllData";
import axios from "axios";
import { handleSave } from '../../sales/SaleController'
import { decryptData } from '../../utill/encryptionUtils';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';

const PayingSection = ({ handlePopupClose, totalItems, totalPcs, profit, tax, shipping, discount, productDetails, handleBillReset, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setProductData, selectedCustomer, discountType, warehouse, responseMessage, setResponseMessage, setReloadStatus, offerPercentage, calculateTotalPrice, setError, setProgress, setSelectedOffer }) => {
    const [receivedAmount, setReceivedAmount] = useState('');
    const [returnAmount, setReturnAmount] = useState('');
    const [paymentType, setPaymentType] = useState('cash');
    const [note, setNote] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const printRef = useRef();
    const [registerData, setRegisterData] = useState('');
    const date = new Date().toISOString().split('T')[0];
    const totalPrice = calculateTotalPrice();
    const [decryptedUser, setDecryptedUser] = useState(null);
    const [preFix, setPreFix] = useState('');
    const [loading, setLoading] = useState(false);
    const { currency } = useCurrency();
    const [invoiceData, setInvoiceData] = useState([]);
    const [printTrigger, setPrintTrigger] = useState(false);
    const [amounts, setAmounts] = useState({ cash: '', card: '', bank_transfer: '', });
    const [validationFailed, setValidationFailed] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState(null);
    const [isPrintReady, setIsPrintReady] = useState(false);
    const [settings, setSettings] = useState({
        companyName: '',
        companyMobile: '',
        companyAddress: '',
        logo: '',
        email: '',
        currency: '',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
                setSettings({
                    companyName: data.companyName || '',
                    companyMobile: data.companyMobile || '',
                    companyAddress: data.address || '',
                    logo: data.logo || '',
                    email: data.email || '',
                    currency: data.currency || '',
                });
            } catch (error) {
                console.error("[DEBUG] Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleAmountChange = (type, value) => {
        setAmounts(prevState => {
            const updatedAmounts = {
                ...prevState,
                [type]: value
            };
            console.log("Updated amounts:", updatedAmounts);
            return updatedAmounts;
        });
    };

    const calculateTotalReceivedAmount = () => {
        const { cash, card, bank_transfer } = amounts;
        return parseFloat(cash || 0) + parseFloat(card || 0) + parseFloat(bank_transfer || 0);
    };
    const totalReceivedAmount = calculateTotalReceivedAmount();

    const calculateBalance = () => {
        const totalPrice = parseFloat(calculateTotalPrice()) || 0;
        const totalPaid = Object.values(amounts).reduce((acc, amount) => acc + (parseFloat(amount) || 0), 0);
        const balance = totalPrice - totalPaid;
        return isNaN(balance) ? "0.00" : balance.toFixed(2);
    };

    const validatePaymentStatus = () => {
        const totalPrice = parseFloat(calculateTotalPrice()) || 0;
        const totalPaid = Object.values(amounts).reduce((acc, amount) => acc + (parseFloat(amount) || 0), 0);
        const balance = totalPrice - totalPaid;
        const normalizedPaymentStatus = paymentStatus?.toLowerCase();

        if (normalizedPaymentStatus === 'paid' && balance > 0) {
            alert("Payment status is 'Paid', but there's still a balance remaining. Please adjust the payment amount.");
            setProgress(false);
            setValidationFailed(true); // Set validation failure
            return false;
        }

        setValidationFailed(false); // Reset if validation passes
        return true;
    };

    useEffect(() => {
        const totalAmount = calculateTotalPrice();
        const calculatedReturnAmount = totalReceivedAmount - totalAmount;
        setReturnAmount(calculatedReturnAmount.toFixed(2));
    }, [totalReceivedAmount, calculateTotalPrice]);

    const handlePrintAndClose = () => {
        setReloadStatus(true)
        setReceivedAmount('');
        setReturnAmount('');
        setPaymentType('cash');
        setNote('');
        setPaymentStatus('paid');
        handleBillReset();
        handlePopupClose();
    };

    useEffect(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const user = decryptData(encryptedUser);
                setDecryptedUser(user);
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
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
            console.log(preFix)
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


    const updateProductQuantities = async (productDetails, shouldPrint = false) => {
        try {
            setSelectedOffer('');
            const reStructuredProductDetails = productDetails.map(product => {
                const name = product.name;
                const _id = product.currentID;
                const ptype = product.ptype;
                const discount = product.discount;
                const selectedVariation = product.variation;
                const price = product.price;
                const barcodeQty = product.qty || 1;
                const orderTax = product.tax;
                const specialDiscount = product.specialDiscount || 0;

                return {
                    name,
                    _id,
                    ptype,
                    discount,
                    specialDiscount,
                    selectedVariation,
                    price,
                    barcodeQty,
                    orderTax,
                };
            });

            const selectedProduct = reStructuredProductDetails;
            const paymentTypesArray = Object.keys(amounts).reduce((acc, type) => {
                if (Number(amounts[type]) > 0) {
                    acc[type] = amounts[type];
                }
                return acc;
            }, {});

            const result = await handleSave(
                calculateTotalPrice(),
                profit,
                "ordered",
                'paid',
                paymentTypesArray,
                amounts,
                shipping,
                discountType,
                discount,
                tax,
                warehouse ? warehouse : 'Unknown',
                selectedCustomer ? selectedCustomer : 'Unknown',
                selectedProduct,
                date,
                preFix,
                offerPercentage,
                setInvoiceNumber,
                setResponseMessage,
                setError,
                setProgress,
                setInvoiceData,
                note,
                calculateBalance(),
                handlePrintAndClose,
                shouldPrint
            );
            console.log("type of setProgress", setProgress);
            await fetchAllData(setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading, setError);
            return;
        } catch (error) {
            console.error('Error updating product quantities:', error);
        }
    };

    const handleSubmitPayment = async (shouldPrint) => {
        if (!validatePaymentStatus()) return;
    
        try {
            await updateProductQuantities(productDetails, shouldPrint); // Pass shouldPrint
            if (shouldPrint) {
                setPrintTrigger(true);
                await fetchAllData(setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading, setError);
            } else {
                handlePopupClose();
                await fetchAllData(setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading, setError);
            
            }
            setSelectedOffer('');
        } catch (error) {
            console.error('Error updating product quantities:', error);
        }
    };

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findRegisterData`);
                if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                    const name = response.data.data[0].name;
                    setRegisterData(name);
                } else {
                    console.error('Data array is empty or not found.');
                    setRegisterData('');
                }
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError('Failed to fetch report data');
            }
        };
        fetchReportData();
    }, []);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onBeforeGetContent: () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 300);
            });
        },
        onAfterPrint: () => {
            setPrintTrigger(false);
            handlePopupClose();
        }
    });

    useEffect(() => {
        if (invoiceData.invoiceNumber && printTrigger) {
            const observer = new MutationObserver((mutationsList) => {
                console.log('MutationObserver triggered', mutationsList);
                setIsPrintReady(true);
                observer.disconnect();
            });

            if (printRef.current) {
                observer.observe(printRef.current, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
            } else {
                console.warn('printRef.current is null!');
            }
            return () => observer.disconnect();
        }
    }, [invoiceData, printTrigger]);

    useEffect(() => {
        if (invoiceData.invoiceNumber && printTrigger) {
            const timeout = setTimeout(() => {
                handlePrint();
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [invoiceData, printTrigger]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-[1200px] h-[700px] p-6 rounded-md shadow-lg z-50">
                <h2 className="text-xl font-semibold">Make Payment</h2>
                <div className="flex mt-4">
                    <div>
                        <div className='flex'>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Paying Amount:</label>
                                <input
                                    type="text"
                                    placeholder="Paying Amount"
                                    value={calculateTotalPrice()}
                                    className="block w-[300px] rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Payment Status:</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="block w-[300px] ml-10 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option>Paid</option>
                                    {/* <option>Unpaid</option> */}
                                </select>
                            </div>
                        </div>
                        <div className="w-full text-center mt-8">
                            <label className="text-sm font-medium leading-6 text-gray-900 mb-2 text-left">
                                Payment Type:
                            </label>
                        </div>
                        <div className="w-full">
                            <div className="bg-gray-100 border border-gray-400 shadow-md rounded-lg p-4">
                                <h2 className="text-lg text-gray-800 mb-3">Add Payment Details</h2>
                                <table className="w-full border border-gray-300 rounded-lg bg-white shadow-sm">
                                    <tbody>
                                        {['cash', 'card', 'bank_transfer'].map((type, index) => (
                                            <tr key={index} className="border-t border-gray-300 hover:bg-gray-100">
                                                <td className="px-4 py-4 font-medium text-gray-700 border border-gray-300 bg-gray-200">
                                                    {type === 'cash' ? 'Cash' : type === 'card' ? 'Card' : 'Bank Transfer'}
                                                </td>
                                                <td className="px-4 py-1 border border-gray-300">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={amounts[type]}
                                                            onChange={(e) => handleAmountChange(type, e.target.value)}
                                                            placeholder="Enter amount"
                                                            className="block w-full rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-xs text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-500 focus:outline-none sm:text-sm"
                                                        />
                                                        <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                                                            {currency}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Balance Field Row */}
                                        <tr className="border-t border-gray-300 hover:bg-gray-100">
                                            <td colSpan="2" className="px-4 py-4 text-right font-semibold text-gray-700 border border-gray-300">
                                                Balance: {currency} {formatWithCustomCommas(calculateBalance())}
                                            </td>
                                        </tr>

                                        {/* Note Field Row */}
                                        <tr className="border-t border-gray-300 hover:bg-gray-100">
                                            <td className="px-4 py-4 font-medium text-gray-700 border border-gray-300 bg-gray-200">
                                                Note
                                            </td>
                                            <td className="px-4 py-1 border border-gray-300">
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="Enter any additional notes..."
                                                    className="block w-full h-[50px] rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-500 focus:outline-none sm:text-sm"
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button
                                    className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                                    onClick={handlePopupClose}
                                    type="button"
                                >
                                    Cancel
                                </button>

                                <button
                                    className="px-4 py-2 mr-2 button-bg-color text-white rounded-md"
                                    onClick={() => handleSubmitPayment(false)}
                                    type="button"
                                >
                                    Submit Payment
                                </button>

                                <button
                                    className="px-4 py-2 button-bg-color text-white rounded-md"
                                    onClick={() => handleSubmitPayment(true)}
                                    type="button"
                                >
                                    Submit & Print Bill
                                </button>

                            </div>
                        </div>

                    </div>

                    <div className='mt-0 ml-10 w-[500px]'>
                        <label className="block text-sm font-medium leading-6 text-gray-900 mb-4">Summary of Sale:</label>
                        <table className="min-w-[450px] border border-gray-300 rounded-lg">
                            <tbody>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Total Products</td>
                                    <td className="px-2 py-2 text-sm text-left text-gray-600 border border-gray-300">{totalItems}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Total Amount</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{formatWithCustomCommas(calculateTotalPrice())}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Order Tax</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{tax}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Discount</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{discount}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Shipping</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{shipping}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Grand Total</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{formatWithCustomCommas(calculateTotalPrice())}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ visibility: "hidden", position: "absolute", top: 0, left: 0 }}>
                            <div ref={printRef} className="p-2 pb-10 pt-8 bg-white text-gray-800 border border-gray-300 w-[80mm]">
                                <div className="print-container">
                                    {/* Company Header Section */}
                                    <div className="text-center mb-4">
                                        <h1 className="text-2xl font-bold pb-1">{settings.companyName || 'Your Company Name'}</h1>
                                        <p className="text-xs">{settings.companyAddress || 'Company Address'}</p>
                                        <p className="text-xs">{settings.companyMobile || 'Phone: XXX-XXX-XXXX'}</p>
                                    </div>

                                    {/* Invoice Meta Data */}
                                    <div className="flex justify-between text-xs mb-2">
                                        <p className="flex">SALESMAN: {invoiceData.cashierUsername}</p>
                                        <p className="flex">RECEIPT NO: {invoiceData.invoiceNumber}</p>
                                    </div>

                                    {/* Divider */}
                                    <p className="w-full m-0 p-0 border-b border-dashed border-gray-400"></p>

                                    {/* Customer Details */}
                                    <div className="my-2 text-xs">
                                        <p>Date: {invoiceData.date}</p>
                                        <p>Customer: {invoiceData.customer}</p>
                                        <p>Payment Status: {invoiceData.paymentStatus}</p>
                                    </div>

                                    {/* Products Table */}
                                    <table className="w-full text-xs mt-2" style={{ borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr className="">
                                                <th className="text-left py-0.5">
                                                    <div className="flex items-center">PRODUCT</div>
                                                </th>
                                                <th className="text-left py-0.5">
                                                    <div className="flex items-center">PRICE</div>
                                                </th>
                                                <th className="text-left py-0.5">
                                                    <div className="flex items-center">QTY</div>
                                                </th>
                                                <th className="text-right py-0.5">
                                                    <div className="flex justify-end items-center">AMOUNT</div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceData.productsData?.map((product, index) => (
                                                <tr key={product.currentID || index} className="">
                                                    <td className="py-0.5 text-left">
                                                        <div className="flex items-center">{product.name}</div>
                                                    </td>
                                                    <td className="py-0.5 text-left">
                                                        <div className="flex items-center">{formatWithCustomCommas(product.price)}</div>
                                                    </td>

                                                    <td className="py-0.5 text-center">
                                                        <div className="flex justify-center items-center">{product.quantity}</div>

                                                    </td>
                                                    <td className="py-0.5 text-right">
                                                        <div className="flex justify-end items-center">{formatWithCustomCommas(product.subtotal)}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>

                                    {/* Payment Summary */}
                                    <div className="mt-2 text-xs">
                                        <div className="flex justify-between">
                                            <span>Sale Total:</span>

                                            <span> {formatWithCustomCommas(invoiceData.grandTotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Discount:</span>
                                            <span> {formatWithCustomCommas(invoiceData.discount ? invoiceData.discount : 0.00)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Balance:</span>
                                            <span> {formatWithCustomCommas(invoiceData.cashBalance ? invoiceData.cashBalance : 0.00)}</span>

                                        </div>
                                    </div>

                                    <div className="flex mt-2 text-xs">
                                        <span>Note:</span>
                                        <span>{invoiceData.note}</span>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="mt-2 text-xs">
                                        <p className="border-t border-dashed border-gray-400 pt-2">Payment Details:</p>
                                        {invoiceData.paymentType?.map((payment, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span>{payment.type}:</span>
                                                <span>{currency} {formatWithCustomCommas(payment.amount)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Section */}
                                    <div className="mt-2 text-center text-xs">
                                        <p className="border-t border-dashed border-gray-400 pt-2">
                                            *** EXCHANGE OF PRODUCTS IN RE-SALEBALE CONDITION WITH RECEIPT AND THE PRICE TAG IS POSSIBLE WITHIN 07 DAYS ***<br />
                                            THANK YOU FOR SHOPPING WITH US!<br /><br />
                                            System by IDEAZONE
                                        </p>

                                        {/* Barcode Centered */}
                                        <div className="flex justify-center mt-2">
                                            <Barcode
                                                value={invoiceData.invoiceNumber}
                                                width={1.5}
                                                height={40}
                                                fontSize={16}
                                                className="m-0 p-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="flex relative justify-center mt-2 ml-0 mr-0 text-center">
                    {responseMessage && (
                        <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                            {responseMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayingSection;