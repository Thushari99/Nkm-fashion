import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function PrefixSettingsBody() {
    // State management for each input field
    const [salePrefix, setSalePrefix] = useState('');
    const [saleReturnPrefix, setSaleReturnPrefix] = useState('');
    const [purchasePrefix, setPurchasePrefix] = useState('');
    const [purchaseReturnPrefix, setPurchaseReturnPrefix] = useState('');
    const [expensePrefix, setExpensePrefix] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');

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
            setError('Error fetching settings');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = {
            salePrefix,
            saleReturnPrefix,
            purchasePrefix,
            purchaseReturnPrefix,
            expensePrefix,
        };
        console.log(formData);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createOrUpdatePrefixSettings`, formData);
            toast.success(
                                        response.data.message,
                                                                 { autoClose: 2000 },
                                                                 { className: "custom-toast" }
                                                               );
            setTimeout(() => {
                window.location.href = '/prefixSettings';
            }, 1000);
        
            // Optionally reset fields after submission
            setSalePrefix('');
            setSaleReturnPrefix('');
            setPurchasePrefix('');
            setPurchaseReturnPrefix('');
            setExpensePrefix('');
        } catch (error) {
            console.error('Error saving data:', error);
            
            // Check if the error has a response object and display the message from the server
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    toast.error(
                                                error.response.data.message,
                                                                         { autoClose: 2000 },
                                                                         { className: "custom-toast" }
                                                                       );
                } else {
                    toast.error(
                                                `Server responded with status: ${error.response.status}`,
                                                                         { autoClose: 2000 },
                                                                         { className: "custom-toast" }
                                                                       );
                }
            } else if (error.request) {
                // The request was made but no response was received
                toast.error(
                    'No response from the server. Please check your internet connection.',
                                             { autoClose: 2000 },
                                             { className: "custom-toast" }
                                           );
            } else {
                // Something happened in setting up the request that triggered an Error
                toast.error(
                   'An unexpected error occurred while setting up the request.',
                                             { autoClose: 2000 },
                                             { className: "custom-toast" }
                                           );
            }
        } finally {
            setLoading(false); // Reset loading state after the request is complete
        }
        
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between'>
                <div>
                    <h2 className="text-lightgray-300 mt-[80px] p-0 text-2xl">Prefix Settings</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#37b34a] text-[#37b34a] rounded-md transition-colors duration-300 hover:bg-[#37b34a] hover:text-white' to={'/viewCustomers'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] pb-2 w-full rounded-2xl px-8 shadow-md">
                <div className="flex flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex w-full space-x-5">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Sale <span className='text-red-500'>*</span></label>
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
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Sale Return <span className='text-red-500'>*</span></label>
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
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Purchase <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    placeholder="PURCHASE"
                                    value={purchasePrefix}
                                    onChange={(e) => setPurchasePrefix(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Purchase Return <span className='text-red-500'>*</span></label>
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
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Expense <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    placeholder="EXPENSES"
                                    value={expensePrefix}
                                    onChange={(e) => setExpensePrefix(e.target.value)}
                                    className="block w-[49%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-5 flex justify-start'>
                                <button className='submit text-white rounded-md mt-10' type='submit'>
                                    Save Settings
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
                        {response && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                                {response}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrefixSettingsBody;
