import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import avatarIcon from '../../img/gift.png';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';
import { decryptData } from '../utill/encryptionUtils';

function CreateOffers() {
    // State management
    const [offerName, setOfferName] = useState('')
    const [endDate, setDate] = useState('')
    const [percentage, setPercentage] = useState(0);
    const [createdBy, setDecryptedUser] = useState(null);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);
        setError('');

        if (!offerName || offerName.trim() === '') {
            toast.error('Offer name is required.', { autoClose: 2000, className: "custom-toast" });
            setProgress(false);
            return;
        }
        if (!percentage || isNaN(percentage) || percentage < 0 || percentage > 100) {
            toast.error('Percentage must be a valid number between 0 and 100.', { autoClose: 2000, className: "custom-toast" });
            setProgress(false);
            return;
        }
        if (!createdBy || createdBy.trim() === '') {
            toast.error('Created by field is required.', { autoClose: 2000, className: "custom-toast" });
            setProgress(false);
            return;
        }

        const offerData = {
            endDate, percentage, offerName, createdBy
        };

        try {
            const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createOffer`, offerData);
            if (result.data.status === 'success') {
                toast.success(
                    "Offer created successfully!",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                navigate('/viewOffers');
            } else {
                toast.error(
                    'User not added: ' + result.data.message,
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                )
            }
        } catch (error) {
            if (error.response) {
                toast.error(
                    'Server error: ' + error.response.data.message || 'An error occurred, please try again later.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            } else if (error.request) {
                toast.error(
                    'Network error: Please check your internet connection.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            } else {
                // Unknown error
                toast.error(
                    'Unexpected error: ' + error.message,
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            }
        } finally {
            setProgress(false);
        }
    };

    useEffect(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const user = decryptData(encryptedUser);
                setDecryptedUser(user.username);
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

    // Handle clear operation
    const handleClear = () => {
        setOfferName('');
        setPercentage('');
        setDate('')
        setError('');
        setResponseMessage('');
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5'>
            <div className='flex justify-between items-center'>
                {progress && (
                    <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                        <LinearProgress />
                    </Box>
                )}
                <div>
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Create Offers</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewOffers'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[670px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <div className="flex items-center justify-left">
                        <img className='w-[40px] h-[40px] rounded mb-5' src={avatarIcon} alt="icon" />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/*offername field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Offer Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="name"
                                        name="name"
                                        required
                                        placeholder='Family Offer'
                                        value={offerName}
                                        onChange={(e) => setOfferName(e.target.value)}
                                        autoComplete="email"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        End Date Date
                                    </label>
                                    <div className="">
                                        <input
                                            id="date"
                                            name="date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setDate(e.target.value)}
                                            autoComplete="given-name"
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                {/* percentage name field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Percentage <span className='text-red-500'>*</span></label>
                                    <input
                                        id="percentage"
                                        name="percentage"
                                        type="number"
                                        required
                                        placeholder='10%'
                                        value={percentage}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                const numericValue = parseFloat(value);
                                                if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
                                                    setPercentage(value);
                                                }
                                            }
                                        }}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button type='submit' className="button-bg-color  button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px]  focus:ring-gray-500 focus:ring-offset-2"
                                    onClick={handleClear}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Error and Response Messages */}
                    {error && (
                        <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                            {error}
                        </p>
                    )}
                    {responseMessage && (
                        <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                            {responseMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CreateOffers;
