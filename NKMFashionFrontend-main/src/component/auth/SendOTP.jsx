import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from "react-router-dom";
import CryptoJS from 'crypto-js';
import Back from '../../img/back.png';
import '../../styles/tailwind.css';
import '../../styles/login.css';
import { useLogo } from '../../context/logoContext';

function SendOTP() {
    //Geting and setting values and status
    const location = useLocation();
    const navigate = useNavigate();
    const { encryptedOTP, encryptedUsername, expiresAt } = location.state || {};
    const [OTP, setOTP] = useState('');
    const [error, setError] = useState('');
    const [decryptedOTP, setDecryptedOTP] = useState('');
      const { logo } = useLogo(); 

    //Getting encrypted OTP
    useEffect(() => {
        if (encryptedOTP) {
            try {
                //Decrypting the OTP
                const bytes = CryptoJS.AES.decrypt(encryptedOTP, 'zxcvb');
                const otp = bytes.toString(CryptoJS.enc.Utf8);
                setDecryptedOTP(otp);
            } catch (error) {
                console.error('Error decrypting OTP:', error);
            }
        }
    }, [encryptedOTP]);

    //Handle submitting
    const handleSubmit = (event) => {
        event.preventDefault();
        const currentTime = Date.now();
        if (currentTime > expiresAt) {
            setError('OTP has expired. Please request a new one.');
            return;
        }

        if (OTP === decryptedOTP) {
            navigate('/newpassword', { state: { encryptedUsername } });
        } else {
            setError('Invalid OTP. Please try again.');
        }
        console.log(encryptedUsername)
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
                        <h2 className="mt-0 text-center text-2xl font-bold leading-4 tracking-tight text-gray-800">
                            Resetting Password
                        </h2>
                    </div>
                    <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Enter OTP:
                                </label>

                                {/* Get OTP from user */}
                                <div className="mt-2">
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="password"
                                        required
                                        placeholder="* * * * * *"
                                        value={OTP}
                                        onChange={(e) => setOTP(e.target.value)}
                                        className="pass block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:outline-none focus:ring-2 focus:ring-[#35AF87] sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                            <div className="flex w-full justify-center">
                                <button
                                    type="submit"
                                    className="submit flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Reset Password
                                </button>
                            </div>
                            <div className="backIconDiv flex justify-center">
                                <Link to={'/forgetpassword'}>
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
        </div>
    );
}

export default SendOTP;
