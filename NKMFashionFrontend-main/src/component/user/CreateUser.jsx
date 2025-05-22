import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import avatarIcon from '../../img/profile.png';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';

function CreateUserBody() {
    // State management
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [jobRoles, setJobRoles] = useState([]); // State for job roles
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();

    // Fetch job roles on component mount
    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getJobRoles`);
                setJobRoles(response.data.jobRoles);
            } catch (err) {
                console.error('Error fetching job roles:', err);
                setError('Failed to fetch job roles. Please try again later.');
            }
        };

        fetchJobRoles();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);

        // Email validation
        const normalizedUsername = username.toLowerCase();
        if (!normalizedUsername.includes('@')) {
            setError('Username must be a valid email address containing "@"');
            return;
        }
        // Role validation
        if (role === "#" || !role) {
            setError('Please select a valid role.');
            return;
        }

        // Mobile number validation
        const mobileRegex = /^\+94\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            setError('Invalid mobile number. Format: +94xxxxxxxxx');
            return;
        }

        // Clear the error state before making the request
        setError('');

        const userData = {
            username: normalizedUsername, 
            role,
            firstName,
            lastName,
            mobile
        };

        console.log(userData)
        try {
            const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/addUser`, userData);
            if (result.data.status === 'success') {
                toast.success(
                    "User added successfully!",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                navigate('/users');
            } else {
                // Specific message for mobile number conflict
                if (result.data.message === 'Mobile Number already exists') {
                    toast.error(
                        "Mobile number already exists, please use a different one.",
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                } else {
                    toast.error(
                        'User not added: ' + result.data.message,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                }
            }
        } catch (error) {
            // Handle server or network errors
            if (error.response) {
                // Server returned an error
                toast.error(
                    'Server error: ' + error.response.data.message || 'An error occurred, please try again later.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            } else if (error.request) {
                // No response from server
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
            setProgress(false); // Hide loading bar
        }
    };

    // Handle clear operation
    const handleClear = () => {
        setUsername('');
        setRole('');
        setFirstName('');
        setLastName('');
        setMobile('');
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
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Create User</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/users'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[670px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <div className="flex items-center justify-center">
                        <img className='w-[120px] h-[120px] rounded mb-10' src={avatarIcon} alt="icon" />
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
                                        required
                                        placeholder='sample@gmail.com'
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="email"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Role field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select user role <span className='text-red-500'>*</span></label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    >
                                        <option value="#">#Select Role</option>
                                        {jobRoles.map((jobRole, index) => (
                                            <option key={index} value={jobRole.name}>{jobRole.roleName}</option>
                                        ))}
                                    </select>

                                </div>
                            </div>

                            <div className="flex-1">
                                {/* First name field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">First Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="fname"
                                        name="fname"
                                        type="text"
                                        required
                                        placeholder='Ben'
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Last name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Last Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="lname"
                                        name="lname"
                                        type="text"
                                        required
                                        placeholder='Stokes'
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        autoComplete="family-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Mobile number field */}
                                <div className="mt-5">
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Mobile number <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="mobile"
                                            name="mobile"
                                            type="text"
                                            required
                                            placeholder='+94 xx xxxx xxx'
                                            value={mobile}
                                            maxLength={12}
                                            onChange={(e) => setMobile(e.target.value)}
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

export default CreateUserBody;
