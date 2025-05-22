import { useEffect, useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/login.css';
import defaultAvatar from '../../img/user.png';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { UserContext } from '../../context/UserContext';

function ViewUserBody() {
    const [usersData, setUserData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedUser, setSearchedUser] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // State for error messages
    const [successStatus, setSuccessStatus] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
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

    const fetchUserData = async () => {
        setErrorMessage(''); // Clear any previous errors
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchUsers`, {
                params: {
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });

            const sortedUsers = response.data.users.map(user => {
                const truePermissionsCount = Object.values(user.permissions[0] || {}).filter(permission => permission === true).length;
                return { ...user, truePermissionsCount };
            }).sort((a, b) => b.truePermissionsCount - a.truePermissionsCount);

            setUserData(sortedUsers);
            setSearchedUser(sortedUsers);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (error) {
            console.error('Fetch user data error:', error);
            setErrorMessage('No users found.');
            setUserData([]);
            setSearchedUser([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all user data
    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchUserData();
        }
    }, [keyword, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const handleDelete = async (_id) => {
        setErrorMessage(''); // Clear any previous errors
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteUser/${_id}`);
            setUserData(usersData.filter(user => user._id !== _id));
            toast.success('User deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
            fetchUserData('');
        } catch (error) {
            console.error('Delete user error:', error);
            toast.error('Error deleting user!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (userId) => {
        setUserToDelete(userId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchUser = async (query) => {
        setLoading(true);
        setErrorMessage(""); // Clear any previous error messages

        try {
            if (!query.trim()) {
                // If the query is empty, reset to all products
                setSearchedUser(usersData); // Reset to the initial list
                setSuccessStatus("");
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchUser`, {
                params: { keyword: query }, // Send the keyword parameter
            });
            if (response.data.users && response.data.users.length > 0) {
                setSearchedUser(response.data.users);
                setSuccessStatus("");
            } else {
                setSearchedUser([]); // Clear the table
                setErrorMessage("No users found for the given query."); // Set error message
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedUser([]); // Clear the table
            setErrorMessage("No users found for the given query.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Searched product Data:', searchedUser);
    }, [searchedUser]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setKeyword(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === "") {
                setErrorMessage("");
                setSuccessStatus("");
                setSearchedUser(usersData); // Reset to full list
            } else {
                searchUser(value); // Call the search API with the entered query
            }
        }, 100); // Adjust debounce delay as needed
    };


    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedUser([]);
        }
    };

    return (
        <div className='bg-[#F9FAFB] absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="">
                    <div className="relative w-full max-w-md">
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='username'
                            type="text"
                            placeholder="Search by username..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                        />
                        <button className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
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
                    </div>
                </div>
                {permissionData.create_user && (
                <div className="">
                    <Link
                        to={'/createUser'}
                        className="submit absolute right-5 flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                    >
                        Create User
                    </Link>
                </div>
                )}
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : errorMessage ? (
                <div className=" ">
                    {errorMessage && (
                        <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                            {errorMessage}
                        </p>
                    )}
                </div>
            ) :
                searchedUser.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {searchedUser.map((searchedUser) => (
                                    <tr key={searchedUser._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                            <img
                                                style={{ width: "40px", height: "40px" }}
                                                className="rounded-full"
                                                alt="Profile"
                                                src={searchedUser.profileImage ? searchedUser.profileImage : defaultAvatar}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedUser.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedUser.firstName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedUser.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedUser.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedUser.mobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                            <div className='flex items-center justify-end'>
                                            {permissionData.edit_user && (
                                                <Link to={`/editprofilebyadmin/${searchedUser._id}`}
                                                    className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-edit mr-1"></i>
                                                </Link>
                                            )}
                                            {permissionData.delete_user && (
                                                <button
                                                    onClick={() => showConfirmationModal(searchedUser._id)}
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
                ) : usersData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(keyword.trim() ? searchedUser : usersData).map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                            <img
                                                style={{ width: "40px", height: "40px" }}
                                                className="rounded-full"
                                                alt="Profile"
                                                src={user.profileImage ? user.profileImage : defaultAvatar}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.firstName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.mobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
                                            <div className='flex items-center justify-end'>
                                            {permissionData.edit_user && (
                                                <Link to={`/editprofilebyadmin/${user._id}`}
                                                    className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-edit mr-1"></i>
                                                </Link>
                                            )}
                                             {permissionData.delete_user && (
                                                <button
                                                    onClick={() => showConfirmationModal(user._id)}
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
                    <div className="text-center mt-5">
                        <p>No data available</p>
                    </div>
                )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(userToDelete)}  // Confirm delete
                message="Are you sure you want to delete this user?"
            />

            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {usersData.length > 0 && (
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
                {errorMessage && (
                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                        {errorMessage}
                    </p>
                )}
            </div> */}
        </div>
    );
}

export default ViewUserBody;
