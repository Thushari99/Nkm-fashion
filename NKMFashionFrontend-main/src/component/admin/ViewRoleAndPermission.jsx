// Frontend: ViewRoleAndPermissionBody.js
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/login.css';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { UserContext } from '../../context/UserContext';

function ViewRoleAndPermissionBody() {
    const [permissionData, setPermissionData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedRole, setSearchedRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rolesToDelete, setRolesToDelete] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [permissionDatas, setPermissionDatas] = useState({});
    const { userData } = useContext(UserContext);

    useEffect(() => {
        if (userData?.permissions) {
          console.log("UserData received in useEffect:", userData);
      
          setPermissionDatas(extractPermissions(userData.permissions));
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


    const fetchPermissionData = async () => {
      console.log("Fetching permission data...");
      setLoading(true);
      setError(null); // Reset error message on new fetch
  
      try {
          console.log("Making API request to:", `${process.env.REACT_APP_BASE_URL}/api/getJobRoles`);
          console.log("Request params:", {
              sort: '-createdAt',
              'page[size]': size,
              'page[number]': page,
          });
  
          const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getJobRoles`, {
              params: {
                  sort: '-createdAt',
                  'page[size]': size,
                  'page[number]': page,
              },
          });
  
          console.log("API response received:", response);
  
          if (response.data?.jobRoles) {
              console.log("Setting permission data:", response.data.jobRoles);
  
              // Ensure the ID is properly set
              const formattedData = response.data.jobRoles.map(role => ({
                  id: role.id, // Ensure we use 'id' from backend response
                  roleName: role.roleName,
                  permissions: role.permissions,
              }));
  
              setPermissionData(formattedData);
              setTotalPages(response.data.totalPages || 0);
              setKeyword('');
          } else {
              console.warn("No job roles found in response.");
              setError('No roles found.');
          }
      } catch (error) {
          console.error('Fetch permission data error:', error);
  
          if (error.response) {
              console.error('Server responded with:', error.response.status, error.response.data);
          } else if (error.request) {
              console.error('No response received from server:', error.request);
          } else {
              console.error('Error setting up request:', error.message);
          }
  
          setError('No roles and permissions found.');
      } finally {
          console.log("Fetch attempt completed.");
          setLoading(false);
      }
  };
  
  
  useEffect(() => {
      fetchPermissionData();
  }, [page, size, refreshKey]);
  

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    // Function to handle delete
    const handleDelete = async (_id) => {
        setLoading(true);
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteRole/${_id}`);
            setPermissionData(prevData => prevData.filter(permission => permission._id !== _id));
            toast.success('Role deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            setRefreshKey(prevKey => prevKey + 1);
            fetchPermissionData();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete the role. Please try again.', { autoClose: 2000 });
        } finally {
            setLoading(false);
        }
    };

    const showConfirmationModal = (roleId) => {
        setRolesToDelete(roleId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    // Debounce delay (500ms)
    const debounceDelay = 500;

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (keyword) {
                handleSearch();
            } else {
                setSearchedRole(null); // Clear search results when keyword is empty
            }
        }, debounceDelay);

        return () => clearTimeout(debounceTimer); // Clean up the previous timeout on keyword change
    }, [keyword]); // Only run effect when keyword changes

    const handleSearch = async () => {
        setLoading(true);
        setError(null);  // Reset error message
        setResponseMessage(null); // Reset success message

        try {
            // Use query parameters for real-time search
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findRole`, {
                params: { roleName: keyword }
            });
            if (response.data.length > 0) {
                setSearchedRole(response.data[0]);  // Assuming you want the first result
            } else {
                setSearchedRole(null);
                setError('Role not found.');
            }
        } catch (error) {
            console.error('Find role error:', error);
            setError('Failed to find the role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setKeyword(e.target.value);  // Update search keyword as the user types
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form className="flex items-center">
                        <input
                            onChange={handleInputChange}
                            name='keyword'
                            type="text"
                            placeholder="Search by Role Name..."
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
                  {permissionDatas.create_role && (
                    <div>
                        <Link
                            to={'/createRoleAndPermissions'}
                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                        >
                            Create Permissions
                        </Link>
                    </div>
                    )}
                </div>
            </div>

            {loading ? (
  <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
    <LinearProgress />
  </Box>
) : searchedRole ? (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200 text-xs">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Role</th>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Sub-Permissions</th>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Action</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr key={searchedRole._id}>
          <td className="px-4 py-2 text-left text-gray-900">{searchedRole.roleName}</td>
          <td className="px-4 py-2 text-left text-gray-900">
            {searchedRole.permissions && Object.keys(searchedRole.permissions).map(permissionKey => (
              <div key={permissionKey} >{permissionKey.replace(/([A-Z])/g, ' $1')}</div>
            ))}
          </td>
          <td className="px-4 py-2 text-left text-gray-900">
            {searchedRole.permissions && Object.entries(searchedRole.permissions).map(([permissionKey, subPermissions]) => (
              <div key={permissionKey} className="space-x-2 space-y-4">
                {Object.entries(subPermissions).map(([subPermissionKey, isAllowed], index, array) => (
                  <span 
                    key={subPermissionKey} 
                    className={isAllowed ? 'bg-green-200 px-1 rounded-md text-green-600' : 'bg-red-200 px-1 rounded-md text-red-600'}
                  >
                    {subPermissionKey.replace(/([A-Z])/g, ' $1')}{index < array.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            ))}
          </td>
          <td className="px-4 py-2 text-gray-900">
            <div className='flex items-center'>
              {permissionDatas.edit_role && (
              <Link to={`/editPermissions/${searchedRole._id}`} className="text-blue-500 hover:text-blue-700 font-bold px-2 mr-2">
                <i className="fas fa-edit"></i>
              </Link>
              )}
              {permissionDatas.delete_role && (
              <button onClick={() => showConfirmationModal(searchedRole._id)} className="text-red-500 hover:text-red-700 font-bold px-2">
                <i className="fas fa-trash"></i>
              </button>
              )}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
) : permissionData.length > 0 ? (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200 text-xs">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Role</th>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Sub-Permissions</th>
          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Action</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {permissionData.map((Permission) => (
          <tr key={Permission._id}>
            <td className="px-4 py-2 text-left text-gray-900">{Permission.roleName}</td>
            <td className="px-4 py-2 text-left text-gray-900">
              {Permission.permissions && Object.keys(Permission.permissions).map(permissionKey => (
                <div key={permissionKey}>{permissionKey.replace(/([A-Z])/g, ' $1')}</div>
              ))}
            </td>
            <td className="px-4 py-2 text-left text-gray-900">
              {Permission.permissions && Object.entries(Permission.permissions).map(([permissionKey, subPermissions]) => (
                <div key={permissionKey} className="space-x-2 space-y-4">
                  {Object.entries(subPermissions).map(([subPermissionKey, isAllowed], index, array) => (
                    <span 
                      key={subPermissionKey} 
                      className={isAllowed ? 'bg-green-200 px-1 rounded-md text-green-600' : 'bg-red-200 px-1 rounded-md text-red-600'}
                    >
                      {subPermissionKey.replace(/([A-Z])/g, ' $1')}{index < array.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              ))}
            </td>
            <td className="px-4 py-2 text-gray-900">
              <div className='flex items-center'>
              {permissionDatas.edit_role && (
                <Link to={`/editPermissions/${Permission.id}`} className="text-blue-500 hover:text-blue-700 font-bold px-2 mr-2">
                  <i className="fas fa-edit"></i>
                </Link>
              )}
              {permissionDatas.delete_role && (
                <button onClick={() => showConfirmationModal(Permission.id)} className="text-red-500 hover:text-red-700 font-bold px-2">
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
  <p className="text-gray-500 text-center mt-4 text-xs">No roles and permissions found.</p>
)}




            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(rolesToDelete)}  // Confirm delete
                message="Are you sure you want to delete this role?"
            />
            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {permissionData.length > 0 && (
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
            {error && <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">{error}</p>}
            {responseMessage && <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center inline-block">{responseMessage}</p>}
        </div>
    );
}

export default ViewRoleAndPermissionBody;
