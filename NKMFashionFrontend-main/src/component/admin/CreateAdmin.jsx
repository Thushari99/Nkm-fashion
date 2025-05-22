import React, { useState} from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function CreateAdminBody() {
    // State management
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('admin');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();

        // Email validation
        if (!username.includes('@gmail.com')) {
            setError('Username must be a valid email address with @gmail.com');
            return;
        }

        // Role validation
        if (role === "#") {
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
            username,
            role,
            firstName,
            lastName,
            mobile
        };

        // Axios request to add user
        axios.post(`${process.env.REACT_APP_BASE_URL}/api/addUser`, userData)
            .then(result => {
                if (result.data.status === "success") {
                    toast.success(
                                "User added successfully!",
                                { autoClose: 2000 },
                                { className: "custom-toast" }
                            );
                } else {
                     toast.error("Error adding user" ,
                                { autoClose: 2000 },
                                { className: "custom-toast" });
                }
            })
            .catch(error => {
                toast.error("Error adding user" + error.message ,
                    { autoClose: 2000 },
                    { className: "custom-toast" });
            });
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
        <div className='bg-[#eff3f7] absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5'>
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 ml-4 m-0 p-0 text-2xl">Create Admin</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#37b34a] text-[#37b34a] rounded-md transition-colors duration-300 hover:bg-[#37b34a] hover:text-white' to={'/dashboard'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[600px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <div className="flex items-center justify-center">
                        <img className='w-[120px] h-[120px] rounded mb-10' src='https://jingslearning.com/media/images/login-user-head.png' alt="icon" />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* First name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">First Name</label>
                                    <div className="mt-2">
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
                                </div>

                                {/* Username field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Enter the Email</label>
                                    <div className="mt-2">
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
                                </div>

                                {/* Role field */}
                                {/* <div className="mt-5">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select user role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option value="#">#Select Role</option>
                                    {jobRoles.map((jobRole, index) => (
                                        <option key={index} value={jobRole}>{jobRole}</option>
                                    ))}
                                </select>
                            </div> */}
                            </div>
                            <div className="flex-1">
                                {/* Last name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Last Name</label>
                                    <div className="mt-2">
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
                                </div>

                                {/* Mobile number field */}
                                <div className="mt-5">
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Mobile number
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="mobile"
                                            name="mobile"
                                            type="text"
                                            required
                                            placeholder='+94 xx xxxx xxx'
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='mt-10'>
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
                    </form>

                    {/* Error and Response Messages */}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {responseMessage && <p className="text-color text-center">{responseMessage}</p>}
                </div>
            </div>
        </div>
    );
}

export default CreateAdminBody;
