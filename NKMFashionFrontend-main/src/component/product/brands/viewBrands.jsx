import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PaginationDropdown from '../../utill/Pagination';
import Icon from '../../../img/tag.png'
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import { UserContext } from '../../../context/UserContext';

function ViewBrandsBody() {
    const [brandData, setBrandData] = useState([]);
    const [brandName, setBrandName] = useState('');
    const [searchedBrand, setSearchedBrand] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [permissionData, setPermissionData] = useState({});
    const { userData } = useContext(UserContext);

    useEffect(() => {
        if (userData?.permissions) {
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

    const fetchBrandData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchBrands`, {
                params: {
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            setBrandData(response.data.data);
            setSearchedBrand(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setBrandName('');
        } catch (error) {
            console.error('Fetch brand data error:', error);
            setBrandData([]);
            setSearchedBrand([]);
            setError('No brands found.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (brandName.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchBrandData();
        }
    }, [brandName, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const handleDelete = async (_id) => {
        setError('');
        setResponseMessage('');
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteBrand/${_id}`);
            setBrandData(brandData.filter((brand) => brand._id !== _id));
            toast.success('Brand deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
            fetchBrandData();
        } catch (error) {
            console.error('Delete brand error:', error);
            toast.error('Error deleting brand!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (brandId) => {
        setBrandToDelete(brandId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchBrand = async (query) => {
        setLoading(true);
        setError('');
        try {
            if (!query.trim()) {
                setSearchedBrand(brandData);
                setResponseMessage('');
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchBrand`, {
                params: { brandName: query },
            });
            if (response.data.brand && response.data.brand.length > 0) {
                setSearchedBrand(response.data.brand);
                setResponseMessage('');
            } else {
                setSearchedBrand([]); // Clear the table
                setError('No brands found for the given query.'); // Set error message
            }
        } catch (error) {
            console.error('Find base unit error:', error);
            setSearchedBrand([]);
            setError('No brands found for the given name.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Searched Brand Data:', searchedBrand);
    }, [searchedBrand]);


    const handleInputChange = (e) => {
        const value = e.target.value;
        setBrandName(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedBrand(brandData); // Reset to full list
            } else {
                searchBrand(value);
            }
        }, 100);
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;
        if (e.key === "Backspace" && value === '') {
            setSearchedBrand([]);
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
                            searchBrand(brandName);
                        }}
                    >
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by brand name..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={brandName}
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
                    {permissionData.create_brand && (
                        <div>
                            <Link
                                to={'/createBrands'}
                                className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                            >
                                Create Brands
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
                ) : searchedBrand.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {searchedBrand.map((searchedBrand) => (
                                    <tr key={searchedBrand._id}>
                                        <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                            <img className="rounded-full" style={{ width: "40px", height: "40px" }} src={searchedBrand && searchedBrand.logo ? searchedBrand.logo : Icon} alt='logo' />
                                        </td>
                                        <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{searchedBrand.brandName}</td>
                                        <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                            <div className='flex justify-end items-center'>
                                                {permissionData.edit_brand && (
                                                    <Link to={`/editBrands/${searchedBrand._id}`}
                                                        className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                        style={{ background: 'transparent' }}
                                                    >
                                                        <i className="fas fa-edit mr-1"></i>
                                                    </Link>
                                                )}
                                                {permissionData.delete_brand && (
                                                    <button
                                                        onClick={() => showConfirmationModal(searchedBrand._id)}
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
                ) : brandData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(brandName.trim() ? searchedBrand : brandData).map((brand) => (
                                    <tr key={brand._id}>
                                        <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                            <img className="rounded-full" style={{ width: "40px", height: "40px" }} src={brand && brand.logo ? brand.logo : Icon} alt='logo' />
                                        </td>
                                        <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{brand.brandName}</td>
                                        <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                            <div className='flex justify-end items-center'>
                                                {permissionData.edit_brand && (
                                                    <Link to={`/editBrands/${brand._id}`}
                                                        className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                        style={{ background: 'transparent' }}
                                                    >
                                                        <i className="fas fa-edit mr-1"></i>
                                                    </Link>
                                                )}
                                                {permissionData.delete_brand && (
                                                    <button
                                                        onClick={() => showConfirmationModal(brand._id)}
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
                <p></p>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(brandToDelete)}  // Confirm delete
                message="Are you sure you want to delete this brand?"
            />

            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {brandData.length > 0 && (
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

export default ViewBrandsBody;
