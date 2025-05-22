import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import CryptoJS from 'crypto-js';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import '../../styles/tailwind.css';
import '../../styles/login.css';
import { toast } from 'react-toastify';
import { useLogo } from '../../context/logoContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(false);
    const [isPOS, setIsPOS] = useState();
    const { setUserData, clearUserData } = useContext(UserContext);
    const { logo } = useLogo(); 
    const navigate = useNavigate();
    let logoutTimer;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setProgress(true);

        // Encrypting the username and password
        const normalizedUsername = username.toLowerCase(); 
        const userKey = process.env.REACT_APP_USER_KEY;
        const secretKey = process.env.REACT_APP_SECRET_KEY;
        const encryptedPassword = CryptoJS.AES.encrypt(password, secretKey).toString();
        const encryptedUsername = CryptoJS.AES.encrypt(normalizedUsername, userKey).toString();
        const userData = { encryptedUsername, encryptedPassword };

        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/login`, userData);
            if (response.data.token) {
                const { token, encryptedToken, hasRequiredData } = response.data;

                // Clear any existing user data before setting new data
                sessionStorage.clear();
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('encryptedToken', encryptedToken);
                sessionStorage.setItem('isPOS', isPOS);

                // Decode the token to get expiration time
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000; 
                const expirationTime = decodedToken.exp;

                sessionStorage.setItem('expirationTime', expirationTime.toString());
                const timeUntilExpiration = (expirationTime - currentTime) * 1000; // Convert to milliseconds
                logoutTimer = setTimeout(() => {
                    alert('Session expired. Logging out.');
                    handleLogout();
                }, timeUntilExpiration);

                try {
                    console.log("[DEBUG] Fetching settings...");
                    const settingsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
                    
                    if (settingsResponse.data.defaultWarehouse) {
                        sessionStorage.setItem("defaultWarehouse", settingsResponse.data.defaultWarehouse);
                        console.log("[DEBUG] Default Warehouse set:", settingsResponse.data.defaultWarehouse);
                    } else {
                        console.warn("[DEBUG] No default warehouse found in settings.");
                    }
                } catch (settingsError) {
                    console.error("[DEBUG] Error fetching settings:", settingsError);
                }

                // Set user data in context
                await setUserData(token);

                // Navigate based on hasRequiredData value
                if (hasRequiredData) {
                    toast.success(
                                "Logged in successfully!",
                                { autoClose: 500 },
                                { className: "custom-toast" }
                            );
                    navigate('/dashboard');
                } else {
                    navigate('/settingsInitiate'); // Navigate to a different route if hasRequiredData is false
                }
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (error) {
            if (error.response) {
                // Server responded with a status code outside the 2xx range
                console.error('Error response:', error.response);

                switch (error.response.status) {
                    case 400:
                        setError('Invalid username or password.');
                        break;
                    case 401:
                        setError('Invalid username or password.');
                        break;
                    case 404:
                        setError('User not found.');
                        break;
                    case 500:
                        setError('Server error. Please try again later.');
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.');
                }
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('No response received from server. Please check your network connection.');
            } else {
                console.error('Request setup error:', error.message);
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setProgress(false);
        }
    };

    useEffect(() => {
        const expirationTime = sessionStorage.getItem('expirationTime');
        if (expirationTime) {
            const currentTime = Date.now() / 1000; // Current time in seconds
            if (currentTime >= expirationTime) {
                // Token has expired
                alert('Session expired. Logging out.');
                handleLogout();
            } else {
                // Set a timer to auto-logout when the token expires
                const timeUntilExpiration = (expirationTime - currentTime) * 1000; // Convert to milliseconds
                logoutTimer = setTimeout(() => {
                    alert('Session expired. Logging out.');
                    handleLogout();
                }, timeUntilExpiration);
            }
        }
    
        // Clear the timer on component unmount
        return () => {
            if (logoutTimer) {
                clearTimeout(logoutTimer);
            }
        };
    }, []);
    
    const handleLogout = () => {
        if (logoutTimer) {
            clearTimeout(logoutTimer);
        }
        clearUserData();
        sessionStorage.clear();
        navigate('/');
    };
    
    useEffect(() => {
        return () => {
            if (logoutTimer) {
                clearTimeout(logoutTimer);
            }
        };
    }, []);
    
    return (
        <div className="w-full min-h-screen flex items-center justify-center background-white px-6 py-12 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-full background-white flex items-center justify-center px-6 py-12 lg:px-8">
                <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[30%] max-h-[590px] min-h-[490px] overflow-hidden bg-white p-[60px_30px] rounded-[15px] shadow-md flex flex-col justify-between relative">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm m-0 p-0">
                        <img
                            alt="Your Company"
                            src={logo}
                            className="mx-auto h-24 w-auto m-0 p-0 "
                        />
                        <h2 className="mb-4 text-center text-2xl font-bold leading-9 tracking-tight text-gray-800">
                            Sign in to your account
                        </h2>
                    </div>

                    <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Email address
                                </label>
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
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                        Password
                                    </label>
                                    <div className="text-sm">
                                        <Link
                                            to={`/forgetpassword`}
                                            className="forgotPass font-semibold text-indigo-600 hover:text-indigo-500"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="x  x  x  x  x  x"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        className="pass block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:outline-none focus:ring-2 focus:ring-[#35AF87] sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                            <div className="flex w-full justify-center">
                                <button
                                    type="submit"
                                    className="submit flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Login
                                </button>
                            </div>
                            <div className="h-[20px] flex items-center justify-center">
                                {error && <h2 className="text-red-700 text-center">{error}</h2>}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
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

export default Login;
