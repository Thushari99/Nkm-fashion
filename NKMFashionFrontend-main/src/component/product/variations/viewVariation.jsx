import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PaginationDropdown from '../../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import { UserContext } from '../../../context/UserContext';

function ViewVariationBody() {
    const [variationData, setVariationData] = useState([]);
    const [variationName, setVariationName] = useState('');
    const [searchedVariation, setSearchedVariation] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);  
    const [variationToDelete, setVariationToDelete] = useState(null);
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

    const fetchVariationData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findAllVariations`, {
                params: {
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            if (response.data && response.data.variations && Array.isArray(response.data.variations)) {
                setVariationData(response.data.variations);
                setSearchedVariation(response.data.variations);
                setTotalPages(response.data.totalPages || 0);
                setVariationName('');
            } else {
                setVariationData([]);
                setSearchedVariation([]);
            }
        } catch (error) {
            console.error('Error fetching variations:', error);
            setVariationData([]);
            setSearchedVariation([]);
            setError('No variations found.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (variationName.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchVariationData();
        }
    }, [variationName, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }
    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteVariation/${_id}`);
            setVariationData(variationData.filter(variation => variation._id !== _id));
            toast.success('Variation deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
            fetchVariationData();
        } catch (error) {
            console.error('Delete variation error:', error);
            toast.error('Error deleting variation!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (variationId) => {
        setVariationToDelete(variationId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchVariation = async (query) => {
        setLoading(true);
        setError(''); // Clear any previous error messages
        try {
            if (!query.trim()) {
                setSearchedVariation(variationData); // Reset to initial list
                setResponseMessage('');
                return;
            }
    
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchVariation`, {
                params: { variationName: query },
            });
            if (response.data.variation && response.data.variation.length > 0) {
                setSearchedVariation(response.data.variation);
                setResponseMessage('');
            } else {
                setSearchedVariation([]); // Clear the table
                setError('No variations found for the given query.'); // Set error message
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedVariation([]); // Clear the table
            setError('No variations found for the given name.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setVariationName(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedVariation(variationData); // Reset to full list
            } else {
                searchVariation(value);
            }
        }, 100); 
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;
        if (e.key === "Backspace" && value === '') {
            setSearchedVariation([]);
        }
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form 
                    className="flex items-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        searchVariation(variationName);
                    }}
                    >
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='variationName'
                            type="text"
                            placeholder="Search by variation name..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={variationName}
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
                {permissionData.create_variation && (
                <div className="flex items-center">
                    <Link
                        to={'/createVariation'}
                        className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                    >
                        Create Variation
                    </Link>
                </div>
                )}
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
            ) :  searchedVariation.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {searchedVariation.map((searchedVariation) => (
                            <tr key={searchedVariation._id}>
                                <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900">{searchedVariation.variationName}</td>
                                <td className="px-6 text-left py-4 whitespace-nowrap text-m text-gray-900">{searchedVariation.variationType.join(', ')} </td>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                                    <div className='flex items-center justify-end'>
                                    {permissionData.edit_variation && (
                                        <Link to={`/editVariation/${searchedVariation._id}`}
                                            className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                        </Link>
                                    )}
                                    {permissionData.delete_variation && (
                                        <button
                                            onClick={() => showConfirmationModal(searchedVariation._id)}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {(variationName.trim() ? searchedVariation : variationData).map((variation) => (
                                <tr key={variation._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{variation.variationName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{variation.variationType.join(', ')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className='flex items-center justify-end'>
                                        {permissionData.edit_variation && (
                                            <Link to={`/editVariation/${variation._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                        )}
                                        {permissionData.delete_variation && (
                                            <button
                                                onClick={() => showConfirmationModal(variation._id)}
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
                onConfirm={() => handleDelete(variationToDelete)}  // Confirm delete
                message="Are you sure you want to delete this variation?"
            />
            {/* Pagination Controls - Visible only when data is loaded */}
<div>
            {variationData.length > 0 && (
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

export default ViewVariationBody;
