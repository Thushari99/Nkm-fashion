import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PaginationDropdown from '../../utill/Pagination';
import Icon from '../../../img/menu.png'
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import { UserContext } from '../../../context/UserContext';

function ViewCategoryBody() {
    // State variables
    const [categoryData, setCategoryData] = useState([]);
    const [category, setCategory] = useState('');
    const [searchedCat, setSearchedCat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);  
    const [categoryToDelete, setCategoryToDelete] = useState(null);
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

    const fetchCategoryData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCategories`, {
                params: {
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            setCategoryData(response.data.data); // Set the category data to state
            setSearchedCat(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setCategory('');
        } catch (error) {
            console.error('Fetch category data error:', error);
            setError('No categories found.');
            setCategoryData([]);
            setSearchedCat([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all category data
    useEffect(() => {
        if (category.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchCategoryData();
        }
    }, [category, page, size]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    // Handle delete category from full list
    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteCategory/${_id}`);
            setCategoryData(categoryData.filter(category => category._id !== _id));
            toast.success('Category deleted successfully!', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            },{className: "custom-toast"});
            setRefreshKey(prevKey => prevKey + 1);
            fetchCategoryData();
        } catch (error) {
            console.error('Delete category error:', error);
            toast.error('Failed to delete category.', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    const showConfirmationModal = (categoryId) => {
        setCategoryToDelete(categoryId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchCategory = async (query) => {
        setLoading(true);
        setError(''); // Clear any previous error messages
        try {
            if (!query.trim()) {
                // If the query is empty, reset to all base units
                setSearchedCat(categoryData); // Reset to initial list
                setResponseMessage('');
                return;
            }
    
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCategory`, {
                params: { category: query },
            });
            if (response.data.foundCategory && response.data.foundCategory.length > 0) {
                setSearchedCat(response.data.foundCategory);
                console.log('hello cat ',response.data.foundCategory)
                setResponseMessage('');
            } else {
                setSearchedCat([]); 
                setError('No categories found for the given query.'); 
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedCat([]); // Clear the table
            setError('No categories found for the given name.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Searched product Data:', searchedCat);
    }, [searchedCat]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCategory(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedCat(categoryData); // Reset to full list
            } else {
                searchCategory(value);
            }
        }, 100); 
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;
        if (e.key === "Backspace" && value === '') {
            setSearchedCat([]);
        }
    };

    const getCategoryLogo = (logo) => {
        const backendDefault = '/uploads/category/default.jpg'; // backend default partial path
        if (!logo || logo.includes(backendDefault)) {
          return Icon; // use frontend default icon
        }
        return logo;
      };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form 
                    className="flex items-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        searchCategory(category);
                    }}
                    >
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='category'
                            type="text"
                            placeholder="Search by category name..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={category}
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
                    {permissionData.create_category && (
                    <div>
                        <Link
                            to={'/createCategory'}
                            className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                        >
                            Create Category
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
                    <div className=" ">
                                {error && (
                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                                        {error}
                                    </p>
                                )}
                            </div>
            ) : searchedCat.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {searchedCat.map((searchedCat) => (
                            <tr key={searchedCat._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                <img className="rounded-full" style={{ width: "40px", height: "40px" }} src={getCategoryLogo(searchedCat.logo)}  alt='logo' />
                                </td>
                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedCat.category}</td>
                                <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                    <div className='flex justify-end items-center'>
                                    {permissionData.edit_category && (
                                        <Link to={`/editCategory/${searchedCat._id}`}
                                            className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                        </Link>
                                    )}
                                    {permissionData.delete_category && (
                                        <button
                                            onClick={() => showConfirmationModal(searchedCat._id)}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categoryData.map((category) => (
                                <tr key={category._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                        <img className="rounded-full" style={{ width: "40px", height: "40px" }} src={category && category.logo ? category.logo : Icon} alt='logo' />
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{category.category}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className='flex justify-end items-center'>
                                        {permissionData.edit_category && (
                                            <Link to={`/editCategory/${category._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                        )}
                                        {permissionData.delete_category && (
                                            <button
                                                onClick={() => showConfirmationModal(category._id)}
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
                onConfirm={() => handleDelete(categoryToDelete)}  // Confirm delete
                message="Are you sure you want to delete this category?"
            />

           {/* Pagination Controls - Visible only when data is loaded */}
<div>
            {categoryData.length > 0 && (
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
        </div>
        
    );
}

export default ViewCategoryBody;
