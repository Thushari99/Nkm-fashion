import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import avatarIcon from '../../img/profile.png';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import {isValidMobileInput,isAllowedKey} from '../utill/MobileValidation';
import { toast } from 'react-toastify';

function CreateCustomerBody() {
    // State management
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [nic, setNIC] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();
    const [responseMessage, setResponseMessage] = useState('');

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true); // Show loading bar

        try {
            // Email validation
            const normalizedUsername = username.toLowerCase();
            if (!normalizedUsername.includes('@')) {
                const errorMsg = 'Username must be a valid email address containing "@"';
                setError(errorMsg);
                console.error(errorMsg);
                return;
            }

            // Mobile number validation
            const mobileRegex = /^\+94\d{9}$/;
            if (!mobileRegex.test(mobile)) {
                const errorMsg = 'Invalid mobile number. Format: +94xxxxxxxxx';
                setError(errorMsg);
                console.error(errorMsg);
                return;
            }

            // NIC validation: Ensure it is exactly 12 characters long
            const newNICRegex = /^\d{12}$/;         // New format: 12 digits only
            const oldNICRegex = /^\d{9}[VXvx]$/;    // Old format: 9 digits + 'V' or 'X'
    
            if (!newNICRegex.test(nic) && !oldNICRegex.test(nic)) {
                const errorMsg = 'NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).';
                setError(errorMsg);
                console.error(errorMsg);
                return;
            }

            // Customer data
            const customerData = {
                username:normalizedUsername,
                name,
                nic,
                country,
                city,
                mobile,
                address,
            };

            // Axios request to add user
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/createCustomer`,
                customerData
            );

            if (response.data && response.data.message) {
                toast.success(
                    response.data.message,
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                setTimeout(() => {
                    navigate('/viewCustomers');
                }, 1000);
                console.log('Success:', response.data.message);
            } else {
                // setResponseMessage('Customer created successfully.');
                 toast.success(
                            "Customer created successfully",
                            { autoClose: 2000 },
                            { className: "custom-toast" }
                        );
                setTimeout(() => {
                    navigate('/viewCustomers');
                }, 1000);
                console.log('Success: Customer created.');
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || 'An error occurred while adding the customer.please try again.';
                 toast.error(errorMessage || "Error creating customer" ,
                            { autoClose: 2000 },
                            { className: "custom-toast" });
            // setError(errorMessage || 'Error creating customer.');
            console.error('Error:', errorMessage, error);
        }
        finally {
            setProgress(false); // Hide loading bar
        }
    };

    // Handle clear operation
    const handleClear = () => {
        setUsername('');
        setName('');
        setNIC('');
        setCountry('');
        setCity('');
        setMobile('');
        setAddress('');
        setError('');
        setResponseMessage('');
        console.log('Form cleared');
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Customer</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewCustomers'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[800px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <div className="flex items-center justify-center">
                        <img className='w-[120px] h-[120px] rounded mb-10' src={avatarIcon} alt="icon" />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Username field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">User Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder='sample@gmail.com'
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="email"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Country field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Country <span className='text-red-500'>*</span></label>
                                    <input
                                        id="country"
                                        name="country"
                                        type="text"
                                        required
                                        placeholder='Sri Lanka'
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* City field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">City <span className='text-red-500'>*</span></label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        required
                                        placeholder='Kandy'
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Address field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Address <span className='text-red-500'>*</span></label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        type="text"
                                        required
                                        placeholder='No 46,Rock view Garden Thennekumbura'
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                            </div>

                            <div className="flex-1">
                                {/* Name field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder='Ben'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Date of Birth field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">NIC <span className='text-red-500'>*</span></label>
                                    <input
                                        id="nic"
                                        name="nic"
                                        type="text"
                                        placeholder='200123456789'
                                        required
                                        value={nic}
                                        onChange={(e) => setNIC(e.target.value)}
                                        maxLength={12}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Mobile number field */}
                                <div className="mt-5">
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Mobile number <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-0">
                                        <input
                                            id="mobile"
                                            name="mobile"
                                            type="text"
                                            required
                                            placeholder='+94 xx xxxx xxx'
                                            value={mobile}
                                            onChange={(e) => {
                                                const inputValue = e.target.value;
                                                if (isValidMobileInput(inputValue)) {
                                                    setMobile(inputValue);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (!isAllowedKey(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            maxLength={12}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button
                                    type='submit'
                                    className={`button-bg-color  button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-50`}
                                >
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

export default CreateCustomerBody;
