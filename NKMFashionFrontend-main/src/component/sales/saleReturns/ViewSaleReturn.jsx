import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../../styles/role.css';
import { usePDF } from 'react-to-pdf';
import PaginationDropdown from '../../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useCurrency } from '../../../context/CurrencyContext';
import { UserContext } from '../../../context/UserContext';

function ViewSaleReturnBody() {
    // State variables
    const [saleData, setSaleData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedCustomerSale, setSearchedCustomerSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openPopupId, setOpenPopupId] = useState(null);
    const popupRef = useRef(null);
    const [openViewSale, setOpenViewSale] = useState(null);
    const [openViewPayment, setViewPayment] = useState(null);
    const [filteredSaleData, setFilteredSaleData] = useState(saleData);
    const [openEditPopup, setEditPopup] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);  // State for controlling modal visibility
    const [saleReturnToDelete, setSaleReturnToDelete] = useState(null);
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const { currency } = useCurrency();
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyMobile, setCompanyMobile] = useState('');
    const [address, setAddress] = useState('');

    const { toPDF, targetRef } = usePDF({
        filename: `${saleData.length > 0 && saleData[0]?.customer ? saleData[0].customer : 'invoice'}.pdf`
    });

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedCustomerSale) && searchedCustomerSale.length > 0
        ? searchedCustomerSale
        : Array.isArray(saleData) && saleData.length > 0
            ? saleData
            : [];

    const [paymentType, setPaymentType] = useState('');
    const [amountToPay, setAmountToPay] = useState(0);
    const [payingAmount, setPayingAmount] = useState('');
    const [currentDate] = useState(new Date().toISOString().slice(0, 10));
    const [responseMSG, setResponse] = useState('')
    const [paymentData, setPaymentData] = useState([]);
    const [error, setError] = useState(null);
    const [successStatus, setSuccessStatus] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
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


    const fetchSaleData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchSaleReturns`, {
                params: {
                    sort: '-createdAt',
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            setSaleData(response.data.data);
            setSearchedCustomerSale(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (error) {
            console.error('Fetch sale data error:', error);
            setError('No sale returns found.');
            setSaleData([]);
            setSearchedCustomerSale([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all customers
    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchSaleData();
        }
    }, [keyword, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }


    // Handle delete customer
    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteSaleReturn/${_id}`);
            setSaleData(saleData.filter(sale => sale._id !== _id));
            toast.success('Sale return deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            setRefreshKey(prevKey => prevKey + 1);
            fetchSaleData();
        } catch (error) {
            console.error('Delete sale error:', error);
            toast.error('Error deleting sale return!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (saleReturnId) => {
        setSaleReturnToDelete(saleReturnId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchSaleReturn = async (query) => {
        setLoading(true);
        setError(""); // Clear any previous error messages

        try {
            if (!query.trim()) {
                // If the query is empty, reset to all products
                setSearchedCustomerSale(saleData); // Reset to the initial list
                setSuccessStatus("");
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchSaleReturn`, {
                params: { keyword: query }, // Send the keyword parameter
            });
            if (response.data.saleReturns && response.data.saleReturns.length > 0) {
                setSearchedCustomerSale(response.data.saleReturns);
                setSuccessStatus("");
            } else {
                setSearchedCustomerSale([]); // Clear the table
                setError("No sale returns found for the given query."); // Set error message
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedCustomerSale([]); // Clear the table
            setError("No sale returns found for the given query.");
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
                setSearchedCustomerSale(saleData); // Reset to full list
            } else {
                searchSaleReturn(value); // Call the search API with the entered query
            }
        }, 100); // Adjust debounce delay as needed
    };


    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedCustomerSale([]);
        }
    };

    const handleTogglePopup = (saleId) => {
        setOpenPopupId(openPopupId === saleId ? null : saleId);
    };

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setOpenPopupId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [popupRef]);

    const handleSaleViewPopUp = async (saleId) => {
        setOpenPopupId(null);
        setPayingAmount('');
        setOpenViewSale(openViewSale === saleId ? null : saleId);
        if (openViewSale !== saleId) {
            const sale = saleData.find((sale) => sale._id === saleId);
            const customerName = sale.customer;

            try {
                if (customerName !== "") {
                    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCustomerByName?name=${customerName}`);
                    setFilteredSaleData(response.data.customer);
                } else {
                    setFilteredSaleData(saleData);
                }
            } catch (error) {
                console.log(error);
            }
        }
    };

    const handleEditClick = (saleId) => {
        alert(saleId);
        setPayingAmount('');
        setResponse('');
        setEditPopup(openEditPopup === saleId ? null : saleId);
    };

    const savePayingData = async (e, saleId, grandTotal) => {
        e.preventDefault()
        const paidData = {
            saleId,
            amountToPay: grandTotal,
            payingAmount,
            currentDate,
            paymentType
        }
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/payingForSale`, paidData);
            if (response.data) {
                setResponse(response.data.message ? response.data.message : response.data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        let isMounted = true;
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
                if (isMounted) {
                    setEmail(data.email || '');
                    setCompanyName(data.companyName || '');
                    setCompanyMobile(data.companyMobile || '');
                    setAddress(data.address || '');
                    if (data.defaultWarehouse) {
                        sessionStorage.setItem('defaultWarehouse', data.defaultWarehouse);
                    }
                    else {
                        console.warn("[DEBUG] No logo received in API response!");
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("[DEBUG] Error fetching settings:", error);
                }
            }
        };
        fetchSettings(); return () => { isMounted = false; };
    }, []);

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form onSubmit={(e) => e.preventDefault()} className="flex items-center">
                        <input
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by reference ID..."
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
            ) : combinedProductData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amout</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Amout</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedProductData.map((sale) => (
                                <tr key={sale._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.refferenceId}</p></td>
                                    <td className="px-6 py-4 text-leftwhitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.customer}</p></td>
                                    <td className="px-6 py-4 text-leftwhitespace-nowrap text-m text-gray-900">{sale.warehouse}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900">
                                        <p className={`rounded-[5px] text-center p-[6px] bg-green-100 text-green-500`}>
                                            {currency}{' '} {formatWithCustomCommas(sale.grandTotal)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '} {formatWithCustomCommas(sale.paidAmount)}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{currency}{' '} {formatWithCustomCommas(sale.returnAmount ? sale.returnAmount : 0.00)}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        <div className='flex items-center'>
                                            {/* <Link to={`/editSaleReturn/${sale._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link> */}
                                            {permissionData.delete_sl_return && (
                                                <button
                                                    onClick={() => showConfirmationModal(sale._id)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            )}
                                            {permissionData.view_sl_return_popup && (
                                                <button
                                                    onClick={() => handleTogglePopup(sale._id)}
                                                    className="text-gray-500 hover:text-gray-700 font-bold py-1 px-2 flex items-center rotate-90"
                                                >
                                                    <i className="fa fa-ellipsis-h"></i>
                                                </button>
                                            )}

                                            {/* Conditional rendering of the popup for the specific sale._id */}
                                            {openPopupId === sale._id && (
                                                <div ref={popupRef} className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                                                    <ul className="text-sm text-gray-700">
                                                        {permissionData.view_sl_return_popup && (
                                                            <li onClick={() => handleSaleViewPopUp(sale._id)} className="px-4 py-4 hover:bg-gray-100 cursor-pointer flex items-center">
                                                                <i className="fas fa-eye mr-2 text-gray-600"></i> {/* Icon for "View Sale" */}
                                                                View Sale Return
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {/* View Sale popup */}
                                    {openViewSale === sale._id && (
                                        <div ref={popupRef} className="overflow-y-auto scroll-container fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto py-10 z-50">
                                            <div className="bg-white w-[1300px] p-8 rounded-md shadow-lg min-h-[100px]" data-aos="fade-down">
                                                <div
                                                    ref={targetRef}
                                                    className="w-[1250px] p-10 bg-white"
                                                    style={{
                                                        margin: '0 auto',
                                                        padding: '15px',
                                                        boxSizing: 'border-box',
                                                    }}
                                                >
                                                    {/* Header */}
                                                    <div className="mb-6 flex justify-between items-center border-b pb-4">
                                                        <h2 className="text-2xl font-bold text-gray-700">Sale Return Details for {sale.customer}</h2>
                                                    </div>

                                                    {/* Sale Info Section */}
                                                    <div className="grid grid-cols-3 gap-8 text-gray-700">
                                                        {/* Customer Info */}
                                                        <div className="border-r pr-8">
                                                            <h3 className="text-lg font-semibold mb-2 p-[8px] bg-gray-100 text-gray-700 text-left">
                                                                <i className="fas fa-user mr-2 text-gray-600"></i>
                                                                Customer Info
                                                            </h3>
                                                            <p className="mb-1 text-left"><i className="fas fa-user ml-2 mr-2 text-gray-400"></i><span className="font-medium">Customer:</span> {sale.customer}</p>

                                                            {/* {filteredSaleData.map((customer) => (
                                                                <div>
                                                                    <p className='m-2 text-left'><i className="fas fa-envelope mr-2 text-gray-400"></i><span className="font-medium">Email:</span> {customer.username}</p>
                                                                    <p className='m-2 text-left'><i className="fas fa-city mr-2 text-gray-400"></i><span className="font-medium">City:</span> {customer.city}</p>
                                                                    <p className='m-2 text-left'><i className="fas fa-phone mr-2 text-gray-400"></i><span className="font-medium">Mobile:</span> {customer.mobile}</p>
                                                                </div>
                                                            ))} */}
                                                        </div>

                                                        {/* Company Info */}
                                                        <div className="border-r pr-8">
                                                            <h3 className="text-lg p-[8px] bg-gray-100 font-semibold mb-2 text-gray-700 text-left">
                                                                <i className="fas fa-building mr-2 text-gray-600"></i>
                                                                Company Info
                                                            </h3>
                                                            <p className="m-2 text-left"><i className="fas fa-building mr-2 text-gray-400 text-left"></i><span className="font-medium">Company:</span> {companyName}</p>
                                                            <p className="m-2 text-left"><i className="fas fa-envelope mr-2 text-gray-400 text-left"></i><span className="font-medium">Email:</span> {email}</p>
                                                            <p className="m-2 text-left"><i className="fas fa-phone mr-2 text-gray-400 text-left"></i><span className="font-medium">Phone:</span> {companyMobile}</p>
                                                            <p className="m-2 text-left"><i className="fas fa-map-marker-alt mr-2 text-gray-400 text-left"></i><span className="font-medium ">Address:</span> {address}</p>
                                                        </div>

                                                        {/* Invoice Info <span className="font-medium m-2">Orser status:</span>*/}
                                                        <div>
                                                            <h3 className="text-lg p-[8px] bg-gray-100 font-semibold mb-2 text-gray-700 text-left">
                                                                <i className="fas fa-file-invoice mr-2 text-gray-600"></i>
                                                                Invoice Info
                                                            </h3>
                                                            <p className='mt-2 text-left'>
                                                                <span className="font-medium m-2 mt-4"><i className="fas fa-warehouse mr-1 text-gray-400"></i>Warehouse:</span>
                                                                {sale.warehouse}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Product data */}
                                                    <div className="mt-10">
                                                        <h3 className="text-md  mt-5 text-left p-[2px] text-gray-700">Returned Product Details</h3>
                                                        <table className=" mt-4 min-w-full bg-white border border-gray-300">
                                                            <thead>
                                                                <tr>
                                                                    {/* <th className="text-gray-900 py-2 px-4 border-b text-left bg-gray-100 ">Product ID</th> */}
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product name</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product price</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">tax</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Discount</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Purchased Qty</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Returned Qty</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Sub total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {sale.productsData
                                                                    .filter((product) => product.returnQty !== 0) // Filter out rows where returnQty is 0
                                                                    .map((product) => (
                                                                        <tr key={product._id} className="text-gray-700">
                                                                            {/* <td className="py-2 px-4 border-b">{product.currentID}</td> */}
                                                                            <td className="py-2 px-4 border-b text-left">{product.name}</td>
                                                                            <td className="py-2 px-4 border-b text-left">
                                                                                {currency} {formatWithCustomCommas(product.price)}
                                                                            </td>
                                                                            <td className="py-2 px-4 border-b text-left">{product.taxRate} %</td>
                                                                            <td className="py-2 px-4 border-b text-left">
                                                                                {currency} {formatWithCustomCommas(product.discount)}
                                                                            </td>
                                                                            <td className="py-2 px-4 border-b text-left">{product.quantity}</td>
                                                                            <td className="py-2 px-4 border-b text-left">{product.returnQty}</td>
                                                                            <td className="py-2 px-4 border-b text-left">
                                                                                {currency} {formatWithCustomCommas(product.subtotal)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Reason */}
                                                    <div className="mt-5 text-left">
                                                        <p className="text-left p-4 rounded-md bg-red-100 text-red-400 w-full break-words whitespace-pre-wrap">
                                                            {sale.note}
                                                        </p>
                                                    </div>


                                                    {/* Additional data */}
                                                    <div className="mt-10">
                                                        <table className=" mt-10 min-w-[400px] bg-white border border-gray-300">
                                                            <tbody>
                                                                <tr>
                                                                    <td className="py-2 px-4 border-b text-left">Tax</td>
                                                                    <td className="py-2 px-4 border-b text-left">{sale.tax ? sale.tax : '0'} %</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="py-2 px-4 border-b text-left">Shipping</td>
                                                                    <td className="py-2 px-4 border-b text-left">{currency}{' '} {formatWithCustomCommas(sale.shipping ? sale.shipping : '0.00')}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="py-2 px-4 border-b text-left">Discount</td>
                                                                    <td className="py-2 px-4 border-b text-left">{currency}{' '} {formatWithCustomCommas(sale.discount ? sale.discount : '0.00')}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="py-2 px-4 border-b text-left">Total</td>
                                                                    <td className="py-2 px-4 border-b text-left">{currency}{' '} {formatWithCustomCommas(sale.grandTotal)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="py-2 px-4 border-b text-left">Paid Amount</td>
                                                                    <td className="py-2 px-4 border-b text-left">{currency}{' '} {formatWithCustomCommas(sale.paidAmount)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="py-2 px-4 border-b text-left">Return Amount</td>
                                                                    <td className="py-2 px-4 border-b text-left">{currency}{' '} {formatWithCustomCommas(sale.returnAmount ? sale.returnAmount : '0.00')}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <style>
                                                        {`
                                                              @media print {
                                                              body > :not(.fixed) {
                                                               display: none !important;
                                                            }
                                                             .fixed {
                                                               position: relative !important;
                                                               background: white !important;
                                                               padding: 0 !important;
                                                               margin: 0 !important;
                                                            }
                                                           .bg-white {
                                                               box-shadow: none !important;
                                                               width: 100% !important;
                                                               padding: 0 !important;
                                                            }
                                                            .w-[1250px] {
                                                               width: 100% !important;
                                                               padding: 0 !important;
                                                            }
                                                            `}
                                                    </style>
                                                </div>
                                                {/* Footer */}
                                                <div className="relative items-last flex justify-end print:hidden">
                                                    {openViewSale === sale._id && (
                                                        <button onClick={() => toPDF()} className="submit px-6 py-3 mr-2 text-white  rounded-md shadow-md -600 transition">
                                                            <i className="fas fa-file-pdf mr-2 text-white"></i>
                                                            Download PDF
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setOpenViewSale(null)}
                                                        className="px-6 py-3 bg-gray-500 text-white  rounded-md shadow-md hover:bg-gray-600 transition">
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show payment */}
                                    {openViewPayment === sale._id && (
                                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                                            <div className="bg-white w-[800px] h-[600px] overflow-auto p-8 pt-16 rounded-md shadow-lg mt-40 mb-10">
                                                <h2 className="text-xl text-black-500 font">Payment Details</h2>
                                                <div>
                                                    <table className="mt-10 min-w-full bg-white">
                                                        <thead>
                                                            <tr>
                                                                <td className="text-gray-600 py-2 px-4 border-b text-left bg-gray-100">Date</td>
                                                                <td className="text-gray-600 py-2 px-4 border-b text-left bg-gray-100">Amount</td>
                                                                <td className="text-gray-600 py-2 px-4 border-b text-left bg-gray-100">Paid by</td>
                                                                <td className="text-gray-600 py-2 px-4 border-b text-left bg-gray-100 text-right pr-10">Action</td>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {paymentData && paymentData.length > 0 ? (
                                                                paymentData.map((pd) => (
                                                                    <tr key={pd._id}>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{pd.currentDate}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{currency}{' '}{sale.grandTotal}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">{currency}{' '}{pd.payingAmount ? pd.payingAmount : null}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                                                                            <div className="flex justify-end items-center">
                                                                                <button
                                                                                    onClick={() => handleEditClick(sale._id)}
                                                                                    className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                                                                    style={{ background: 'transparent' }}
                                                                                >
                                                                                    <i className="fas fa-edit mr-1"></i>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => showConfirmationModal(sale._id)}
                                                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                                                    style={{ background: 'transparent' }}
                                                                                >
                                                                                    <i className="fas fa-trash mr-1"></i>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="4" className="text-center py-4">
                                                                        No payment data available.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {/* Edit payment popup */}
                                                {openEditPopup === sale._id && (
                                                    <div className="fixed inset-0 flex justify-center items-center mt-40">
                                                        <div className="bg-white w-[800px] h-[600px] overflow-auto p-8 pt-16 rounded-md shadow-lg mb-10">
                                                            <h1 className="text-gray-600 text-left">Make payment</h1>
                                                            <form>
                                                                <div className="mb-4">
                                                                    <label className="block text-gray-700 mb-2 text-left" htmlFor="date">Date:</label>
                                                                    <input
                                                                        type="date"
                                                                        id="date"
                                                                        value={currentDate}
                                                                        readOnly
                                                                        className="border border-gray-300 rounded p-2 w-full"
                                                                    />
                                                                </div>
                                                                <div className="mb-4">
                                                                    <label className="block text-gray-700 mb-2 text-left" htmlFor="paymentType">Payment type:</label>
                                                                    <select
                                                                        id="paymentType"
                                                                        required
                                                                        value={paymentType}
                                                                        onChange={(e) => setPaymentType(e.target.value)}
                                                                        className="border border-gray-300 rounded p-2 w-full text-left"
                                                                    >
                                                                        <option value="">Select Payment Type</option>
                                                                        <option value="cash">Cash</option>
                                                                        <option value="card">Card</option>
                                                                        <option value="check">Check</option>
                                                                        <option value="bank_transfer">Bank Transfer</option>
                                                                    </select>
                                                                </div>
                                                                <div className="mb-4">
                                                                    <label className="block text-gray-700 mb-2 text-left" htmlFor="amountToPay">Amount To Pay:</label>
                                                                    <input
                                                                        type="number"
                                                                        required
                                                                        id="amountToPay"
                                                                        value={sale.grandTotal}
                                                                        onChange={(e) => setAmountToPay(e.target.value)}
                                                                        className="border border-gray-300 rounded p-2 w-full"
                                                                        placeholder="Enter amount to pay"
                                                                    />
                                                                </div>
                                                                <div className="mb-4">
                                                                    <label className="block text-gray-700 mb-2 text-left" htmlFor="payingAmount">Paying Amount:</label>
                                                                    <input
                                                                        type="number"
                                                                        id="payingAmount"
                                                                        required
                                                                        value={payingAmount}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (Number(value) <= sale.grandTotal) {
                                                                                setPayingAmount(value);
                                                                            } else {
                                                                                setResponse('Paying amount cannot exceed Amount To Pay.');
                                                                            }
                                                                        }}
                                                                        className="border border-gray-300 rounded p-2 w-full"
                                                                        placeholder="Enter paying amount"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end items-center">
                                                                    <button
                                                                        onClick={(e) => savePayingData(e, sale._id, sale.grandTotal)}
                                                                        type="submit"
                                                                        className="text-white submit py-2 px-4 rounded mt-4"
                                                                    >
                                                                        Save Changes
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditPopup(false)}
                                                                        className="px-6 ml-2 mt-[17px] h-[45px] bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 transition"
                                                                    >
                                                                        Close
                                                                    </button>
                                                                </div>
                                                                <div>
                                                                    {responseMSG && <p className="text-green-500 mt-5 text-center">{responseMSG}</p>}
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className='flex items-center'>
                                                    <button onClick={() => handleEditClick(sale._id)} className="px-6 flex items-center submit mt-5 text-white mr-2 h-[40px] rounded-md shadow-md transition">Create Payment</button>
                                                    <button onClick={() => setViewPayment(false)} className="px-6 py-2 bg-gray-500 mt-5 text-white rounded-md shadow-md hover:bg-gray-600 transition">Close</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )
            }

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(saleReturnToDelete)}  // Confirm delete
                message="Are you sure you want to delete this sale return?"
            />

            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {!error && combinedProductData.length > 0 && (
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
        </div >
    );
}

export default ViewSaleReturnBody;