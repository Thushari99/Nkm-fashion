import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import AOS from 'aos';
import 'aos/dist/aos.css'
import arrow from '../../img/swipe-right.png';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import '../../styles/tailwind.css';
import '../../styles/login.css';

function PrefixSettingsInitiate() {
    // State management for each input field
    const [salePrefix, setSalePrefix] = useState('');
    const [saleReturnPrefix, setSaleReturnPrefix] = useState('');
    const [purchasePrefix, setPurchasePrefix] = useState('');
    const [purchaseReturnPrefix, setPurchaseReturnPrefix] = useState('');
    const [expensePrefix, setExpensePrefix] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');
    const navigate = useNavigate();

    // Load settings when the component mounts
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getRefixSettings`);
            // Optionally populate the fields if data is retrieved
            if (data) {
                setSalePrefix(data.salePrefix || '');
                setSaleReturnPrefix(data.saleReturnPrefix || '');
                setPurchasePrefix(data.purchasePrefix || '');
                setPurchaseReturnPrefix(data.purchaseReturnPrefix || '');
                setExpensePrefix(data.expensePrefix || '');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('')
        setResponse('')
        const formData = {
            salePrefix,
            saleReturnPrefix,
            purchasePrefix,
            purchaseReturnPrefix,
            expensePrefix,
        };
        setLoading(true)
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createOrUpdatePrefixSettings`, formData);
            setResponse(response.data.message);
            sessionStorage.clear();
            navigate('/');
        } catch (error) {
            console.error('Error saving data:', error);

            // Check if the error has a response object and display the message from the server
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    setError(error.response.data.message);
                } else {
                    setError(`Server responded with status: ${error.response.status}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                setError('No response from the server. Please check your internet connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('An unexpected error occurred while setting up the request.');
            }
        } finally {
            setLoading(false); // Reset loading state after the request is complete
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
                <div className='background-white relative  w-[70%] min-h-[100vh] p-5'>
                    <div className='flex justify-between'>
                        <div>
                            <h2 className="text-lightgray-300 mt-[70px] p-0 text-2xl">Prefix Settings</h2>
                        </div>
                    </div>
                    <div className="bg-white mt-[20px] pb-2 w-full rounded-2xl px-8 shadow-sm" data-aos="fade-left">
                        <div className="flex flex-1 flex-col px-2 py-12 lg:px-8">
                            <form onSubmit={handleSubmit}>
                                <div className="flex w-full space-x-5">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Sale</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="SALE"
                                            value={salePrefix}
                                            onChange={(e) => setSalePrefix(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Sale Return</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="SALE RETURN"
                                            value={saleReturnPrefix}
                                            onChange={(e) => setSaleReturnPrefix(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                                <div className="flex w-full space-x-5 mt-10">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Purchase</label>
                                        <input
                                            type="text"
                                            placeholder="PURCHASE"
                                            value={purchasePrefix}
                                            onChange={(e) => setPurchasePrefix(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Purchase Return</label>
                                        <input
                                            type="text"
                                            placeholder="PURCHASE RETURN"
                                            value={purchaseReturnPrefix}
                                            onChange={(e) => setPurchaseReturnPrefix(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                                <div className="flex w-full space-x-5 mt-10">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Expense</label>
                                        <input
                                            type="text"
                                            placeholder="EXPENSES"
                                            value={expensePrefix}
                                            onChange={(e) => setExpensePrefix(e.target.value)}
                                            className="block w-[49%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                                <div className="container mx-auto text-right">
                                    <div className='mt-5 flex justify-end'>
                                        <div>
                                            <img src={arrow} className="w-10 h-10 mt-10 mr-10 animate-moveRight" alt="arrow" />
                                        </div>
                                        <button className='submit text-white rounded-md mt-10' type='submit'>
                                            Save & Logout
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Error and Response Messages */}
                            <div className='mt-5'>
                                {error && (
                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                        {error}
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

export default PrefixSettingsInitiate;
