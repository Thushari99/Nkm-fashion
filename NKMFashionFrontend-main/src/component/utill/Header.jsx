import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useState, useEffect,} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import avatar from '../../img/avatar.png';
import exit from '../../img/exit.png';
import padlock from '../../img/padlock.png';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import PosIcon from '../../img/Cal POS 1.png';
import { decryptData } from '../utill/encryptionUtils';
import axios from 'axios';
import Full from '../../img/Full Screen 1.png';
import Notifi from '../../img/Notification.png'
import { handleFullScreen } from '../pos/utils/fullScreenView';
import LanguageModal from './languageModal';
import { handleSave } from '../sales/SaleController';
import AOS from 'aos';
import 'aos/dist/aos.css'
import { useLogo } from '../../context/logoContext';
import { toast } from "react-toastify";
import Decrease from '../../img/down-arrow (1).png';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Header({ userData, grandTotal, orderStatus, paymentStatus, paymentType, shipping, discountType, discount, tax, warehouse, selectedCustomer, selectedProduct, date, preFix, setResponseMessage, setProgress }) {
  const [formData, setFormData] = useState({ username: '', firstName: '', lastName: '', profileImage: '', mobile: '' });
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [cashInHand, setCashInHand] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const location = useLocation();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showLogoutModel, setShowLogoutModal] = useState(false);
  const { logo } = useLogo();
  const [permissionData, setPermissionData] = useState({});

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
    if (userData) {
      const permissions = userData?.permissions || {};

      const hasAnyPermission = (permissionKey) => {
        const subPermissions = permissions[permissionKey] || {};
        return Object.values(subPermissions).some(Boolean);
      };

      setPermissionData({
        manageProducts: hasAnyPermission("manageProducts"),
        manageBaseUnits: hasAnyPermission("manageBaseUnits"),
        manageUnits: hasAnyPermission("manageUnits"),
        manageVariation: hasAnyPermission("manageVariation"),
        manageBrands: hasAnyPermission("manageBrands"),
        manageProductCategories: hasAnyPermission("manageCategory"),
        manageBarcodePrint: hasAnyPermission("manageBarcodePrint"),
        manageCustomers: hasAnyPermission("manageCustomers"),
        manageUsers: hasAnyPermission("manageUsers"),
        manageSuppliers: hasAnyPermission("manageSuppliers"),
        manageWarehouse: hasAnyPermission("manageWarehouse"),
        manageTransfer: hasAnyPermission("manageTransfer"),
        manageSales: hasAnyPermission("manageSales"),
        manageSaleReturns: hasAnyPermission("manageSaleReturns"),
        managePurchases: hasAnyPermission("managePurchases"),
        managePurchaseReturns: hasAnyPermission("managePurchaseReturns"),
        manageQuotations: hasAnyPermission("manageQuotations"),
        manageCurrency: hasAnyPermission("manageCurrency"),
        manageExpenses: hasAnyPermission("manageExpenses"),
        manageExpensesCategory: hasAnyPermission("manageExpensesCategory"),
        manageRolesAndPermissions: hasAnyPermission("manageRolesAndPermissions"),
        manageReports: hasAnyPermission("manageReports"),
        manageAdjustments: hasAnyPermission("manageAdjustments"),
        manageLanguage: hasAnyPermission("manageLanguage"),
        manageSettings: hasAnyPermission("manageSettings"),
        manageMailSettings: hasAnyPermission("manageMailSettings"),
        manageReceiptSettings: hasAnyPermission("manageReceiptSettings"),
        managePrefixesSettings: hasAnyPermission("managePrefixesSettings"),
        managePOS: hasAnyPermission("managePOS"),

        // Extract specific "create" permissions from parent manage permissions
        create_product: permissions.manageProducts?.create_product || false,
        create_sale: permissions.manageSales?.create_sale || false,
        view_sale: permissions.manageSales?.view_sale || false,
        create_purchase: permissions.managePurchases?.create_purchase || false,
        create_customer: permissions.manageCustomers?.create_customer || false,
        create_supplier: permissions.manageSuppliers?.create_supplier || false,
        create_expense: permissions.manageExpenses?.create_expense || false,
      });

    }
  }, [userData]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: false },
    { name: 'Team', href: '/users', current: false },
    { name: 'Products', href: '/products', current: false },
    permissionData.view_sale ? { name: 'Sales', href: '/viewSale', current: false } : null,
  ].filter(Boolean);


  // Initialize form data
  useEffect(() => {
    if (userData) {
      try {
        setFormData({
          username: userData.username || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profileImage: userData.profileImage || '',
          mobile: userData.mobile || ''
        });
      } catch (error) {
        console.error('Error setting form data:', error);
      }
    }
  }, [userData]);

  // Initialize form data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData || !userData.username) {
        console.error("Username is not available");
        setError(prevErrors => ({ ...prevErrors, general: 'Username is not available.' }));
        return;
      }
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchUsers`, {
          params: { username: userData.username },
        });
        const fetchedData = response.data;
        setFormData(fetchedData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError(prevErrors => ({ ...prevErrors, general: 'Failed to fetch customer data.' }));
      }
    };

    fetchUserData();
  }, [userData]);

  const handleLogout = () => {
    const cashRegisterID = sessionStorage.getItem('cashRegisterID');
    const cashierUsername = sessionStorage.getItem('cashierUsername');
    const name = sessionStorage.getItem('name');

    if (cashRegisterID && cashierUsername && name) {
      setShowLogoutModal(true);
    } else {
      performLogout();
    }
  };

  const performLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handleConfirm = () => {
    setShowLogoutModal(false);
    performLogout();
  };

  const handleCancel = () => {
    setShowLogoutModal(false);
  };

  const handleCashInHandChange = (e) => {
    setCashInHand(e.target.value);
    setError('');
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
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

  const onSave = async () => {
    const isPOS = handlePOSClick(); // Determine if it's a POS sale
    console.log("isPOS: ", isPOS);
    await handleSave(
      /* Pass the required parameters to handleSave */
      grandTotal,
      orderStatus,
      paymentStatus,
      paymentType,
      shipping,
      discountType,
      discount,
      tax,
      warehouse,
      selectedCustomer,
      selectedProduct,
      date,
      preFix,
      setResponseMessage,
      setError,
      setProgress,
      isPOS
    );
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
          toast.success(response.data.message ||'New cash record created successfully!', { autoClose: 2000 }, { className: "custom-toast" } );
          sessionStorage.setItem('cashRegisterID', cashID);
          sessionStorage.setItem('cashierUsername', cashierUsername);
          sessionStorage.setItem('name',name);

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

  const updatedNavigation = navigation.map((item) => ({
    ...item,
    current: location.pathname === item.href,
  }));

  const defaultAvatar = 'https://jingslearning.com/media/images/login-user-head.png';

  const dropdownOptions = [
    { name: 'Create Product', href: '/createProduct' },
    { name: 'Create Sale', href: '/createSale' },
    { name: 'Create Purchase', href: '/createPurchase' },
    { name: 'Create Customer', href: '/createCustomer' },
    { name: 'Create Supplier', href: '/createSuplier' },
    { name: 'Create Expense', href: '/createExpenses' },
  ];

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  useEffect(() => {
    AOS.init({ duration: 400, easing: 'ease-in-out', once: true, });
  }, []);

  return (
    <div className='navSec items-center overflow-y-scroll pr-scroll-compensate min-w-[600px]'>
      <Disclosure as="nav" className="bg-white h-20 fixed top-0 left-0 right-0 z-50">
        {({ open }) => (
          <>
            <div className="flex h-full items-center justify-between px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-full bg-white items-center justify-between w-[100vw]">
                <div className="absolute inset-y-0 left-0 bg-white flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="relative h-20 flex items-center justify-between">
                  <div className="flex flex-shrink-0 items-center sm:left-0 absolute sm:relative  left-[0px]  sm:left-auto">
                    <img
                      className="h-20 w-20 mt-2"
                      src={logo}
                      alt="Your Company"
                    />
                  </div>
                  <div className="hidden sm:ml-6 items-center sm:block relative z-10 outline-white">
                    <div className="flex space-x-4 outline-white items-center">
                      {updatedNavigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-[#35AF87] text-white items-center'
                              : 'text-black border-none outline-white hover:bg-gray-200 hover:text-black',
                            'rounded-md px-3 py-2 text-sm font-medium items-center'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      ))}

                      {/* Sales Menu with Plus Icon and Dropdown */}
                      {(permissionData.create_product ||
                        permissionData.create_sale ||
                        permissionData.create_purchase ||
                        permissionData.create_customer ||
                        permissionData.create_supplier ||
                        permissionData.create_expense) && (
                          <div className="relative">
                            <button
                              onClick={toggleDropdown}
                              className="flex items-center space-x-1 bg-[#35AF87] text-white text-sm font-medium rounded-md px-2 py-2 border border-[#35AF87] transition-colors duration-300 hover:bg-[#2e9873]"
                            >
                              <PlusIcon className="h-5 w-5 text-white transition-colors duration-300" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownVisible && (
                              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" data-aos="fade-down">
                                <div className="py-1">
                                  {dropdownOptions.map((option) => (
                                    <a
                                      key={option.name}
                                      href={option.href}
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <PlusIcon className="h-4 w-4 text-[#2e9873] mr-2" />
                                      {option.name}
                                    </a>
                                  ))}
                                </div>
                              </div>

                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

                  <div className="hidden md:flex  p-2 m-2 w-[40px] h-[40px] mr-5 border bg-[#44BC8D] button-hover-color rounded-[14px] flex items-center justify-center">
                    <button className='' onClick={handleFullScreen}>
                      <img className="w-[25px] h-[23px]" src={Full} alt="" />
                    </button>
                  </div>

                  {permissionData.managePOS && (
                    <button
                      className="submit flex items-center text-center rounded-full p-1 pt-[8px] h-10 mr-5 text-sm  text-white shadow-lg hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[96px] text-center"
                      onClick={handlePOSClick}
                    >
                      <img className="w-[35px] h-[30px] ml-[2px]" src={PosIcon} alt="pos" />
                      POS
                    </button>
                  )}

                  <button
                    type="button"
                    className="relative rounded-full bg-white p-1 text-black hover:text-gray-800 mr-2 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <span className="sr-only">View notifications</span>
                    <img src={Notifi} alt='notification' className="h-10 w-10" aria-hidden="true" />
                  </button>

                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex relative rounded-full mr-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-100">
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-11 w-11 rounded-full"
                          alt="Profile"
                          src={formData.profileImage ? formData.profileImage : defaultAvatar}
                          onError={(e) => { e.target.src = defaultAvatar; }}
                        />
                      </Menu.Button>
                    </div>
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
                              onClick={() => setIsModalOpen(true)}
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
            </div>

            <Disclosure.Panel className="sm:hidden bg-white">
              <div className="space-y-1 px-2 pb-3 pt-2 bg-white">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-black hover:bg-gray-200 hover:text-black',
                      'block rounded-md px-3 py-2 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Language Modal */}
      <LanguageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLanguageChange={handleLanguageChange}
        currentLanguage={language}
      />

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

      {showLogoutModel && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white w-[400px] h-[240px] p-6 rounded-md shadow-lg">
            <h3 className='font-semibold text-gray-500'>Confirm Logout</h3>
            <p className='mt-2'>Do you want to logout without closing the POS?</p>
            <div className='mt-10'>
              <button className="submit w-[100px] text-white px-4 py-2 rounded mr-2"
                onClick={handleConfirm}>
                Confirm
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
