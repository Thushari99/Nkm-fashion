import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/login.css';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';
import { UserContext } from '../../context/UserContext';

function ViewExpensesBody() {
    // State variables
    const { currency } = useCurrency()
    const [expensesData, setExpensesData] = useState([]);
    const [searchedExpensesData, setSearchedExpensesData] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expensesToDelete, setExpensesToDelete] = useState(null);
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
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

    // Combine all data fetching types into one state
    const combinedProductData = Array.isArray(searchedExpensesData) && searchedExpensesData.length > 0
        ? searchedExpensesData
        : Array.isArray(expensesData) && expensesData.length > 0
            ? expensesData
            : [];

    const fetchExpensesData = async () => {
        setError('');
        setSuccessMessage('');

        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getExpenses`, {
                params: {
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            setExpensesData(response.data.data);
            setSearchedExpensesData(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (error) {
            console.error('Fetch expenses data error:', error);
            setError('No expenses found.');
            setExpensesData([]);
            setSearchedExpensesData([]);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all expenses
    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchExpensesData();
        }
    }, [keyword, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    // Handle delete expense
    const handleDelete = async (_id) => {
        setError('');
        setSuccessMessage('');
        try {
            setLoading(true);
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteExpenses/${_id}`);
            if (response.data && response.data.success) {
                setExpensesData(expensesData.filter(exp => exp._id !== _id));
                toast.success('Expenses deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
                setRefreshKey(prevKey => prevKey + 1);
                fetchExpensesData();
            } else {
                toast.error('Error deleting expense!', { autoClose: 2000 });
            }
        } catch (err) {
            console.error('Delete expense error:', err);
            setError('Failed to delete expense. Please try again.');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const showConfirmationModal = (expensesId) => {
        setExpensesToDelete(expensesId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchExpense = async (query) => {
        setLoading(true);
        setError(""); // Clear any previous error messages

        try {
            if (!query.trim()) {
                // If the query is empty, reset to all products
                setSearchedExpensesData(expensesData); // Reset to the initial list
                setSuccessMessage("");
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchExpense`, {
                params: { keyword: query }, // Send the keyword parameter
            });
            if (response.data.expenses && response.data.expenses.length > 0) {
                setSearchedExpensesData(response.data.expenses);
                setSuccessMessage("");
            } else {
                setSearchedExpensesData([]); // Clear the table
                setError("No expenses found for the given query."); // Set error message
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedExpensesData([]); // Clear the table
            setError("No expenses found for the given query.");
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
            if (value.trim() === "") {
                setError("");
                setSuccessMessage("");
                setSearchedExpensesData(expensesData); // Reset to full list
            } else {
                searchExpense(value); // Call the search API with the entered query
            }
        }, 100); // Adjust debounce delay as needed
    };


    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedExpensesData([]);
        }
    };

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
                            placeholder="Search Expenses..."
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
                    {permissionData.create_expense && (
                    <Link
                        to={'/createExpenses'}
                        className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                    >
                        Create Expenses
                    </Link>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catergory</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created on</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedProductData.map((exp) => (
                                <tr key={exp._id}>
                                    <td className="px-6 py-4 text-left  whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{exp.refferenceId}</p></td>
                                    <td className="px-6 py-4 text-left  whitespace-nowrap text-m text-gray-900">{exp.title}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{exp.warehouse}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{exp.category}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{ currency } {formatWithCustomCommas(exp.amount)}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(exp.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{exp.details}</td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap text-m text-gray-900">
                                        <div className='flex items-center justify-end'>
                                            {permissionData.edit_expense && (
                                            <Link to={`/editExpenses/${exp._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                            )}
                                            {permissionData.delete_expense && (
                                            <button
                                                onClick={(e) => showConfirmationModal(exp._id)}
                                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
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
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(expensesToDelete)}  // Confirm delete
                message="Are you sure you want to delete this expense?"
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
            <div className='mt-5'>
                {/* Error and Response Messages */}
                {/* {error && <p className="text-red-500 text-center">{error}</p>} */}
                {successMessage && <p className="text-color text-center">{successMessage}</p>}
            </div>
        </div>
    );
}

export default ViewExpensesBody;
