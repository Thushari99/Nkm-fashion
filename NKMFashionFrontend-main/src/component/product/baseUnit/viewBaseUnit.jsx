import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PaginationDropdown from '../../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import { UserContext } from '../../../context/UserContext';

function ViewBaseUnitBody() {
    const [baseunitData, setBaseUnitData] = useState([]);
    const [BaseUnitName, setBaseUnitName] = useState('');
    const [searchedBaseUnits, setSearchedBaseUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);  
    const [baseunitToDelete, setBaseunitToDelete] = useState(null);
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

    const fetchBaseUnitData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/allBaseUnit`, {
                params: {
                    'page[size]': size,
                    'page[number]': page,
                },
            });
            if (response.data && response.data.baseUnits && Array.isArray(response.data.baseUnits)) {
                setBaseUnitData(response.data.baseUnits);
                setSearchedBaseUnits(response.data.baseUnits);
                setTotalPages(response.data.totalPages || 0);
                setBaseUnitName('');
            } else {
                setBaseUnitData([]);
                setSearchedBaseUnits([]);
            }
        } catch (error) {
            console.error('Fetch base unit data error:', error);
            setBaseUnitData([]);
            setSearchedBaseUnits([]);
            setError('Failed to load baseunits. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch all base unit data
    useEffect(() => {
        if (BaseUnitName.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchBaseUnitData();
        }
    }, [BaseUnitName, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    // Handle delete base unit
    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteBaseUnit/${_id}`);
            setBaseUnitData(baseunitData.filter(baseUnit => baseUnit._id !== _id));
            setSearchedBaseUnits(searchedBaseUnits.filter(baseUnit => baseUnit._id !== _id));
            toast.success('Baseunit deleted successfully!', { autoClose: 2000 },{className: "custom-toast"});
            setRefreshKey(prevKey => prevKey + 1);
            fetchBaseUnitData();
        } catch (error) {
            console.error('Delete base unit error:', error);
            toast.error('Error deleting baseunit!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (baseUnitId) => {
        setBaseunitToDelete(baseUnitId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchBaseunit = async (query) => {
        setLoading(true);
        setError(''); // Clear any previous error messages
        try {
            if (!query.trim()) {
                // If the query is empty, reset to all base units
                setSearchedBaseUnits(baseunitData); // Reset to initial list
                setResponseMessage('');
                return;
            }
    
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchBaseunit`, {
                params: { BaseUnitName: query },
            });
            if (response.data.baseUnits && response.data.baseUnits.length > 0) {
                setSearchedBaseUnits(response.data.baseUnits);
                setResponseMessage('');
            } else {
                setSearchedBaseUnits([]); // Clear the table
                setError('No base units found for the given query.'); // Set error message
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedBaseUnits([]); // Clear the table
            setError('No base units found for the given query.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleInputChange = (e) => {
        const value = e.target.value;
        setBaseUnitName(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedBaseUnits(baseunitData); // Reset to full list
            } else {
                searchBaseunit(value);
            }
        }, 100); // Adjust debounce delay as needed
    };

    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedBaseUnits([]);
        }
    };

    const extractPermissions = (permissions) => {
        let extractedPermissions = {};
      
        Object.keys(permissions).forEach((category) => {
          Object.keys(permissions[category]).forEach((subPermission) => {
            extractedPermissions[subPermission] = permissions[category][subPermission];
          });
        });
      
        return extractedPermissions;
      };

    return (
        <div className="relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5">
            <div className="flex justify-between mb-4">
                <div className="relative w-full max-w-md">
                    <form
                        className="flex items-center"
                        onSubmit={(e) => {
                            e.preventDefault();
                            searchBaseunit(BaseUnitName);
                        }}
                    >
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name="keyword"
                            type="text"
                            placeholder="Search by baseunit..."
                            value={BaseUnitName}
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                        />
    
                        <button
                            type="submit"
                            className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"
                        >
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
                {permissionData.create_baseunit && (
                    <div>
                        <Link
                            to={'/createBaseUnit'}
                            className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                        >
                            Create Base Unit
                        </Link>
                    </div>
                )}
                </div>
            </div>
    
            {loading ? (
                <Box
                    sx={{
                        width: '100%',
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        margin: '0',
                        padding: '0',
                    }}
                >
                    <LinearProgress />
                </Box>
            ) : (
                <div className="overflow-x-auto">
                    {searchedBaseUnits.length > 0 || baseunitData.length > 0 ? (
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Base unit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(searchedBaseUnits.length > 0
                                    ? searchedBaseUnits
                                    : baseunitData
                                ).map((baseUnit) => (
                                    <tr key={baseUnit._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                                            {baseUnit.BaseUnitName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                                            {baseUnit.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                                            <div className="flex items-center justify-end">
                                            {permissionData.view_baseunit && (
                                                <Link
                                                    to={`/editBaseUnit/${baseUnit._id}`}
                                                    className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                    style={{
                                                        background: 'transparent',
                                                    }}
                                                >
                                                    <i className="fas fa-edit mr-1"></i>
                                                </Link>
                                            )}
                                            {permissionData.delete_baseunit && (
                                                <button
                                                    onClick={() =>
                                                        showConfirmationModal(
                                                            baseUnit._id
                                                        )
                                                    }
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                    style={{
                                                        background: 'transparent',
                                                    }}
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
                    ) : (
                        <p className="text-gray-600 text-center py-5">
                            No records to display
                        </p>
                    )}
                </div>
            )}
    
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)} // Close modal
                onConfirm={() => handleDelete(baseunitToDelete)} // Confirm delete
                message="Are you sure you want to delete this base unit?"
            />
    
            <div>
                {baseunitData.length > 0 && (
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
    
            <div>
                {error && (
                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                        {error}
                    </p>
                )}
                {responseMessage && (
                    <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center inline-block">
                        {responseMessage}
                    </p>
                )}
            </div>
        </div>
    );
}    

export default ViewBaseUnitBody;
