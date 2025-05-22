import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Back from '../../img/back.png';
import '../../styles/tailwind.css';
import '../../styles/login.css';
import { useLogo } from '../../context/logoContext';

function ForgetPassword() {
    // Getting and setting values and status
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
      const { logo } = useLogo(); 
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsLoading(true);
        setProgress(true);
        setError(''); // Clear previous errors

        // Encrypting Username
        const normalizedUsername = username.toLowerCase();
        const secretKey = process.env.REACT_APP_USERNAME_ENCRYPTION_KEY;
        const encryptedUsername = CryptoJS.AES.encrypt(normalizedUsername, secretKey).toString();

        const sendData = { encryptedUsername };

        console.log(normalizedUsername)

        // Axios requet for sending username to get the OTP
        axios.post(`${process.env.REACT_APP_BASE_URL}/api/forgetpassword`, sendData)
            .then((result) => {
                setIsLoading(false);
                setProgress(false);

                if (result.data.status === "success") {
                    const code = result.data.otp;
                    const expiresAt = result.data.expiresAt;

                    // Encrypting password reset code
                    const resetCodeSecret = 'zxcvb';
                    const encryptedOTP = CryptoJS.AES.encrypt(code, resetCodeSecret).toString();
                    navigate('/sendOTP', { state: { encryptedOTP, encryptedUsername, expiresAt } });
                } else {
                    // Handle error response from the backend (failure case)
                    setError(result.data.message || 'Unable to send username for password reset');
                }
            })
            .catch((err) => {
                setIsLoading(false);
                setProgress(false);
                console.error('Request failed:', err);

                if (err.response) {
                    // show the backend message
                    setError(err.response.data.message || 'An unexpected error occurred.');
                } else {
                    // For any other error (like network failure), display a generic message
                    setError('Network error: Unable to reach the server.');
                }
            });
    };


    return (
        <div className="w-full h-full min-h-screen flex items-center justify-center background-white px-6 py-12 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-full background-white flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="absolute w-full sm:w-[90%] md:w-[70%] lg:w-[30%] left-1/2 transform -translate-x-1/2 h-[70%] top-[15%] bg-white p-[50px_20px] rounded-[15px] shadow-md">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                        <img
                            alt="Your Company"
                            src={logo}
                            className="mx-auto h-24 w-auto m-0 p-0"
                        />
                        <h2 className="text-center text-2xl font-bold leading-4 tracking-tight text-gray-800">
                            Send the username
                        </h2>
                    </div>
                    <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Email address
                                </label>

                                {/* Get username */}
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="admin@infy-pos.com"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pass block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:outline-none focus:ring-2 focus:ring-[#35AF87] sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                            <div className="flex w-full justify-center">
                                <button
                                    type="submit"
                                    className="submit flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending...' : 'Send code'}
                                </button>
                            </div>
                            <div className="backIconDiv flex justify-center">
                                <Link to={'/'}>
                                    <img className="mt-5 w-7 h-7" src={Back} alt="back" />
                                </Link>
                            </div>

                            {/* Displaying error */}
                            {error && (
                                <h2 className="text-red-700 text-center">
                                    {error}
                                </h2>
                            )}
                        </form>
                    </div>
                </div>
            </div>
            {/* Progress circle */}
            {progress && (
                <div className="absolute top-0 left-0 w-full">
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress />
                    </Box>
                </div>
            )}
        </div>

    );
}

export default ForgetPassword;
