import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/role.css';
import { handleFormSubmit, fetchCurrencyById, updateCurrency } from './CurrencyController';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { UserContext } from '../../context/UserContext';

function ViewCurrencyBody() {
    // State variables
    const [currencyData, setCurrencyData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedCurrencyByName, setSearchedCurrencyByName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isPopupOpenEdit, setIsPopUpEdit] = useState(false)
    const [currencyName, setCurrencyName] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [currencySymbole, setCurrencySymbole] = useState('')
    const [editcurrencyName, setEditCurrencyName] = useState('');
    const [editcurrencyCode, setEditCurrencyCode] = useState('');
    const [editcurrencySymbole, setEditCurrencySymbole] = useState('')
    const [selectedCurrencyId, setSelectedCurrencyId] = useState(null);
    const [response, setResponse] = useState('')
    const [currenciCreatingResponse, setcurrenciCreatingResponse] = useState('')
    const [error, setError] = useState('')
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currencyToDelete, setCurrencyToDelete] = useState(null);
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const [permissionData, setPermissionData] = useState({});
    const { userData } = useContext(UserContext);

    useEffect(() => {
        if (userData?.permissions) {
          console.log("UserData received in useEffect:", userData);
      
          setPermissionData(extractPermissions(userData.permissions));
        }
      }, [userData]);

      const extractPermissions = (permissions) => {
        let extractedPermissions = {};
      
        Object.keys(permissions).forEach((category) => {
          Object.keys(permissions[category]).forEach((subPermission) => {
            extractedPermissions[subPermission] = permissions[category][subPermission];
          });
        });
      
        return extractedPermissions;
      };


    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData =
        Array.isArray(searchedCurrencyByName) && searchedCurrencyByName.length > 0
            ? searchedCurrencyByName
            : Array.isArray(currencyData) && currencyData.length > 0
                ? currencyData
                : [];

    // Load currencies when the component mounts
    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchCurrencies();
        }
    }, [keyword, page, size, refreshKey]);

    // Fetch all currencies
    const fetchCurrencies = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCurrency`, {
                params: {
                    'page[size]': size,
                    'page[number]': page,
                },
            });
            setCurrencyData(response.data.data);
            setSearchedCurrencyByName(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (err) {
            console.error('Error fetching currencies:', err);
            setError('No currencies found.');
            setCurrencyData([]);
            setSearchedCurrencyByName([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const showConfirmationModal = (currencyId) => {
        setCurrencyToDelete(currencyId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchCurrency = async (query) => {
        setLoading(true);
        setError(''); // Clear any previous error messages
        try {
            if (!query.trim()) {
                // If the query is empty, reset to all base units
                setSearchedCurrencyByName(currencyData); // Reset to initial list
                setResponseMessage('');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCurrency`, {
                params: { keyword: query },
            });
            if (response.data.currencies && response.data.currencies.length > 0) {
                setSearchedCurrencyByName(response.data.currencies);
                setResponseMessage('');
            } else {
                setSearchedCurrencyByName([]); // Clear the table
                setError('No currencies found for the given query.'); // Set error message
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedCurrencyByName([]); // Clear the table
            setError('No currencies found for the given name.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setKeyword(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedCurrencyByName(currencyData); // Reset to full list
            } else {
                searchCurrency(value);
            }
        }, 100);
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBrand
        if (e.key === "Backspace" && value === '') {
            setSearchedCurrencyByName([]);
        }
    };

    // Toggle popups
    const handleTogglePopup = () => setIsPopupOpen(!isPopupOpen);
    const handleTogglePopupEdit = () => setIsPopUpEdit(!isPopupOpenEdit);

    const handleDelete = async (_id) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteCurrency/${_id}`);
            if (response.status === 200) {
                // Update the local state to remove the deleted row
                setCurrencyData((prev) => prev.filter((currency) => currency._id !== _id));
                setSearchedCurrencyByName((prev) => prev.filter((currency) => currency._id !== _id));

                toast.success('Currency deleted successfully!', { autoClose: 2000, className: "custom-toast" });
            } else {
                setError('Failed to delete the currency.');
            }
        } catch (error) {
            toast.error('Error occurred while deleting currency.', { autoClose: 2000, className: "custom-toast" });
            console.error('Error:', error.response || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        AOS.init({
            duration: 400, // Animation duration in milliseconds
            easing: 'ease-in-out', // Easing function
            once: true, // Whether animation should happen only once
        });
    }, []);

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form onSubmit={(e) => e.preventDefault()} className="flex items-center">
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by Currency Name or Currency Code..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={keyword}
                        />
                        <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z"
                                    clipRule="evenodd"
                                />
                                <path
                                    fillRule="evenodd"
                                    d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </form>
                </div>
                <div className="flex items-center">
                    {permissionData.create_currency && (
                    <div>
                        <button
                            onClick={() => handleTogglePopup()}
                            className="submit rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[200px] text-center"
                        >
                            Create Currency
                        </button>
                    </div>
                    )}
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : error ? (
                <div className=" ">
                    {error && (
                        <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                            {error}
                        </p>
                    )}
                </div>
            ) : combinedProductData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency Symbol</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedProductData.map((currency) => (
                                <tr key={currency._id}>
                                    <td className="px-6 py-4 text-left  whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] w-[200px] text-center p-[6px] bg-red-100 text-red-500'>{currency.currencyName}</p></td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency.currencyCode}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] w-[80px] text-center p-[6px] bg-green-100 text-green-500'>{currency.currencySymbole}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className="text-right">
                                            {permissionData.edit_currency && (
                                            <button
                                                onClick={() => fetchCurrencyById(currency._id, setEditCurrencyName, setEditCurrencyCode, setEditCurrencySymbole, setSelectedCurrencyId, setIsPopUpEdit, setError, setResponse)}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </button>
                                            )}
                                            {permissionData.delete_currency && (
                                            <button
                                                onClick={() => showConfirmationModal(currency._id, currencyData, setCurrencyData,)}
                                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-trash mr-1"></i>
                                            </button>
                                            )}
                                        </div>
                                    </td>

                                </tr>
                            ))}

                            {/* Edit view */}
                            {isPopupOpenEdit && (
                                <div className="fixed inset-0 bg-black mt-20 bg-opacity-50 flex justify-center items-center">
                                    <div className="bg-white w-[550px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                                        {/* Close button */}
                                        <button
                                            onClick={handleTogglePopupEdit}
                                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>

                                        {/* Form content */}
                                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Update Currency</h2>
                                        <form onSubmit={(e) => updateCurrency(e, selectedCurrencyId, editcurrencyName, editcurrencyCode, editcurrencySymbole, setEditCurrencyName, setEditCurrencyCode, setEditCurrencySymbole, setResponse, setIsPopupOpen, setError, navigate, setRefreshKey, setSelectedCurrencyId, setIsPopUpEdit)} className="space-y-4">
                                            <div className='mt-10'>
                                                <label className="block text-left text-sm font-medium text-gray-700">Currency Name <span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    value={editcurrencyName}
                                                    required
                                                    onChange={(e) => setEditCurrencyName(e.target.value)}
                                                    className="searchBox mt-2 w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                                    placeholder="Enter currency name"
                                                />
                                            </div>

                                            <div className='mt-10'>
                                                <label className="block text-left text-sm font-medium text-gray-700">Currency Code <span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    value={editcurrencyCode}
                                                    onChange={(e) => setEditCurrencyCode(e.target.value)}
                                                    className="searchBox w-full mt-2 pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                                    placeholder="Enter currency code"
                                                    required
                                                />
                                            </div>

                                            <div className='mt-10'>
                                                <label className="block text-left text-sm font-medium text-gray-700">Currency Symbol <span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    value={editcurrencySymbole}
                                                    onChange={(e) => setEditCurrencySymbole(e.target.value)}
                                                    className="searchBox w-full mt-2 pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                                    placeholder="Enter currency symbol"
                                                    required
                                                />
                                            </div>

                                            <div className='mt-5' >
                                                <button
                                                    type="submit"
                                                    className="submit mt-10 w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                                                >
                                                    Update & Save
                                                </button>
                                            </div>

                                            {/* Error and Response Messages */}
                                            <div className='mt-5'>
                                                {error && (
                                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                                        {error}
                                                    </p>
                                                )}
                                                {response && (
                                                    <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                                                        {response}
                                                    </p>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Not data available</p>
            )
            }
            {/* Popup overlay */}
            {isPopupOpen && (
                <div className="fixed inset-0 mt-20 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white w-[550px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                        {/* Close button */}
                        <button
                            onClick={handleTogglePopup}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>

                        {/* Form content */}
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Create Currency</h2>
                        <form onSubmit={(e) => handleFormSubmit(e, setLoading, currencyName, currencyCode, currencySymbole, setCurrencyName, setCurrencyCode, setCurrencySymbole, setcurrenciCreatingResponse, setError, navigate, setIsPopupOpen, setRefreshKey)}>
                            <div className='mt-10'>
                                <label className="text-left block text-sm font-medium text-gray-700">Currency Name <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    value={currencyName}
                                    required
                                    onChange={(e) => setCurrencyName(e.target.value)}
                                    className="searchBox mt-2 w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    placeholder="Enter currency name"
                                />
                            </div>

                            <div className='mt-10'>
                                <label className="text-left block text-sm font-medium text-gray-700">Currency Code <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    value={currencyCode}
                                    onChange={(e) => setCurrencyCode(e.target.value)}
                                    className="searchBox w-full mt-2 pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    placeholder="Enter currency code"
                                    required
                                />
                            </div>

                            <div className='mt-10'>
                                <label className="text-left block text-sm font-medium text-gray-700">Currency Symbol <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    value={currencySymbole}
                                    onChange={(e) => setCurrencySymbole(e.target.value)}
                                    className="searchBox w-full mt-2 pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    placeholder="Enter currency symbol"
                                    required
                                />
                            </div>

                            <div className='mt-5' >
                                <button
                                    type="submit"
                                    className="submit mt-10 w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(currencyToDelete)}
                message="Are you sure you want to delete this currency?"
            />


            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {!error && combinedProductData.length > 0 && (
                    <PaginationDropdown
                        size={size}
                        setSize={setSize}
                        page={page}
                        setPage={setPage}
                        totalPages={totalPages}
                        handlePrevPage={handlePrevPage}
                        handleNextPage={handleNextPage}
                    />
                )}
            </div>
        </div >
    );
}
export default ViewCurrencyBody;