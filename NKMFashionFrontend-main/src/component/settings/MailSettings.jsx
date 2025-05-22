import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';

function MailSettingsBody() {
    // State management
    const [mailMailer, setMailMailer] = useState('');
    const [mailHost, setMailHost] = useState('');
    const [mailPort, setMailPort] = useState('');
    const [mailSenderName, setMailSenderName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [encryption, setEncryption] = useState('');
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load currencies when the component mounts
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getMailSettings`);
            console.log(data)
            // Optionally populate the fields if data is retrieved
            setMailMailer(data.mailMailer || '');
            setMailHost(data.mailHost || '');
            setMailPort(data.mailPort || '');
            setMailSenderName(data.mailSenderName || '');
            setUsername(data.username || '');
           // setPassword(data.password || '');
            setEncryption(data.encryption || '');
        } catch (error) {
            console.error('Error fetching settings:', error);
            setError('Error fetching settings');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Encrypt the password
        const secretKey = process.env.REACT_APP_SECRET_KEY;
        const encryptedPassword = CryptoJS.AES.encrypt(password, secretKey).toString();

        const normalizedUsername = username.toLowerCase();
        const normalizedMailMailer = mailMailer.toLowerCase();
        const formData = {
            mailMailer:normalizedMailMailer,
            mailHost,
            mailPort,
            mailSenderName,
            username:normalizedUsername,
            password:encryptedPassword,
            encryption,
        };
        console.log('Form Data:', formData);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createOrUpdateMailSettings`, formData);
            toast.success(
                response.data.message,
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } catch (error) {
            console.error('Error saving data:', error);
            // Check if the error has a response object and display the message from the server 
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    toast.error(
                        error.response.data.message,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                } else {
                    toast.error(
                        `Server responded with status: ${error.response.status}`,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                }
            } else if (error.request) {
                toast.error(
                    'No response from the server. Please check your internet connection.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            } else {
                toast.error(
                    'An unexpected error occurred while setting up the request.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mt-20'>
                <div>
                    <h2 className="text-lightgray-300 p-0 text-2xl">Mail Settings</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/dashboard'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] pb-2 w-full rounded-2xl px-8 shadow-md">
                <div className="flex flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex w-full space-x-5">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Mail Mailer <span className='text-red-500'>*</span></label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Mail Mailer"
                                    value={mailMailer}
                                    onChange={(e) => setMailMailer(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Mail Host <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Mail Host"
                                    value={mailHost}
                                    onChange={(e) => setMailHost(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Mail Port</label>
                                <input
                                    type="text"
                                    placeholder="Mail port"
                                    value={mailPort}
                                    onChange={(e) => setMailPort(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Mail Sender Name</label>
                                <input
                                    type="text"
                                    placeholder="Mail Sender Name"
                                    value={mailSenderName}
                                    onChange={(e) => setMailSenderName(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div className="flex w-full pr-5 space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Username</label>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-1/2 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                            {/* <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Password</label>
                                <input
                                    type="password"
                                    placeholder="x  x  x  x  x  x"
                                    
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            // </div> */}
                        </div>
                        {/* <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Encryption</label>
                                <input
                                    type="text"
                                    placeholder="Mail Encryption"
                                    value={encryption}
                                    onChange={(e) => setEncryption(e.target.value)}
                                    className="block w-[49%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div> */}
                        <div className="container mx-auto text-left">
                            <div className='mt-5 flex justify-start'>
                                <button className='submit text-white rounded-md mt-5' type='submit'>
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </form>
                    {/* Error and Response Messages */}
                </div>
            </div>
        </div>
    );
}

export default MailSettingsBody;
