import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import '../../styles/tailwind.css';
import '../../styles/login.css';
import { useLogo } from '../../context/logoContext';

function NewPassword() {
    const location = useLocation();
    const { encryptedUsername } = location.state || {};
    const [decryptedUsername, setDecryptedUsername] = useState('');
    const [firstPassword, setFirstPassword] = useState('');
    const [secondPassword, setSecondPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { logo } = useLogo();

    useEffect(() => {
        if (encryptedUsername) {
            try {
                const bytes = CryptoJS.AES.decrypt(encryptedUsername, 'pgdftrshj');
                const username = bytes.toString(CryptoJS.enc.Utf8);
                setDecryptedUsername(username);
            } catch (error) {
                console.error('Error decrypting username:', error);
            }
        }
    }, [encryptedUsername]);

    useEffect(() => {
        if (firstPassword && secondPassword) {
            if (firstPassword !== secondPassword) {
                setError('Passwords do not match!');
            } else {
                setError('');
            }
        }
    }, [firstPassword, secondPassword]);


    const validatePasswordStrength = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
        return regex.test(password);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (firstPassword !== secondPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!validatePasswordStrength(firstPassword)) {
            setError(
                'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.'
            );
            return;
        }

        const encryptedPassword = CryptoJS.AES.encrypt(firstPassword, 'zxcvb').toString();
        const id = decryptedUsername;
        const sendData = {
            username: decryptedUsername,
            password: encryptedPassword
        };
        console.log("new password data  ", sendData);
        console.log("id  ", decryptedUsername);
        axios.put(`${process.env.REACT_APP_BASE_URL}/api/changepassword/${id}`, sendData)
            .then(response => {
                if (response.data.status === 'success') {
                    navigate('/');
                } else {
                    setError('Unable to reset password');
                }
            })
            .catch(err => {
                console.error('Request failed:', err);
                setError('Error occurred while resetting password');
            });
    };

    return (
        <div className="w-full h-full min-h-screen flex items-center justify-center background-white px-6 py-12 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-full background-white flex items-center justify-center px-6 py-12 lg:px-8">
                <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[30%] max-h-[600px] min-h-[500px] overflow-hidden bg-white p-[65px_30px] rounded-[15px] shadow-md flex flex-col justify-between relative">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                        <img
                            alt="Your Company"
                            src={logo}
                            className="mx-auto h-24 w-auto m-0 p-0"
                        />
                        <h2 className="text-center text-2xl font-bold leading-4 tracking-tight text-gray-800">
                            Reset Password
                        </h2>
                    </div>
                    <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    New Password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="Enter new password"
                                        value={firstPassword}
                                        onChange={(e) => setFirstPassword(e.target.value)}
                                        className="pass block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:outline-none focus:ring-2 focus:ring-[#35AF87] sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Confirm Password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        placeholder="Confirm new password"
                                        value={secondPassword}
                                        onChange={(e) => setSecondPassword(e.target.value)}
                                        className="pass block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:outline-none focus:ring-2 focus:ring-[#35AF87] sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                            <div className="flex w-full justify-center">
                                <button
                                    type="submit"
                                    className="submit flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Save & Update
                                </button>
                            </div>
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

export default NewPassword;
