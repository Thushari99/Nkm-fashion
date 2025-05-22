import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/login.css';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { UserContext } from '../../context/UserContext';

function ViewWhereHouseBody() {
    const [warehouseData, setWarehouseData] = useState([]); // Fixed typo
    const [keyword, setKeyword] = useState('');
    const [searchedWarehouse, setSearchedWarehouse] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successStatus, setSuccessStatus] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [responseMessage, setResponseMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [warehouseToDelete, setWarehouseToDelete] = useState(null);
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


    const fetchWarehouseData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, {
                params: {
                    sort: '-createdAt',
                    'page[size]': size,
                    'page[number]': page,
                },
            });
            setWarehouseData(response.data.warehouses);
            setSearchedWarehouse(response.data.warehouses);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (err) {
            console.error('Fetch warehouse data error:', err);
            setError('No warehouses found.');
            setWarehouseData([]);
            setSearchedWarehouse([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchWarehouseData();
        }
    }, [keyword, page, size, refreshKey]);


    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const handleDelete = async (_id) => {
        setError('');
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteWarehouse/${_id}`);
            setWarehouseData(warehouseData.filter(warehouse => warehouse._id !== _id));
            toast.success('Warehouse deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
            fetchWarehouseData();
        } catch (err) {
            console.error('Delete warehouse error:', err);
            toast.error('Error deleting warehouse!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (warehouseId) => {
        setWarehouseToDelete(warehouseId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const handleDeleteByFind = async (_id) => {
        setError('');
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteWarehouse/${_id}`);
            setSearchedWarehouse(null); // Reset search results
            setWarehouseData(warehouseData.filter(warehouse => warehouse._id !== _id));
            toast.success('Warehouse deleted successfully!', { autoClose: 2000 });
        } catch (err) {
            console.error('Delete warehouse error:', err);
            toast.error('Error deleting warehouse!', { autoClose: 2000 });
        }
    };

    const searchWarehouse = async (query) => {
        setLoading(true);
        setError(""); // Clear any previous error messages

        try {
            if (!query.trim()) {
                // If the query is empty, reset to all products
                setSearchedWarehouse(warehouseData); // Reset to the initial list
                setSuccessStatus("");
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchWarehouse`, {
                params: { keyword: query }, // Send the keyword parameter
            });
            console.log("API Response: ", response.data);
            if (response.data.warehouses && response.data.warehouses.length > 0) {
                setSearchedWarehouse(response.data.warehouses);
                setSuccessStatus("");
            } else {
                setSearchedWarehouse([]); // Clear the table
                setError("No warehouses found for the given query."); // Set error message
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedWarehouse([]); // Clear the table
            setError("No warehouses found for the given query.");
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
                setSuccessStatus("");
                setSearchedWarehouse(warehouseData); // Reset to full list
            } else {
                searchWarehouse(value); // Call the search API with the entered query
            }
        }, 100); // Adjust debounce delay as needed
    };


    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedWarehouse([]);
        }
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="flex items-center">
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by username or warehouse..."
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
                    {permissionData.create_warehouse && (
                    <div>
                        <Link
                            to={'/createWarehouse'}
                            className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                        >
                            Create Warehouse
                        </Link>
                    </div>
                    )}
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : error ? (
                <div className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                    {error}
                </div>
            ) : searchedWarehouse.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ZIP code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created on</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {searchedWarehouse.map((searchedWarehouse) => (
                                <tr key={searchedWarehouse._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedWarehouse.username}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedWarehouse.name}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedWarehouse.mobile}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedWarehouse.country}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedWarehouse.city}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedWarehouse.zip}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(searchedWarehouse.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        <div className='flex items-center'>
                                            {permissionData.edit_warehouse && (
                                            <Link to={`/editWarehouse/${searchedWarehouse._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                            )}
                                            {permissionData.delete_warehouse && (
                                            <button
                                                onClick={() => showConfirmationModal(searchedWarehouse._id)}
                                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-trash"></i>
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
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ZIP code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created on</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {warehouseData.map((warehouse) => (
                                <tr key={warehouse._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{warehouse.username}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{warehouse.name}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{warehouse.mobile}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{warehouse.country}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{warehouse.city}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{warehouse.zip}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(warehouse.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        <div className='flex items-center'>
                                        {permissionData.edit_warehouse && (
                                            <Link to={`/editWarehouse/${warehouse._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                        )}
                                        {permissionData.delete_warehouse && (
                                            <button
                                                onClick={() => showConfirmationModal(warehouse._id)}
                                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(warehouseToDelete)}  // Confirm delete
                message="Are you sure you want to delete this warehouse?"
            />


            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {warehouseData.length > 0 && (
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
            {/* <div className=" ">
                {error && (
                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                        {error}
                    </p>
                )}
            </div> */}
        </div>
    );
}

export default ViewWhereHouseBody;
