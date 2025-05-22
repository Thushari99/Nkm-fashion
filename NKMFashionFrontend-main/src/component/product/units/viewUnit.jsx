import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PaginationDropdown from '../../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import { UserContext } from '../../../context/UserContext';

function ViewUnitBody() {
    // State variables
    const [unitData, setUnitData] = useState([]);
    const [unitName, setUnitName] = useState('');
    const [searchedUnits, setSearchedUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);  
    const [unitToDelete, setUnitToDelete] = useState(null);
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

    // Fetch all unit data
    const fetchUnitData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findAllUnit`, {
                params: {
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            
            // Handle the response format with 'units' key
            if (response.data && response.data.units && Array.isArray(response.data.units)) {
                setUnitData(response.data.units);
                setSearchedUnits(response.data.units);
                setTotalPages(response.data.totalPages || 0);
                setUnitName('');
            } else {
                console.error('Unexpected response format:', response.data);
                setUnitData([]);
                setSearchedUnits([]);
            }
        } catch (error) {
            console.error('Fetch unit data error:', error);
            setUnitData([]);
            setSearchedUnits([]);
            setError('No units found.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (unitName.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchUnitData();
        }
    }, [unitName, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const showConfirmationModal = (_id, isSearchResult = false) => {
        setUnitToDelete({ _id, isSearchResult });// Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const handleDelete = async (_id, isSearchResult = false) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteUnit/${_id}`);
            
            // Update the appropriate lists
            if (isSearchResult) {
                setSearchedUnits(searchedUnits.filter(Unit => Unit._id !== _id));
            }
            setUnitData(unitData.filter(Unit => Unit._id !== _id));
            
            toast.success('Unit deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1); // Trigger a refresh

            if (isSearchResult) {
                fetchUnitData(); // Manually re-fetch the full list
            }

        } catch (error) {
            console.error('Delete unit error:', error);
            toast.error('Error deleting unit!', { autoClose: 2000 });
        } finally {
            setIsModalOpen(false); // Close modal
        }
    };

    const searchUnit = async (query) => {
        setLoading(true);
        setError(''); // Clear any previous error messages
        try {
            if (!query.trim()) {
                // If the query is empty, reset to all base units
                setSearchedUnits(unitData); // Reset to initial list
                setResponseMessage('');
                return;
            }
    
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchUnit`, {
                params: { unitName: query },
            });
            if (response.data.units && response.data.units.length > 0) {
                setSearchedUnits(response.data.units);
                setResponseMessage('');
            } else {
                setSearchedUnits([]); // Clear the table
                setError('No units found for the given query.'); // Set error message
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedUnits([]); // Clear the table
            setError('No units found for the given name.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setUnitName(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedUnits(unitData); // Reset to full list
            } else {
                searchUnit(value);
            }
        }, 100); 
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBrand
        if (e.key === "Backspace" && value === '') {
            setSearchedUnits([]);
        }
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                <form
                        className="flex items-center"
                        onSubmit={(e) => {
                            e.preventDefault();
                            searchUnit(unitName);
                        }}
                    >
                        <input
                           onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by unit..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={unitName}
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
                    {permissionData.create_unit && (
                    <div>
                        <Link
                            to={'/createUnit'}
                            className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                        >
                            Create Unit
                        </Link>
                    </div>
                    )}
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>) : error ? (
                    <div className=" ">
                                {error && (
                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                                        {error}
                                    </p>
                                )}
                            </div>
            ) : searchedUnits.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base units</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {searchedUnits.map((Unit) => (
                                <tr key={Unit._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{Unit.baseUnit}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{Unit.unitName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{Unit.shortName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className='flex items-center justify-end'>
                                            {permissionData.edit_unit && (
                                            <Link to={`/editUnit/${Unit._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                            )}
                                            {permissionData.delete_unit && (
                                            <button
                                                onClick={() => showConfirmationModal(Unit._id, true)}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base units</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {(unitName.trim() ? searchedUnits : unitData).map((Unit) => (
                                <tr key={Unit._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{Unit.baseUnit}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{Unit.unitName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{Unit.shortName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className='flex text-left items-center justify-end'>
                                        {permissionData.edit_unit && (
                                            <Link to={`/editUnit/${Unit._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                        )}
                                        {permissionData.delete_unit && (
                                            <button
                                                onClick={() => showConfirmationModal(Unit._id)}
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
                onConfirm={() => handleDelete(unitToDelete._id, unitToDelete.isSearchResult)}  // Confirm delete
                message="Are you sure you want to delete this unit?"
            />
            {/* Pagination Controls - Visible only when data is loaded */}
<div>
            {unitData.length > 0 && (
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
            {/* Error and Response Messages */}
            <div className="absolute bottom-28 right-0 left-0">
                    {/* {error && (
                        <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                            {error}
                        </p>
                    )} */}
                    {responseMessage && (
                        <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center inline-block">
                            {responseMessage}
                        </p>
                    )}
                </div>
        </div>
    );
}

export default ViewUnitBody;
