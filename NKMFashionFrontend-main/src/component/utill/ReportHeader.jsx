import { Disclosure, Menu, Transition } from '@headlessui/react';
import { decryptData } from './encryptionUtils';
import { BellIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import avatar from '../../img/avatar.png';
import exit from '../../img/exit.png';
import padlock from '../../img/padlock.png';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { handleFullScreen } from '../pos/utils/fullScreenView';
import Full from '../../img/full-screen.png';
import PosIcon from '../../img/Cal POS 1.png';
import axios from 'axios';
import { useLogo } from '../../context/logoContext';
import { toast } from 'react-toastify';
import Decrease from '../../img/down-arrow (1).png';

const navigation = [
    { name: 'Warehouse Report', href: '/viewReport' },
    { name: 'Stock Report', href: '/viewStokeRep' },
    { name: 'Customer Report', href: '/customerReport' },
    { name: 'Supplier Report', href: '/suplierReport' },
    { name: 'Register Report', href: '/viewRegisterRep' },
    { name: 'Quantity Report', href: '/quantityAlertRep' },
    { name: 'P & L ', href: '/profitAndLostReport' },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function ReportHeader({ userData }) {
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        profileImage: '',
        mobile: '',
    });

    const [showModal, setShowModal] = useState(false);
    const [cashInHand, setCashInHand] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { logo } = useLogo();

    const [oneRupee, setOneRupee] = useState("0");
    const [twoRupee, setTwoRupee] = useState("0");
    const [fiveRupee, setFiveRupee] = useState("0");
    const [tenRupee, setTenRupee] = useState("0");
    const [twentyRupee, setTwentyRupee] = useState("0");
    const [fiftyRupee, setFiftyRupee] = useState("0");
    const [hundredRupee, setHundredRupee] = useState("0");
    const [fiveHundredRupee, setFiveHundredRupee] = useState("0");
    const [thousandRupee, setThousandRupee] = useState("0");
    const [fiveThousandRupee, setFiveThousandRupee] = useState("0");

    const handleReduceClick = (event, setter) => {
        event.preventDefault();
        setter(prev => Math.max(Number(prev) - 1, 0));
    };

    const handleNoteClick = (event, setter) => {
        event.preventDefault();
        setter(prev => Number(prev) + 1);
    };

    const calculateTotal = (notesAndCoins) => {
        return notesAndCoins.reduce((sum, { value, state }) => sum + value * state, 0);
    };
    const notesAndCoins = [
        { value: 1, state: oneRupee, setter: setOneRupee },
        { value: 2, state: twoRupee, setter: setTwoRupee },
        { value: 5, state: fiveRupee, setter: setFiveRupee },
        { value: 10, state: tenRupee, setter: setTenRupee },
        { value: 20, state: twentyRupee, setter: setTwentyRupee },
        { value: 50, state: fiftyRupee, setter: setFiftyRupee },
        { value: 100, state: hundredRupee, setter: setHundredRupee },
        { value: 500, state: fiveHundredRupee, setter: setFiveHundredRupee },
        { value: 1000, state: thousandRupee, setter: setThousandRupee },
        { value: 5000, state: fiveThousandRupee, setter: setFiveThousandRupee },
    ];

    const total = calculateTotal(notesAndCoins);

    useEffect(() => {
    }, [oneRupee, twoRupee, fiveRupee, tenRupee, twentyRupee, fiftyRupee, hundredRupee, fiveHundredRupee, thousandRupee, fiveThousandRupee])

    useEffect(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const user = decryptData(encryptedUser);
                setFormData(user);
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
                sessionStorage.removeItem('user');
                alert('Session data corrupted. Please log in again.');
                return;
            }
        } else {
            console.error('User data could not be retrieved');
            alert('Could not retrieve user data. Please log in again.');
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/');
    };

    const handleCashInHandChange = (e) => {
        setCashInHand(e.target.value);
        setError('');
    };


   const handlePOSClick = async () => {
        const cashRegisterID = sessionStorage.getItem('cashRegisterID');
        if (cashRegisterID) {
            navigate('/posSystem');
            return true;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getActiveCashRegister`);
            console.log('Cash register response:', response.data);
            if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const activeCashRegister = response.data.data[0];

                sessionStorage.setItem('cashRegisterID', activeCashRegister._id);
                sessionStorage.setItem('cashierUsername', activeCashRegister.username);
                sessionStorage.setItem('name', activeCashRegister.name);

                navigate('/posSystem');
                return true;
            } else {
                setShowModal(true);
                return false;
            }
        } catch (error) {
            console.error('Error fetching cash register:', error);
            setShowModal(true);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const encryptedUser = sessionStorage.getItem('user');
        let decryptedUser = null;

        if (encryptedUser) {
            try {
                decryptedUser = decryptData(encryptedUser);
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
                sessionStorage.removeItem('user');
                alert('Session data corrupted. Please log in again.');
                return;
            }
        }

        if (!decryptedUser) {
            console.error('User data could not be retrieved or decrypted');
            alert('Could not retrieve user data. Please log in again.');
            return;
        }

        const cashAmount = parseFloat(total);
        if (isNaN(cashAmount) || cashAmount < 500) {
            toast.error(
                error.message || 'Cash in hand must be a valid number and greater than 500 rupees.',
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
            return;
        }
        else {
            const username = decryptedUser.username;
            const name = decryptedUser.firstName;
            const openTime = new Date().toLocaleString();
            const newCash = {
                username,
                name,
                cashAmount: total,
                openTime,
                oneRupee,
                twoRupee,
                fiveRupee,
                tenRupee,
                twentyRupee,
                fiftyRupee,
                hundredRupee,
                fiveHundredRupee,
                thousandRupee,
                fiveThousandRupee
            };

            try {
                const response = await axios.post(
                    `${process.env.REACT_APP_BASE_URL}/api/cashHandIn`,
                    newCash
                );

                if (response.data && response.data.cash) {
                    const cashID = response.data.cash._id;
                    const cashierUsername = response.data.cash.username;
                    const name = response.data.cash.name;
                    toast.success(response.data.message || 'New cash record created successfully!', { autoClose: 2000 }, { className: "custom-toast" });
                    sessionStorage.setItem('cashRegisterID', cashID);
                    sessionStorage.setItem('cashierUsername', cashierUsername);
                    sessionStorage.setItem('name', name);

                    setShowModal(false);
                    navigate('/posSystem');
                } else {
                    console.error('Unexpected response format:', response);
                    toast.error('An unexpected error occurred. Please try again.', { autoClose: 2000 }, { className: "custom-toast" });
                }
            } catch (error) {
                console.error('Error during cash submission:', error);

                if (error.response) {
                    const { status, data } = error.response;
                    if (status === 400) {
                        toast.error('Cash in hand must be a valid number and greater than 500 rupees.', { autoClose: 2000 }, { className: "custom-toast" });
                    } else if (status === 401) {
                        toast.error('Session expired. Please log in again.', { autoClose: 2000 }, { className: "custom-toast" });
                        navigate('/login');
                    } else {
                        toast.error(`Server error: ${data.message || 'Please try again later.'}`, { autoClose: 2000 }, { className: "custom-toast" });
                    }
                } else if (error.request) {
                    toast.error('Network error. Please check your connection and try again.', { autoClose: 2000 }, { className: "custom-toast" });
                } else
                    toast.error(`An error occurred: ${error.message}`, { autoClose: 2000 }, { className: "custom-toast" });
            }
        }

    }

    const handleModalClose = () => {
        setShowModal(false);
        setCashInHand('');
    };

    const linkClasses = (path) =>
        `block text-gray-500 hover:text-gray-800 px-3 py-2 rounded-md ${location.pathname === path ? 'text-gray-800 ' : ''
        }`;

    const defaultAvatar = 'https://jingslearning.com/media/images/login-user-head.png';

    return (
        <div className="navSec">
            <Disclosure as="nav" className="bg-white shadow h-20 fixed top-0 left-0 right-0 z-50">
                {({ open }) => (
                    <>
                        <div className="flex h-full items-center justify-between px-4 md:px-8">
                            <div className="flex items-center">
                                <img
                                    className="h-20 w-20 mt-2"
                                    src={logo}
                                    alt="Your Company Logo"
                                />
                            </div>
                            <div className="hidden md:flex space-x-4">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={linkClasses(item.href)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="hidden sm:flex  p-2 m-2 w-[40px] h-[40px] mr-5 border button-bg-color button-hover-color rounded-[14px] flex items-center justify-center">
                                    <button className='' onClick={handleFullScreen}>
                                        <img className="w-[25px] h-[23px]" src={Full} alt="" />
                                    </button>
                                </div>

                                <button
                                    className="submit flex items-center text-center rounded-full px-5 py-3 pt-[7px] h-10 mr-5 text-sm  text-white shadow-lg hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[96px] text-center"
                                    onClick={handlePOSClick}
                                >
                                    <img className="w-[35px] h-[30px] ml-[2px] " src={PosIcon} alt="pos" />
                                    POS
                                </button>
                                <button className="text-gray-500 hover:text-gray-700">
                                    <BellIcon className="h-6 w-6" />
                                </button>
                                <Menu as="div" className=" ml-3">
                                    <Menu.Button>
                                        <img
                                            className="h-10 w-10 rounded-full"
                                            src={formData.profileImage || defaultAvatar}
                                            alt="User Avatar"
                                            style={{ width: '40px', height: '40px' }}
                                        />
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="flex items-center justify-center h-20">
                                                <img
                                                    className="h-11 w-11 rounded-full"
                                                    alt="Profile"
                                                    src={formData.profileImage || defaultAvatar}
                                                    onError={(e) => { e.target.src = defaultAvatar; }}
                                                />
                                            </div>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to={`/profile`}
                                                        className={classNames(
                                                            active ? 'bg-gray-100' : '',
                                                            'block w-full px-6 py-4 text-sm text-black flex items-center'
                                                        )}
                                                    >
                                                        <img src={avatar} className="h-5 w-5" alt="Profile Icon" aria-hidden="true" />
                                                        <span className="ml-3">Your Profile</span>
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to={'/forgetpassword'}
                                                        className={classNames(
                                                            active ? 'bg-gray-100' : '',
                                                            'block w-full px-6 py-4 text-sm text-black flex items-center'
                                                        )}
                                                    >
                                                        <img src={padlock} className="h-5 w-5" alt="Padlock Icon" aria-hidden="true" />
                                                        <span className="ml-3">Change Password</span>
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to={'/'}
                                                        className={classNames(
                                                            active ? 'bg-gray-100' : '',
                                                            'block w-full px-6 py-4 text-sm text-black flex items-center'
                                                        )}
                                                    >
                                                        <GlobeAltIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                                        <span className="ml-3">Change Language</span>
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={handleLogout}
                                                        className={classNames(
                                                            active ? 'bg-gray-100' : '',
                                                            'block w-full px-6 py-4 text-sm text-black flex items-center'
                                                        )}
                                                    >
                                                        <img src={exit} className="h-5 w-5" alt="Exit Icon" aria-hidden="true" />
                                                        <span className="ml-3">Sign Out</span>
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                        <Disclosure.Panel className="md:hidden">
                            <div className="space-y-1 px-2 pt-2 pb-3">
                                {navigation.map((item) => (
                                    <Disclosure.Button
                                        key={item.name}
                                        as={Link}
                                        to={item.href}
                                        className={linkClasses(item.href)}
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                ))}
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
            {/* Modal for entering Cash In Hand */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
                    <div className="bg-white w-full md:w-1/2 lg:w-1/2 xl:w-[49%] h-[80vh] max-h-[700px] p-6 rounded-md shadow-lg overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4 text-gray-500">Enter Cash In Hand</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="number"
                                className="border border-gray-300 p-2 rounded w-full mb-4"
                                placeholder="Cash In Hand"
                                value={total}
                                onChange={handleCashInHandChange}
                            />

                            {/* Notes Section */}
                            <div className="flex flex-col md:flex-row justify-between w-full">
                                <div className="mb-8">
                                    <h1 className="text-left">Notes</h1>
                                    <table className="table-auto border-collapse">
                                        <thead>
                                            <tr className="text-left"></tr>
                                        </thead>
                                        <tbody>
                                            {notesAndCoins.slice(4).map(({ value, state, setter }) => (
                                                <tr key={value} className="hover:bg-gray-100">
                                                    <td className="p-2"></td>
                                                    <td className="p-2 text-left">{value} x</td>

                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-20 text-center border rounded outline-gray-200 py-1 text-xs md:text-sm"
                                                            value={state === 0 ? "" : state}
                                                            onChange={(e) => setter(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleReduceClick(e, setter)}
                                                                className="text-red-600 font-bold bg-gray-200 text-xs rounded-md p-[6.5px] text-sm md:text-base"
                                                            >
                                                                <img className="w-[16px] h-[16px]" src={Decrease} alt="decrease" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleNoteClick(e, setter)}
                                                                className="text-green-600 font-bold bg-gray-200 text-xs rounded-md p-[6.5px] text-sm md:text-base"
                                                            >
                                                                <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Coins Section */}
                                <div className="mb-8 ml-4">
                                    <h1 className="text-left">Coins</h1>
                                    <table className="table-auto border-collapse">
                                        <thead>
                                            <tr className="text-left"></tr>
                                        </thead>
                                        <tbody>
                                            {notesAndCoins.slice(0, 4).map(({ value, state, setter }) => (
                                                <tr key={value} className="hover:bg-gray-100">
                                                    <td className="p-2 text-left">{value} x</td>

                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-20 text-center border rounded outline-gray-200 py-1 text-xs md:text-sm"
                                                            value={state === 0 ? "" : state}
                                                            onChange={(e) => setter(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleReduceClick(e, setter)}
                                                                className="text-red-500 bg-gray-200 p-[6.5px] rounded-md text-xs md:text-sm font-bold"
                                                            >
                                                                <img className="w-[16px] h-[16px]" src={Decrease} alt="decrease" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleNoteClick(e, setter)}
                                                                className="text-green-500 bg-gray-200 p-[6.5px] rounded-md text-xs md:text-sm font-bold"
                                                            >
                                                                <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 md:mt-10">
                                <button
                                    type="submit"
                                    className="submit w-full sm:w-auto text-white px-4 py-2 rounded"
                                >
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-300 w-full sm:w-auto px-4 py-2 rounded"
                                    onClick={handleModalClose}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
