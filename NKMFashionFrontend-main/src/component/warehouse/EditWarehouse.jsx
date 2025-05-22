import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../../styles/dashboardBody.css';
import HouseIcon from '../../img/warehouse.png';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { isValidMobileInput, isAllowedKey } from '../utill/MobileValidation';
import { toast } from 'react-toastify';

function EditWarehouseBody() {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        zip: '',
        mobile: '',
        country: '',
        city: '',
        address: '',
        manager: '',
        location: ''
    });
    const [errors, setErrors] = useState({});
    const [responseMessage, setResponseMessage] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const mobileRegex = /^\+94\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        const fetchWarehouseData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, {
                    params: { id }, // Pass `id` as a query parameter
                });

                const fetchedData = response.data;
                setFormData(fetchedData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching warehouse data:', error);
                setErrors(prevErrors => ({ ...prevErrors, general: 'Failed to fetch warehouse data.' }));
                setLoading(false);
            }
        };

        fetchWarehouseData();
    }, [id]);

    const handleZipChange = (e) => {
        const value = e.target.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData((prevState) => ({
            ...prevState,
            zip: numericValue
        }));
    };

    // Handle keydown event to restrict invalid keys
        const handleKeyDown = (e) => {
            const key = e.key;
            if (!isAllowedKey(key)) {
                e.preventDefault();
            }
        };

    // Handle input field values
    const handleChange = (e) => {
        const { name, value } = e.target;
    
        if (name === 'mobile') {
            if (isValidMobileInput(value)) {
                setFormData((prevData) => ({ ...prevData, [name]: value }));
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    mobile: '',
                }));
            } else {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    mobile: 'Invalid characters. Only digits and "+" are allowed.',
                }));
            }
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };
    

    // Validate required fields
    const validateFields = () => {
        const newErrors = {};
        if (!formData.username) newErrors.username = 'Username is required.';
        if (!formData.mobile) newErrors.mobile = 'Mobile number is required.';
        if (!formData.name) newErrors.name = 'Name is required.';
        if (!formData.country) newErrors.country = 'Country is required.';
        if (!formData.city) newErrors.city = 'City is required.';
        if (!formData.manager) newErrors.manager = 'Manager is required.';
        if (!formData.location) newErrors.location = 'Location is required.';
        if (!formData.address) newErrors.address = 'Address is required.';
        return newErrors;
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!mobileRegex.test(formData.mobile)) {
            newErrors.mobile = 'Invalid mobile number format. Format: +94xxxxxxxxx';
        }

        if (!emailRegex.test(formData.username)) {
            newErrors.username = 'Invalid email format. Example: user@gmail.com';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setResponseMessage('');
        const validationErrors = validateFields();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const formDataToSubmit = {
            id,
            username: formData.username.toLowerCase(),
            name: formData.name,
            zip: formData.zip,
            mobile: formData.mobile,
            country: formData.country,
            city: formData.city,
            manager: formData.manager,
            location: formData.location,
            address: formData.address,
        };

        setLoading(true);
        axios.put(`${process.env.REACT_APP_BASE_URL}/api/editWarehouseByAdmin`, formDataToSubmit)
            .then(response => {
                if (response.data && response.data.status === 'success') {
                    console.log('Warehouse updated successfully:', response.data);
                    toast.success(
                        'Warehouse updated successfully.',
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                    navigate('/viewWarehouse');
                } else {
                    toast.error(
                        'Update was not successful. Please try again.',
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                }
            })
            .catch(error => {
                console.error('Error updating warehouse:', error);
                let errorMessage = 'Failed to update warehouse. Please try again.';

                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.request) {
                    errorMessage = 'No response from server. Please check your internet connection.';
                }

            toast.error(
                errorMessage,
                { autoClose: 2000, className: "custom-toast" }
            );
                
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Clear all fields except the profileImage
    const handleClear = () => {
        setFormData({
            username: '',
            name: '',
            zip: '',
            mobile: '',
            country: '',
            city: '',
            manager: '',
            location: '',
            address: ''
        });
        setErrors({});
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
            {loading && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Edit Warehouse</h2>
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
                                        id="username"
                                        name="username"
                                        type="email"
                                        placeholder='sample@gmail.com'
                                        value={formData.username}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                    {errors.username && <p className="text-red-500">{errors.username}</p>}
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
                                        value={formData.country}
                                        onChange={handleChange}
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
                                        value={formData.city}
                                        onChange={handleChange}
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
                                        placeholder='88512-96152'
                                        value={formData.location}
                                        onChange={handleChange}
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
                                        required
                                        placeholder='No 46, Rock view Garden Thennekumbura'
                                        value={formData.address}
                                        onChange={handleChange}
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
                                        value={formData.name}
                                        onChange={handleChange}
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
                                        value={formData.manager}
                                        onChange={handleChange}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* zip code field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Zip code <span className='text-red-500'>*</span></label>
                                    <input
                                        id="dob"
                                        name="zip"
                                        type="text"
                                        required
                                        placeholder='21300'
                                        value={formData.zip}
                                        onChange={handleZipChange}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Mobile number field */}
                                <div className="mt-5">
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Mobile number <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        id="mobile"
                                        name="mobile"
                                        type="text"
                                        required
                                        placeholder='+94 xx xxxx xxx'
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        maxLength={12}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                    {errors.mobile && <p className="text-red-500">{errors.mobile}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-10 justify-start '>
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
                    {errors.general && <p className="text-red-500 text-center mt-5 px-5 py-2 rounded-md  bg-red-100  mx-auto max-w-sm">{errors.general}</p>}
                    {responseMessage && <p className="text-color text-center mt-5 px-5 py-2 rounded-md  bg-green-100  mx-auto max-w-sm">{responseMessage}</p>}
                </div>
            </div>
        </div>
    );
}

export default EditWarehouseBody;
