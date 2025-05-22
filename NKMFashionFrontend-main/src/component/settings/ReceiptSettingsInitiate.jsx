import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import AOS from 'aos';
import 'aos/dist/aos.css'
import arrow from '../../img/swipe-right.png';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import '../../styles/tailwind.css';
import '../../styles/login.css';

function ReceiptSettingsInitiate() {
    const [isOn, setIsOn] = useState({
        note: false,
        phone: false,
        customer: false,
        address: false,
        email: false,
        taxDiscountShipping: false,
        barcode: false,
        productCode: false,
        logo: false,
    });
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState('');

    const handleToggle = (key) => {
        setIsOn((prevState) => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    // Load settings when the component mounts
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getReceiptSettings`);
            // Assuming `data` contains the settings directly in the format matching `isOn` state
            setIsOn({
                note: data.note || false,
                phone: data.phone || false,
                customer: data.customer || false,
                address: data.address || false,
                email: data.email || false,
                taxDiscountShipping: data.taxDiscountShipping || false,
                barcode: data.barcode || false,
                productCode: data.productCode || false,
                logo: data.logo || false,
            });

        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('')
        setResponse('')
        const formData = {
            note: isOn.note,
            phone: isOn.phone,
            customer: isOn.customer,
            address: isOn.address,
            email: isOn.email,
            taxDiscountShipping: isOn.taxDiscountShipping,
            barcode: isOn.barcode,
            productCode: isOn.productCode,
            logo: isOn.logo,
        };
        setLoading(true)
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createOrUpdateReceiptSettings`, formData);
            setResponse(response.data.message);
            navigate('/prefixsettingsInitiate');
        } catch (error) {
            console.error('Error saving data:', error);

            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    setError(error.response.data.message);
                } else {
                    setError(`Server responded with status: ${error.response.status}`);
                }
            } else if (error.request) {
                setError('No response from the server. Please check your internet connection.');
            } else {
                setError('An unexpected error occurred while setting up the request.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        AOS.init({
            duration: 1000, // Animation duration in milliseconds
            easing: 'ease-in-out', // Easing function
            once: true, // Whether animation should happen only once
        });
    }, []);

    return (
        <div className="w-full min-h-screen flex items-center justify-center background-white px-6 py-12 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-full background-white flex items-center justify-center px-6 py-12 lg:px-8">
                <div className="background-white relative w-[70%] min-h-[100vh] p-5">
                    <div className="flex justify-between">
                        <h2 className="text-lightgray-300 mt-[80px] p-0 text-2xl">Receipt Settings</h2>
                    </div>
                    <div className="bg-white mt-[20px] pb-2 w-full rounded-md px-8 shadow-md" data-aos="fade-left">
                        <div className="flex flex-1 flex-col px-2 py-12 lg:px-8">
                            <form onSubmit={handleSubmit}>
                                {/* Toggle Buttons */}
                                <div>
                                    <div className="flex flex-wrap w-full gap-10">
                                        {[
                                            { key: 'note', label: 'Show Note' },
                                            { key: 'phone', label: 'Show Phone' },
                                            { key: 'customer', label: 'Show Customer' },
                                            { key: 'address', label: 'Show Address' },
                                            { key: 'email', label: 'Show Email' },
                                            { key: 'taxDiscountShipping', label: 'Show Tax Discount & Shipping' },
                                            { key: 'barcode', label: 'Show Barcode in Receipt' },
                                            { key: 'logo', label: 'Show Logo' },
                                            { key: 'productCode', label: 'Show Product Code' },
                                        ].map(({ key, label }) => (
                                            <div
                                                key={key}
                                                className="flex-1 flex items-center space-x-2 max-w-[30%] min-w-[30%]"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(key)}
                                                    className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${isOn[key] ? 'button-bg-color' : 'bg-gray-400'
                                                        }`}
                                                >
                                                    <div
                                                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${isOn[key] ? 'translate-x-6' : 'translate-x-0'
                                                            }`}
                                                    ></div>
                                                </button>
                                                <label className="text-sm font-medium leading-6 text-left text-gray-900">
                                                    {label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>


                                {/* Submit Button */}
                                <div className="container mx-auto text-right">
                                    <div className="mt-5 flex justify-end">
                                        <div>
                                            <img src={arrow} className="w-10 h-10 mt-10 mr-10 animate-moveRight" alt="arrow" />
                                        </div>
                                        <div>
                                            <button
                                                className="submit text-white rounded-md mt-10 w-20 px-4 py-2 bg-blue-500 hover:bg-blue-700 transition"
                                                type="submit"
                                                disabled={loading}
                                            >
                                                {loading ? 'Saving...' : 'Next'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Error and Response Messages */}
                            <div className="mt-5">
                                {error && (
                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                        {error}
                                    </p>
                                )}
                                {response && (
                                    <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                                        {response}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {loading && (
                    <div className="absolute top-0 left-0 w-full">
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress />
                        </Box>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReceiptSettingsInitiate;
