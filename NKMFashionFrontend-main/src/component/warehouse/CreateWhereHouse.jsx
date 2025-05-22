import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HouseIcon from '../../img/warehouse.png';
import '../../styles/role.css';
import { isAllowedKey, isValidMobileInput } from '../utill/MobileValidation';

function CreateWhereHouseBody() {
    // State management
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [zip, setZip] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [manager, setManager] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState("");
    const [responseMessage, setResponseMessage] = useState("");
    const navigate = useNavigate();
    const [progress, setProgress] = useState(false);

    const handleZipChange = (e) => {
        const value = e.target.value;
        // Remove any non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        setZip(numericValue);
    };

    //Handle submit 
    const handleSubmit = (event) => {
        event.preventDefault();
        setError("");
        setResponseMessage("");
        setProgress(true);

        // Email validation
        const normalizedUsername = username.toLowerCase();
        if (normalizedUsername.length > 0) {
            if (!username.includes('@')) {
                setError('Username must be a valid email address containing "@"');
                setProgress(false);
                return;
            }
        }

        // Username number validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(username)) {
            setError('Invalid Username format : sample@gmail.com')
            setProgress(false);
            return;

        }
        // Mobile number validation
        const mobileRegex = /^\+94\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            setError('Invalid mobile number. Format: +94xxxxxxxxx');
            setProgress(false);
            return;
        }

        // Check for other required fields
        const requiredFields = ['name', 'zip', 'country', 'city', 'address', 'manager', 'location'];
        const missingFields = requiredFields.filter(field => !eval(field));
        if (missingFields.length > 0) {
            setError(
                `${missingFields.map(field => field.charAt(0).toUpperCase() + field.slice(1)).join(', ')} is required`
            );
            setProgress(false);
            return;
        }

        setError('');

        const warehouseData = {
            username:normalizedUsername,
            name,
            zip,
            country,
            city,
            mobile,
            manager,
            location,
            address,
        };

        // Axios request to add the warehouse
        axios
            .post(`${process.env.REACT_APP_BASE_URL}/api/createWherehouse`, warehouseData)
            .then(result => {
                toast.success(
                    result.data.message,
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                console.log('response: ', result.data);
                navigate('/viewWarehouse');
            })
            .catch(error => {
                setProgress(false);
                console.error("Error adding warehouse:", error);
                if (error.response && error.response.data && error.response.data.message) {
                    toast.error(
                        error.response.data.message,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                } else {
                    toast.error(
                        "Error: Warehouse not added",
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                }
            })
            .finally(() => {
                setProgress(false);
            });
    };

    // Handle clear operation
    const handleClear = () => {
        setUsername('');
        setName('');
        setZip('');
        setCountry('');
        setCity('');
        setMobile('');
        setAddress('');
        setManager('');
        setLocation('');
        setError('');
        setResponseMessage('');
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Wherehouse</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewWarehouse'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[800px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <div className="flex items-center justify-center">
                        <img className='w-[120px] h-[120px] rounded mb-10' src={HouseIcon} alt="icon" />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Username field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Enter the Email <span className='text-red-500'>*</span></label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder='sample@gmail.com'
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="email"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                                {error.username && <p className="text-red-500">{error.username}</p>}

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

                                {/* Location field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Location <span className='text-red-500'>*</span></label>
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        required
                                        placeholder='03231-6569'
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
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

                                {/* Manager field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Manager Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="manager"
                                        name="manager"
                                        type="text"
                                        required
                                        placeholder='John'
                                        value={manager}
                                        onChange={(e) => setManager(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Zip field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Zip code <span className='text-red-500'>*</span></label>
                                    <input
                                        id="text"
                                        name="zip"
                                        type="text"
                                        required
                                        value={zip}
                                        placeholder='21300'
                                        onChange={handleZipChange}
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
                    <div className="mt-5">
                        {error && (
                            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                {error}
                            </p>
                        )}
                        {responseMessage && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center mx-auto max-w-sm inline-block">
                                {responseMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateWhereHouseBody;
