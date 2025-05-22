import { useState, useEffect, useRef, useContext } from 'react';
import { Link,useNavigate} from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/login.css';
import { read, utils } from 'xlsx';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { UserContext } from '../../context/UserContext';

function ViewCustomersBody() {
    const [customerData, setCustomerData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedCustomer, setSearchedCustomer] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openPopup, setOpenPopup] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const [error, setError] = useState('');
    const [successStatus, setSuccessStatus] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
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

    const fetchCustomerData = async () => {
        setLoading(true);
        // setError('');
        // setSuccessStatus('');
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCustomer`, {
                params: {
                    sort: '-createdAt',
                    'page[size]': size,
                    'page[number]': page,
                },
            });
            setCustomerData(response.data.customers);
            setSearchedCustomer(response.data.customers);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (error) {
            setError('No customers found.');
            setCustomerData([]);
            setSearchedCustomer([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchCustomerData();
        }
      }, [keyword, page, size,refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    };

    const handleDelete = async (_id) => {
        setError('');
        setSuccessStatus('');
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteCustomer/${_id}`);
            setCustomerData(customerData.filter(customer => customer._id !== _id));
            toast.success('Customer deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
            fetchCustomerData('');
        } catch (error) {
            toast.error('Customer deleted unsuccessful!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (customerId) => {
        setCustomerToDelete(customerId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchCustomer = async (query) => {
        setLoading(true);
        setError(""); // Clear any previous error messages
      
        try {
            if (!query.trim()) {
                // If the query is empty, reset to all products
                setSearchedCustomer(customerData); // Reset to the initial list
                setSuccessStatus("");
                return;
            }
      
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCustomer`, {
                params: { keyword: query }, // Send the keyword parameter
            });
            console.log("API Response: ", response.data);      
            if (response.data.customers && response.data.customers.length > 0) {
                setSearchedCustomer(response.data.customers);
                setSuccessStatus("");
            } else {
                setSearchedCustomer([]); // Clear the table
                setError("No customers found for the given query."); // Set error message
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedCustomer([]); // Clear the table
            setError("No customers found for the given query.");
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
                setSearchedCustomer(customerData); // Reset to full list
            } else {
                searchCustomer(value); // Call the search API with the entered query
            }
        }, 100); // Adjust debounce delay as needed
      };
      
      
      // Handle keydown events
      const handleKeyDown = (e) => {
        const value = e.target.value;
      
        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedCustomer([]);
        }
      };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = utils.sheet_to_json(worksheet);
                    const formattedData = json.map((row) => ({
                        username: row.UserName || '',
                        email: row.Email || '',
                        name: row.Name || '',
                        country: row.Country || '',
                        address: row.Address || '',
                        city: row.City || '',
                        mobile: row['mobile'] || '',
                        nic: row['nic'] || '',
                    }));
                    setExcelData(formattedData);
                    setSuccessStatus('File processed successfully.');
                } catch (error) {
                    setError('Failed to process the file. Ensure it is in the correct format.');
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccessStatus('');
        try {
            if (excelData.length > 0) {
                const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/importCustomers`, { customers: excelData });
                if (response.status === 201) {
                    toast.success('Customer imported successfully!', { autoClose: 2000 }, { className: "custom-toast" });
                    setTimeout(() => {
                        navigate("/viewCustomers");
                    }, 2000);
                    setExcelData([]);
                    setOpenPopup(false);

                    const fetchCustomerData = async () => {
                        setLoading(true);
                        try {
                            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/AllCustomer`);
                            setCustomerData(response.data);
                        } catch (error) {
                            console.error('Fetch customer data error:', error.message);
                        } finally {
                            setLoading(false);
                        }
                    };
                    fetchCustomerData();
                } else {
                    toast.error('Failed to save customers. Please try again.', { autoClose: 2000 }, { className: "custom-toast" });
                    // setError('Failed to save customers. Please try again.');
                }
            } else {
                toast.error('No data to save. Please upload a valid file.', { autoClose: 2000 }, { className: "custom-toast" });
                // setError('No data to save. Please upload a valid file.');
            }
        } catch (error) {
            setOpenPopup(false);
            if (error.response && error.response.data.message === 'Some customers already exist') {
                toast.error(`Customer(s) already exist: ${JSON.stringify(error.response.data.duplicates)}`, { autoClose: 2000 }, { className: "custom-toast" });
                // setError(`Customer(s) already exist: ${JSON.stringify(error.response.data.duplicates)}`);
            } else {
                toast.error('Failed to save customers. Please try again.', { autoClose: 2000 }, { className: "custom-toast" });
                // setError('Failed to save customers. Please try again.');
            }
        }
    };

    const handleClosePopup = () => {
        setOpenPopup(false);
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form 
                    className="flex items-center"
                    >
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by username or customer name..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={keyword}
                        />
                        <button type="button" className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
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
                    {permissionData.import_customer && (
                    <div>
                        <button onClick={() => setOpenPopup(true)} className="submit mr-2 flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center">
                            Import Customer
                        </button>
                    </div>
                    )}
                    {permissionData.create_customer && (
                    <div>
                        <Link
                            to={'/createCustomer'}
                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                        >
                            Create Customer
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
            ) : searchedCustomer.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created on</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {searchedCustomer.map((searchedCustomer) => (
                            <tr key={searchedCustomer._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedCustomer.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedCustomer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{searchedCustomer.mobile}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right justify-end">{new Date(searchedCustomer.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 justify-end">
                                    <div className='flex items-center'>
                                        {permissionData.edit_customer && (
                                        <Link to={`/editCustomerDetails/${searchedCustomer._id}`}
                                            className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                        </Link>
                                        )}
                                        {permissionData.delete_customer && (
                                        <button
                                            onClick={() => showConfirmationModal(searchedCustomer._id)}
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
            ) : customerData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created on</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customerData.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{user.mobile}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right justify-end">
                                        <div className='flex items-center justify-end'>
                                        {permissionData.edit_customer && (
                                            <Link to={`/editCustomerDetails/${user._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                        )}
                                        {permissionData.delete_customer && (
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
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(customerToDelete)}  // Confirm delete
                message="Are you sure you want to delete this customer?"
            />

            {customerData.length > 0 && (
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
            {openPopup && (
                <>
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40" onClick={() => setOpenPopup(false)}></div>
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 h-[450px] overflow-y-auto">
                            <h2 className="text-lg font-semibold mb-4">Import Customer</h2>
                            <div>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className=""
                                />
                            </div>
                            <div className='mt-10'>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Username : Required</label>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Name : Required</label>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">NIC : Required</label>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Mobile : Required</label>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Country : Required</label>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">City : Required</label>
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Address : Required</label>
                            </div>
                            <div>
                                <button onClick={handleSave} className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center">
                                    Save
                                </button>
                                <button onClick={handleClosePopup} className="mt-20 inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px] focus:ring-gray-500 focus:ring-offset-2">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
            <div className='mt-5'>
                {/* Error and Response Messages */}
                {/* {error && <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">{error}</p>} */}
                {successStatus && <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center inline-block">{successStatus}</p>}
            </div>
        </div>
    );
}

export default ViewCustomersBody;