import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/role.css';
import { usePDF } from 'react-to-pdf';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';
import { UserContext } from '../../context/UserContext';

function ViewQuatationBody() {
    // State variables
    const { currency } = useCurrency()
    const [quatationData, setQuatationData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedCustomerQuatation, setSearchedCustomerQuatation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openPopupId, setOpenPopupId] = useState(null);
    const popupRef = useRef(null);
    const [openViewQuatation, setOpenViewQuatation] = useState(null);
    const [filteredQuatationData, setFilteredQuatationData] = useState(quatationData);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);
    const [successStatus, setSuccessStatus] = useState('');
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyMobile, setCompanyMobile] = useState('');
    const [address, setAddress] = useState('');
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const { toPDF, targetRef } = usePDF({ filename: `${quatationData.customer || 'invoice'}.pdf` });
    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedCustomerQuatation) && searchedCustomerQuatation.length > 0
        ? searchedCustomerQuatation
        : Array.isArray(quatationData) && quatationData.length > 0
            ? quatationData
            : [];
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

    const fetchQuatationData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getQuatation`, {
                params: {
                    // sort: '-createdAt',
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            setQuatationData(response.data.data);
            setSearchedCustomerQuatation(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (error) {
            console.error('Fetch sale data error:', error);
            setError('No quotations found.');
            setQuatationData([]);
            setSearchedCustomerQuatation([]);
        } finally {
            setLoading(false);
        }
    };


    // Fetch all customers
    useEffect(() => {
        if (keyword.trim() === '') {
            // Trigger fetching all units when search bar is cleared
            fetchQuatationData();
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
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteQuatation/${_id}`);
            setQuatationData(quatationData.filter(sale => sale._id !== _id));
            toast.success('Quotation deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);
            fetchQuatationData();
        } catch (error) {
            console.error('Delete sale error:', error);
            toast.error('Error deleting quotation!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (quotationId) => {
        setQuotationToDelete(quotationId); // Set the sale ID to be deleted
        setIsModalOpen(true);  // Open the confirmation modal
    };

    const searchQuotation = async (query) => {
        setLoading(true);
        setError(""); // Clear any previous error messages

        try {
            if (!query.trim()) {
                // If the query is empty, reset to all products
                setSearchedCustomerQuatation(quatationData); // Reset to the initial list
                setSuccessStatus("");
                return;
            }
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchQuotation`, {
                params: { keyword: query }, // Send the keyword parameter
            });
            if (response.data.quotations && response.data.quotations.length > 0) {
                setSearchedCustomerQuatation(response.data.quotations);
                setSuccessStatus("");
            } else {
                setSearchedCustomerQuatation([]); // Clear the table
                setError("No quotations found for the given query."); // Set error message
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedCustomerQuatation([]); // Clear the table
            setError("No quotations found for the given query.");
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
                setSearchedCustomerQuatation(quatationData); // Reset to full list
            } else {
                searchQuotation(value); // Call the search API with the entered query
            }
        }, 100); // Adjust debounce delay as needed
    };


    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedCustomerQuatation([]);
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
        setOpenViewQuatation(openViewQuatation === saleId ? null : saleId);
        if (openViewQuatation !== saleId) {
            const sale = quatationData.find((sale) => sale._id === saleId);
            const customerName = sale.customer;

            try {
                if (customerName !== "") {
                    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCustomerByName?name=${customerName}`);
                    setFilteredQuatationData(response.data.customer);
                    console.log(response.data)
                } else {
                    setFilteredQuatationData(quatationData);
                }
            } catch (error) {
                console.log(error);
            }
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
                            placeholder="Search Quatation..."
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
                    {permissionData.create_quotation && (
                        <div>
                            <Link
                                to={'/createQuotation'}
                                className="submit rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[200px] text-center"
                            >
                                Create Quotation
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
            ) : combinedProductData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedProductData.map((sale) => (
                                <tr key={sale._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.customer}</p></td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{sale.warehouse}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{sale.orderStatus}</p></td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        <p className={`rounded-[5px] text-center p-[6px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-500' :
                                            'bg-red-100 text-red-500'}`}>
                                            {sale.paymentStatus}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500'>{sale.paymentType}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-m text-gray-900">{currency} {formatWithCustomCommas(sale.grandTotal)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-m text-gray-900">{currency} {formatWithCustomCommas(sale.paidAmount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900">
    <div className="flex items-center">
        {permissionData.delete_quotation && (
            <button
                onClick={() => showConfirmationModal(sale._id)}
                className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                style={{ background: 'transparent' }}
            >
                <i className="fas fa-trash mr-1"></i>
            </button>
        )}
        {(permissionData.create_sl_quotation || permissionData.view_quotation_popup || permissionData.edit_quotation) && (
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
                    {permissionData.edit_quotation && !sale.statusOfQuatation && (
                        <li>
                            <Link
                                to={`/editQuotation/${sale._id}`}
                                className="px-4 py-4 hover:bg-gray-100 cursor-pointer flex items-center"
                            >
                                <i className="fas fa-pen mr-2 text-gray-600"></i>
                                Edit Quotation
                            </Link>
                        </li>
                    )}
                    {permissionData.view_quotation_popup && (
                        <li
                            onClick={() => handleSaleViewPopUp(sale._id)}
                            className="px-4 py-4 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                            <i className="fas fa-eye mr-2 text-gray-600"></i>
                            View Quotation
                        </li>
                    )}
                    {!sale.statusOfQuatation && permissionData.create_sl_quotation && (
                        <li>
                            <Link
                                to={`/createSaleFromQuotation/${sale._id}`}
                                className="px-4 py-4 hover:bg-gray-100 cursor-pointer flex items-center"
                            >
                                <i className="fas fa-undo-alt mr-2 text-gray-600"></i>
                                Create Sale
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        )}
    </div>
</td>


                                    {/* View quatation popup */}
                                    {openViewQuatation === sale._id && (
                                        <div ref={popupRef} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                                            <div className="overflow-y-auto scroll-container bg-white w-[1300px] max-h-[90vh] overflow-auto p-8 pt-8 rounded-md shadow-lg mt-40 mb-10">
                                                <div ref={targetRef} className="w-[1250px] p-10 bg-white" style={{ margin: '0 auto', padding: '15px', boxSizing: 'border-box' }}>
                                                    {/* Header */}
                                                    <div className="mb-6 flex justify-between items-center border-b pb-4">
                                                        <h2 className="text-2xl font-bold text-gray-700">Quatation Details for {sale.customer}</h2>
                                                    </div>

                                                    {/* quatation Info Section */}
                                                    <div className="grid grid-cols-3 gap-8 text-gray-700">
                                                        {/* Customer Info */}
                                                        <div className="border-r pr-8">
                                                            <h3 className="text-lg text-left font-semibold mb-2 p-[8px] bg-gray-100 text-gray-700">
                                                                <i className="fas fa-user mr-2 text-gray-600"></i>
                                                                Customer Info
                                                            </h3>
                                                            <p className="mb-1 text-left"><i className="fas fa-user ml-2 mr-2 text-gray-400"></i><span className="font-medium">Customer:</span> {sale.customer}</p>

                                                            {filteredQuatationData.map((customer) => (
                                                                <div>
                                                                    <p className='m-2 text-left'><i className="fas fa-envelope mr-2 text-gray-400"></i><span className="font-medium">Email:</span> {customer.username}</p>
                                                                    <p className='m-2 text-left'><i className="fas fa-city mr-2 text-gray-400"></i><span className="font-medium">City:</span> {customer.city}</p>
                                                                    <p className='m-2 text-left'><i className="fas fa-phone mr-2 text-gray-400"></i><span className="font-medium">Mobile:</span> {customer.mobile}</p>
                                                                </div>
                                                            ))}
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
                                                            <h3 className="text-lg text-left p-[8px] bg-gray-100 font-semibold mb-2 text-gray-700">
                                                                <i className="fas fa-file-invoice mr-2 text-gray-600"></i>
                                                                Invoice Info
                                                            </h3>
                                                            <p className='flex items-center text-left'>
                                                                <span className="font-medium m-2 flex items-center"><i className="fas fa-money-bill-wave mr-1 text-gray-400"></i>Payment status:</span>
                                                                <span className={`w-20 flex items-center rounded-[5px] pl-[15px] text-center m-2 p-[2px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                                                                    {sale.paymentStatus}
                                                                </span>
                                                            </p>
                                                            <p className='flex items-center text-left'>
                                                                <span className=" flex items-center font-medium m-2"><i className="fas fa-check-circle mr-1 text-gray-400"></i>Order status:</span>
                                                                <span className=' flex items-center w-20 rounded-[5px] pl-[5px] text-center m-2 p-[2px] bg-green-100 text-green-500'>
                                                                    {sale.orderStatus}
                                                                </span>
                                                            </p>
                                                            <p className='mt-2 text-left'>
                                                                <span className="font-medium m-2 mt-4"><i className="fas fa-warehouse mr-1 text-gray-400"></i>Warehouse:</span>
                                                                {sale.warehouse}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Product data */}
                                                    <div className="mt-10">
                                                        <h3 className="text-md  mt-5 text-left p-[2px] text-gray-700">Product Details</h3>
                                                        <table className=" mt-4 min-w-full bg-white border border-gray-300">
                                                            <thead>
                                                                <tr>
                                                                    {/* <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product ID</th> */}
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product name</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Variation Type</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product price</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Qty</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product tax</th>
                                                                    <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Sub total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {sale.productsData.map((product) => (
                                                                    <tr key={product._id} className="text-gray-700">
                                                                        {/* <td className="text-left py-2 px-4 border-b">{product.currentID}</td> */}
                                                                        <td className="text-left py-2 px-4 border-b">{product.name}</td>
                                                                        <td className="py-2 text-left px-4 border-b">{product.variationValue ? product.variationValue : 'No Variations'}</td>
                                                                        <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(product.price)}</td>
                                                                        <td className="text-left py-2 px-4 border-b">{product.quantity}</td>
                                                                        <td className="py-2 px-4 border-b text-left">{product.taxRate * 100} %</td>
                                                                        <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(product.subtotal)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Additional data */}
                                                    <div className="mt-10">
                                                        <table className=" mt-10 min-w-[400px] bg-white border border-gray-300">
                                                            <tbody>
                                                                <tr>
                                                                    <td className="text-left py-2 px-4 border-b">Tax</td>
                                                                    <td className="text-left py-2 px-4 border-b">{sale.tax} %</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="text-left py-2 px-4 border-b">Shipping</td>
                                                                    <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(sale.shipping ? sale.shipping : '0.00')}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="text-left py-2 px-4 border-b">Discount</td>
                                                                    <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(sale.discount ? sale.discount : '0.00')}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="text-left py-2 px-4 border-b">Total</td>
                                                                    <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(sale.grandTotal ? sale.grandTotal : '0.00')}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                {/* Footer */}
                                                <div className="mt-8 flex justify-end">
                                                    {openViewQuatation === sale._id && (
                                                        <button onClick={() => toPDF()} className="submit px-6 py-3 mr-2 text-white  rounded-md shadow-md -600 transition">
                                                            <i className="fas fa-file-pdf mr-2 text-white"></i>
                                                            Download PDF
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setOpenViewQuatation(null)}
                                                        className="px-6 py-3 bg-gray-500 text-white text-left rounded-md shadow-md hover:bg-gray-600 transition">
                                                        Close
                                                    </button>
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
                onConfirm={() => handleDelete(quotationToDelete)}  // Confirm delete
                message="Are you sure you want to delete this quotation?"
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
export default ViewQuatationBody;
