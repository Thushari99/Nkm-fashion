import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/role.css';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { fetchExpensesCatData, handleFormSubmit, fetchExpensesById, updateExpenses, handleDelete } from './ExpensesController';
import { toast } from "react-toastify";
import AOS from 'aos';
import 'aos/dist/aos.css'
import { UserContext } from '../../context/UserContext';

function ViewExpensesCategoryBody() {
    // State variables
    const [exCategoryData, setExCatergoryData] = useState([]);
    const [searchedExpensesCataergoryByName, setSearchedExpensesCataergoryByName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expensesName, setExpensesName] = useState('');
    const [keyword, setKeyword] = useState('')
    const [editExpensesName, setEditExpensesName] = useState('');
    const [isPopupEdit, setIsPopUpEdit] = useState(false)
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [selectedExpensesCatId, setSelectedExpensesCatId] = useState(null);
    const [responseMessage, setResponseMessage] = useState('')
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expensesCatToDelete, setExpensesCatToDelete] = useState(null);
    const debounceTimeout = useRef(null);
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
    const combinedProductData = Array.isArray(searchedExpensesCataergoryByName) && searchedExpensesCataergoryByName.length > 0
        ? searchedExpensesCataergoryByName
        : Array.isArray(exCategoryData) && exCategoryData.length > 0
            ? exCategoryData
            : [];


    //Load currencies when the component mounts
    useEffect(() => {
        // Call fetchSaleData and pass setCurrencyData, setLoading, and setError
        fetchExpensesCatData(setExCatergoryData, setLoading, setError);
    }, []);

    const searchExpensesCategory = async (query) => {
        setLoading(true);
        setError(''); // Clear any previous error messages
        try {
            if (!query.trim()) {
                // If the query is empty, reset to all base units
                setSearchedExpensesCataergoryByName(exCategoryData); // Reset to initial list
                setResponseMessage('');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchExpenseCategory`, {
                params: { expensesName: query },
            });
            if (response.data.data && response.data.data.length > 0) {
                setSearchedExpensesCataergoryByName(response.data.data);
                setResponseMessage('');
            } else {
                setSearchedExpensesCataergoryByName([]); // Clear the table
                setError('No expenses categories found for the given query.'); // Set error message
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedExpensesCataergoryByName([]); // Clear the table
            setError('No expenses categories found for the given name.');
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
                setSearchedExpensesCataergoryByName(exCategoryData); // Reset to full list
            } else {
                searchExpensesCategory(value);
            }
        }, 100);
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBrand
        if (e.key === "Backspace" && value === '') {
            setSearchedExpensesCataergoryByName([]);
        }
    };

    const showConfirmationModal = (expensesCatId) => {
        setExpensesCatToDelete(expensesCatId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const handleTogglePopup = () => {
        setPopupVisible(!isPopupVisible);
    };

    const handleTogglePopupEdit = () => {
        setIsPopUpEdit(false);
        setSelectedExpensesCatId(null);
        setEditExpensesName('');
    };

    const handleDelete = async (_id) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteExpensesCategory/${_id}`);
            if (response.status === 200) {
                setExCatergoryData(exCategoryData.filter(ex => ex._id !== _id));
                toast.success('Expenses category deleted successfully!', { autoClose: 2000, className: "custom-toast" });
                const updatedData = await fetchExpensesCatData();
                setExCatergoryData(updatedData);
            } else {
                setError('Failed to delete the expense category. Please try again.');
            }
        } catch (error) {
            toast.error(error, { autoClose: 2000, className: "custom-toast" });
            console.error('Error deleting expense category:', error);
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
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            {loading && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form onSubmit={(e) => e.preventDefault()} className="flex items-center">
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search Expenses category..."
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
                    {permissionData.create_exp_category && (
                    <div>
                        <button
                            onClick={handleTogglePopup}
                            className="submit rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[250px] text-center"
                        >
                            Create Expenses Category
                        </button>
                    </div>
                    )}
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : combinedProductData.length > 0 ? (
                <div className="overflow-x-auto">

                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses Catergory</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedProductData.map((expenses) => (
                                <tr key={expenses._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] w-[200px] text-center p-[6px] bg-green-100 text-green-500'>{expenses.expensesName}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className="text-right">
                                        {permissionData.edit_exp_category && (
                                            <button
                                                onClick={() => fetchExpensesById(expenses._id, setEditExpensesName, setSelectedExpensesCatId, setIsPopUpEdit)}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </button>
                                        )}
                                        {permissionData.delete_exp_category && (
                                            <button
                                                onClick={() => showConfirmationModal(expenses._id, exCategoryData, setExCatergoryData)}
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
                        </tbody>
                    </table>
                </div>
            ) : (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )
            }
            {/* Popup overlay */}
            {isPopupVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-[600px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                        {/* Close button */}
                        <button
                            onClick={handleTogglePopup}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>

                        {/* Form content */}
                        <h2 className="text-xl text-gray-700 font-semibold mb-4">Create Expenses Category</h2>
                        <form onSubmit={ async (e) => {
                            const isSuccess = await handleFormSubmit(e, setLoading, expensesName, setExpensesName, setResponseMessage, setError, navigate, setPopupVisible, fetchExpensesCatData, setExCatergoryData, setError );
                            if (isSuccess) {
                                fetchExpensesCatData(setExCatergoryData, setLoading, setError);
                              }
                        } }>
                            <div className='mt-10'>
                                <label className="text-left block text-sm font-medium text-gray-700">Expenses Category <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    value={expensesName}
                                    required
                                    onChange={(e) => setExpensesName(e.target.value)}
                                    className="searchBox mt-2 w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    placeholder="Enter expenses name"
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

                            {responseMessage && <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">{responseMessage}</p>}
                        </form>
                    </div>
                </div>
            )}

            {isPopupEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-[600px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                        {/* Close button */}
                        <button
                            onClick={handleTogglePopupEdit}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>

                        {/* Form content */}
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Edit Expenses Category </h2>
                        <form onSubmit={ async (e) => {
                            const isUpdated = await updateExpenses(e, selectedExpensesCatId, editExpensesName, setEditExpensesName, setResponseMessage, setIsPopUpEdit, setError, navigate,fetchExpensesCatData, setExCatergoryData, setLoading);
                            if (isUpdated) {
                                fetchExpensesCatData(setExCatergoryData, setLoading, setError);
                              }
                        } }>
                            <div className='mt-5'>
                                <label className="block text-left text-sm font-medium text-gray-700">Expenses Category <span className='text-red-500'>*</span></label>
                                <input
                                    type="text"
                                    value={editExpensesName}
                                    required
                                    onChange={(e) => setEditExpensesName(e.target.value)}
                                    className="searchBox mt-2 w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    placeholder="Enter expenses name"
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

                            {/* Error and Response Messages */}
                            <div className='mt-10'>
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
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(expensesCatToDelete)}  // Confirm delete
                message="Are you sure you want to delete this expenses category?"
            />
        </div >
    );
}
export default ViewExpensesCategoryBody;