import React, { forwardRef, useState, useEffect } from "react";
import Barcode from "react-barcode";
import { decryptData } from '../../utill/encryptionUtils';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useLogo } from "../../../context/logoContext";
import axios from 'axios';
import { io } from "socket.io-client";
import { generateBillNumber } from "../utils/invoiceNumber";

const currentDate = new Date().toLocaleDateString();
const currentTime = new Date().toLocaleTimeString();

const PrintInvoice = forwardRef((props, ref) => {
    const { invoiceNumber } = props; 
    const [isOn, setIsOn] = useState({
        phone: false,
        customer: false,
        address: false,
        email: false,
        taxDiscountShipping: false,
        barcode: false,
        productCode: false,
        logo: false,
        note: false
    });
    const { currency } = useCurrency();
    const [decryptedUser, setDecryptedUser] = useState(null);
    const [error, setError] = useState('');
    const { logo } = useLogo();

    // New states for fetched settings
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
    }, []); // Runs once on component mount

    useEffect(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const user = decryptData(encryptedUser);
                setDecryptedUser(user);
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
                sessionStorage.removeItem('user');
                return;
            }
        }
    }, []);

    useEffect(() => {
        const fetchReceiptSettings = () => {
            if (!decryptedUser) {
                return;
            }
            const data = decryptedUser.receipts?.[0];
            if (!data) {
                setError('Receipt settings not found');
                return;
            }
            setIsOn({
                phone: data.phone,
                customer: data.customer,
                address: data.address,
                email: data.email,
                taxDiscountShipping: data.taxDiscountShipping,
                barcode: data.barcode,
                productCode: data.productCode,
                logo: data.logo,
                note: data.note
            });
        };
        fetchReceiptSettings();
    }, [decryptedUser]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (

        <div  ref={ref} className="p-2 pb-10 pt-8 bg-white text-gray-800 border border-gray-300 w-[80mm]">
            <div className="print-container">
                {/* Logo section */}
                {isOn.logo ? (
                    <img className="w-8 h-8 mx-auto" src={settings.logo || logo} alt="logo" />
                ) : (
                    <p className="text-center text-sm">Logo not available</p>
                )}

                <h1 className="text-lg font-bold pb-1 text-center">{settings.companyName || 'No name'}</h1>
                <p className="text-center text-xs">{settings.companyAddress || 'No location'}</p>

                {/* Phone Section */}
                <p className="text-center text-xs">
                    {isOn.phone ? settings.companyMobile || 'Phone number not available' : 'Phone number not available'}
                </p>

                <div className="flex mt-2 justify-between">
                    <div>
                        <p className="text-xs text-left">CASHIER : {props.registerData}</p>
                    </div>
                    <div>
                        <p className="text-right text-xs">
                            INVOICE : {isOn.barcode ? (
                                <p className="text-xs text-right">{invoiceNumber}</p>
                            ) : (
                                <p className="text-xs text-right"></p>
                            )}
                        </p>
                    </div>
                </div>

                {/* Product Details Section */}
                <p className="w-full m-0 p-0">--------------------------------</p>
                <div className="mb-1">
                    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th className="text-left text-xs px-1 py-1 w-1/6">Product</th>
                                <th className="text-right text-xs px-1 py-1 w-1/6">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.productDetails.map((product, index) => {
                                const price = parseFloat(product.price) || 0;
                                const qty = parseInt(product.qty, 10) || 0;
                                const tax = parseInt(product.oderTax, 10) || 0;
                                return (
                                    <tr key={index}>
                                        <td className="px-1 text-xs py-1 whitespace-normal break-words align-top">
                                            <p className="m-0 p-0">( {index + 1} ) {product.name}</p>
                                            <p className="m-0 pl-5">{product.code}{'( '} {qty} * {formatWithCustomCommas(price)}  {' )'}</p>
                                        </td>
                                        <td className="px-1 text-xs py-1 text-right align-top">
                                            {currency} {formatWithCustomCommas(product.subTotal)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <p className="w-full mt-1">--------------------------------</p>
                <div className="flex m-1 justify-between">
                    <p className="text-left text-sm font-bold">TOTAL : </p>
                    <p className="text-right text-sm font-bold"> {currency} {' '}{formatWithCustomCommas(props.total)}</p>
                </div>
                <div className="flex m-1 justify-between">
                    <p className="text-left text-sm font-bold">{props.paymentType} : </p>
                    <p className="text-right text-sm font-bold"> {currency} {' '}{formatWithCustomCommas(props.receivedAmount)}</p>
                </div>

                <p className="w-full m-1">--------------------------------</p>
                <div className="flex justify-between">
                    <p className="text-left text-sm font-bold">BALANCE : </p>
                    <p className="text-right text-sm font-bold">{currency} {' '} {props.returnAmount}</p>
                </div>
                <div className="flex mt-1 justify-between">
                    <div>
                        <p className="text-xs text-left">No of Items : {props.totalItems}</p>
                        <p className="text-left text-xs">
                            Date : {currentDate}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-left">No of Pcs : {props.totalPcs}</p>
                        <p className="text-right text-xs">
                            Time : {currentTime}
                        </p>
                    </div>
                </div>

                <p className="w-full mt-1">--------------------------------</p>
                <p className="w-full m-1 text-xs text-center">*** Returns are accepted withing 5 Days ***</p>
                <p className="w-full m-1 text-xs text-center">Thank You Come Again !</p>

                <p className="w-full m-1">--------------------------------</p>

                  {/* Barcode Section */}
                  <div className="w-full flex flex-col items-center mt-2">
                    <Barcode value={invoiceNumber} width={1.5} height={54} fontSize={16} />
                </div>

                <p className="w-full m-1 text-xs text-center">System By IDEAZONE Tel : 0812 121 996</p>
            </div>
        </div>
    );
});

export default PrintInvoice;
