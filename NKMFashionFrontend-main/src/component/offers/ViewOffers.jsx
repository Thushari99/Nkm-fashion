import { useState, useEffect, useContext, useRef } from 'react';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { UserContext } from '../../context/UserContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

const ViewOffers = () => {
    const [permissionData, setPermissionData] = useState({});
    const [loading, setLoading] = useState(false);
    const [offersData, setOffers] = useState([]);
    const [offerName, setOfferName] = useState('');
    const [searchOfferData, setSearchOfferData] = useState([]);
    const { userData } = useContext(UserContext);
    const [refreshKey, setRefreshKey] = useState(0);
    const [offerToDelete, setOfferToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const debounceTimeout = useRef(null);
    const searchInputRef = useRef(null);
    const combinedOffersData = searchOfferData.length > 0 ? searchOfferData : offersData;

    useEffect(() => {
        if (userData?.permissions) {
            setPermissionData(extractPermissions(userData.permissions));
        }
    }, [userData]);

    const fetchOfferData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchOffers`, {
                params: {
                    sort: '-createdAt'
                },
            });
            setOffers(response.data.offers);
        } catch (error) {
            setOffers([]);
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchOfferData();
    }, [refreshKey]);

    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteOffer/${_id}`);
            setOffers(offersData.filter(off => off._id !== _id));
            toast.success('Offer deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
        } catch (error) {
            toast.error('Offer deleted unsuccessful!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (offerId) => {
        setOfferToDelete(offerId);
        setIsModalOpen(true);
    };
    
    const searchOffers = async (query) => {
        setLoading(true);
        try {
            if (!query.trim()) {
                setSearchOfferData(offersData);  
                return;
            }
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchOffers`, {
                params: { keyword: query, searchBy: 'offerName' },
            });
    
            if (response.data.offers && response.data.offers.length > 0) {
                setSearchOfferData(response.data.offers);
            } else {
                setSearchOfferData([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchOfferData([]);
        } finally {
            setLoading(false);
            if (searchInputRef.current) {
                searchInputRef.current.focus(); 
            }
        }
    };
    
    // Handle input change with debounce
    const handleInputChange = (e) => {
        const value = e.target.value;
        setOfferName(value);
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setSearchOfferData(offersData);  
            } else {
                searchOffers(value);  
            }
        }, 300); 
    };
    
    const handleKeyDown = (e) => {
        const value = e.target.value;
        if (e.key === "Backspace" && value === '') {
            setSearchOfferData([]); 
        }
    };
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus(); 
        }
    }, [combinedOffersData])

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : (
                <div>
                    <div className='flex justify-between mb-4'>
                        <div className="relative w-full max-w-md">
                            <form
                                className="flex items-center"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    searchOffers(offerName);
                                }}
                            >
                                <input
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    name='keyword'
                                    type="text"
                                    placeholder="Search Offers..."
                                    className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    value={offerName}
                                    ref={searchInputRef} 
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
                            {permissionData.create_offer && (
                                <div>
                                    <Link
                                        to={'/createOffers'}
                                        className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                                    >
                                        Create Offer
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedOffersData.map((off) => (
                                <tr key={off._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{off.offerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{off.percentage} % </p></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{off.createdBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{off.endDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right justify-end">
                                        <div className='flex items-center justify-end'>
                                            {permissionData.edit_offer && (
                                                <Link to={`/editOffers/${off._id}`}
                                                    className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-edit mr-1"></i>
                                                </Link>
                                            )}
                                            {permissionData.delete_offer && (
                                                <button
                                                    onClick={() => showConfirmationModal(off._id)}
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
            )}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(offerToDelete)}
                message="Are you sure you want to delete this customer?"
            />
        </div>
    );
};

export default ViewOffers;