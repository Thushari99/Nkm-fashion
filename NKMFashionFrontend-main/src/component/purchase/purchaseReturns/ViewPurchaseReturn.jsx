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

function ViewPurchaseReturnBody() {
    // State variables
    const { currency } = useCurrency()
    const [purchaseReturnData, setPurchaseReturnData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedSuplierPurchased, setSearchedSuplierPurchased] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openPopupId, setOpenPopupId] = useState(null);
    const popupRef = useRef(null);
    const popupHint = useRef(null);
    const [openViewSale, setOpenViewSale] = useState(null);
    const debounceTimeout = useRef(null);
    const [activeTab, setActiveTab] = useState('company');
    const [refreshKey, setRefreshKey] = useState(0);
    const [filteredSaleData, setFilteredSaleData] = useState(purchaseReturnData);
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyMobile, setCompanyMobile] = useState('');
    const [address, setAddress] = useState('');
    const { toPDF, targetRef } = usePDF({ filename: `${purchaseReturnData.customer || 'invoice'}.pdf` });

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
    const combinedProductData = Array.isArray(searchedSuplierPurchased,) && searchedSuplierPurchased.length > 0
        ? searchedSuplierPurchased
        : Array.isArray(purchaseReturnData) && purchaseReturnData.length > 0
            ? purchaseReturnData
            : [];
    const [payingAmount, setPayingAmount] = useState('');
    const [currentDate] = useState(new Date().toISOString().slice(0, 10));
    const [error, setError] = useState(null);
    const [successStatus, setSuccessStatus] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [purchaseReturnToDelete, setPurchaseReturnToDelete] = useState(null);
    const [hoveredRowId, setHoveredRowId] = useState(null);
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

    const fetchSaleData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/viewPurchaseReturns`, {
                params: {
                    sort: '-createdAt',
                    'page[size]': size, // Use the selected size
                    'page[number]': page,
                },
            });
            setPurchaseReturnData(response.data.data);
            setSearchedSuplierPurchased(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
        } catch (error) {
            console.error('Fetch sale data error:', error);
            setError('No purchase returns found.');
            setPurchaseReturnData([]);
            setSearchedSuplierPurchased([]);
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
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeletePurchaseReturn/${_id}`);
            setPurchaseReturnData(purchaseReturnData.filter(purchase => purchase._id !== _id));
            toast.success('Purchase return deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            setRefreshKey(prevKey => prevKey + 1);
            fetchSaleData();
        } catch (error) {
            console.error('Delete sale error:', error);
            toast.error('Error deleting purchase return!', { autoClose: 2000 });
        }
    };

    const showConfirmationModal = (purchaseReturnId) => {
        setPurchaseReturnToDelete(purchaseReturnId);
        setIsModalOpen(true);
    };

    const searchPurchaseReturn = async (query) => {
        setLoading(true);
        setError("");

        try {
            if (!query.trim()) {
                setSearchedSuplierPurchased(purchaseReturnData);
                setSuccessStatus("");
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchPurchaseReturn`, {
                params: { keyword: query },
            });
            if (response.data.purchaseReturns && response.data.purchaseReturns.length > 0) {
                setSearchedSuplierPurchased(response.data.purchaseReturns);
                setSuccessStatus("");
            } else {
                setSearchedSuplierPurchased([]);
                setError("No purchase returns found for the given query.");
            }
        } catch (error) {
            console.error("Search product error:", error);
            setSearchedSuplierPurchased([]);
            setError("No purchase returns found for the given query.");
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
                setSearchedSuplierPurchased(purchaseReturnData);
            } else {
                searchPurchaseReturn(value);
            }
        }, 100);
    };


    // Handle keydown events
    const handleKeyDown = (e) => {
        const value = e.target.value;

        // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
        if (e.key === 'Backspace' && value === '') {
            setSearchedSuplierPurchased([]);
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


    const handleSaleViewPopUp = async (saleId) => {
        setOpenPopupId(null);
        setPayingAmount('');
        setOpenViewSale(openViewSale === saleId ? null : saleId);
        if (openViewSale !== saleId) {
            const purchase = purchaseReturnData.find((sale) => sale._id === saleId);
            const customerName = purchase.customer;

            try {
                if (customerName !== "") {
                    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCustomerByName?name=${customerName}`);
                    setFilteredSaleData(response.data.customer);
                } else {
                    setFilteredSaleData(purchaseReturnData);
                    setError(error)
                }
            } catch (error) {
                console.log(error);
            }
        }
    };

    const customerReturns = combinedProductData.filter(purchase => purchase.returnType === 'customer');
    const companyReturns = combinedProductData.filter(purchase => purchase.returnType === 'company');

    const renderTable = (data, title) => (
        <div className="overflow-x-auto mb-8">
            <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((purchase) => (
                        <tr key={purchase._id}
                        >
                            <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{purchase.refferenceId}</p></td>
                            <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{purchase.supplier}</p></td>
                            <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900">{purchase.warehouse}</td>
                            <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900">{new Date(purchase.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900">
                                <p className={`rounded-[5px] text-center p-[6px] bg-green-100 text-green-500`}>
                                    {currency}{' '} {formatWithCustomCommas(purchase.grandTotal)}
                                </p>
                            </td>
                            <td className="px-6 py-4  text-left whitespace-nowrap text-m text-gray-900">{currency}{' '} {formatWithCustomCommas(purchase.paidAmount)}</td>
                            <td className="px-6 py-4  flex justify-end text-right whitespace-nowrap text-m text-gray-900">
                                <div className='flex items-center'>
                                    {activeTab === 'company' && permissionData.edit_pur_return && (
                                        <Link to={`/editPurchaseReturn/${purchase._id}`}
                                            className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                        </Link>
                                    )}
                                    {permissionData.delete_pur_return && (
                                        <button
                                            onClick={() => showConfirmationModal(purchase._id)}
                                            className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-trash mr-1"></i>
                                        </button>
                                    )}
                                    {/* {(permissionData.view_pur_return_popup) && ( */}
                                    <button
                                        onClick={() => handleTogglePopup(purchase._id)}
                                        className="text-gray-500 hover:text-gray-700 font-bold py-1 px-2 flex items-center rotate-90"
                                    >
                                        <i className="fa fa-ellipsis-h"></i>
                                    </button>
                                    {/* )} */}

                                    {/* Conditional rendering of the popup for the specific sale._id */}
                                    {openPopupId === purchase._id && (
                                        <div ref={popupRef} className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                                            <ul className="text-sm text-gray-700">
                                                {permissionData.view_pur_return_popup && (
                                                    <li onClick={() => handleSaleViewPopUp(purchase._id)} className="px-4 py-4 hover:bg-gray-100 cursor-pointer flex items-center">
                                                        <i className="fas fa-eye mr-2 text-gray-600"></i> {/* Icon for "View Sale" */}
                                                        View Purchase Return
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </td>
                            {/* View purchase popup */}
                            {openViewSale === purchase._id && (
                                <div ref={popupRef} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                                    <div className="overflow-y-auto scroll-container bg-white w-[1300px] max-h-[90vh] overflow-auto p-8 pt-8 rounded-md shadow-lg mt-40 mb-10">
                                        <div ref={targetRef} className="w-[1250px] p-10 bg-white" style={{ margin: '0 auto', padding: '15px', boxSizing: 'border-box' }}>
                                            {/* Header */}
                                            <div className="mb-6 flex justify-between items-center border-b pb-4">
                                                <h2 className="text-left text-2xl font-bold text-gray-700">Purchase Return Details for {purchase.customer}</h2>
                                            </div>

                                            {/* Sale Info Section */}
                                            <div className="grid grid-cols-3 gap-8 text-gray-700">
                                                {/* Customer Info */}
                                                <div className="border-r pr-8">
                                                    <h3 className="text-lg text-left font-semibold mb-2 p-[8px] bg-gray-100 text-gray-700">
                                                        <i className="fas fa-user mr-2 text-gray-600"></i>
                                                        Supplier Info
                                                    </h3>
                                                    <p className="mb-1 text-left"><i className="fas fa-user ml-2 mr-2 text-gray-400"></i><span className="font-medium">Suplier:</span> {purchase.supplier}</p>

                                                    {filteredSaleData.map((customer) => (
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
                                                    <h3 className="text-left text-lg p-[8px] bg-gray-100 font-semibold mb-2 text-gray-700">
                                                        <i className="fas fa-file-invoice mr-2 text-gray-600"></i>
                                                        Invoice Info
                                                    </h3>
                                                    <p className='mt-2 text-left'>
                                                        <span className="font-medium m-2 mt-4"><i className="fas fa-warehouse mr-1 text-gray-400"></i>Warehouse:</span>
                                                        {purchase.warehouse}
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
                                                            <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Warehouse</th>
                                                            <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product price</th>
                                                            <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Qty</th>
                                                            <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Product tax</th>
                                                            <th className="text-gray-700 py-2 px-4 border-b text-left bg-gray-100 ">Sub total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {purchase.productsData.map((product) => (
                                                            <tr key={product._id} className="text-gray-700">
                                                                {/* <td className="text-left py-2 px-4 border-b">{product.currentID}</td> */}
                                                                <td className="text-left py-2 px-4 border-b">{product.name}</td>
                                                                <td className="text-left py-2 px-4 border-b">{product.warehouse ? product.warehouse : purchase.warehouse}</td>
                                                                <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(product.price)}</td>
                                                                <td className="text-left py-2 px-4 border-b">{product.quantity}</td>
                                                                <td className="py-2 px-4 border-b text-left">{product.taxRate} %</td>
                                                                <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(product.subtotal)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Reason */}
                                            <div className="mt-5 text-left">
                                                <p className="text-left p-4 rounded-md bg-red-100 text-red-400 w-full break-words whitespace-pre-wrap">
                                                    {purchase.note}
                                                </p>
                                            </div>

                                            {/* Additional data */}
                                            <div className="mt-10">
                                                <table className=" mt-10 min-w-[400px] bg-white border border-gray-300">
                                                    <tbody>
                                                        <tr>
                                                            <td className="text-left py-2 px-4 border-b">Tax</td>
                                                            <td className="text-left py-2 px-4 border-b">{purchase.tax} %</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-left py-2 px-4 border-b">Shipping</td>
                                                            <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(purchase.shipping ? purchase.shipping : '0.00')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-left py-2 px-4 border-b">Discount</td>
                                                            <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(purchase.discount ? purchase.discount : '0.00')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-left py-2 px-4 border-b">Total</td>
                                                            <td className="text-left py-2 px-4 border-b">{currency} {formatWithCustomCommas(purchase.grandTotal ? purchase.grandTotal : '0.00')}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        {/* Footer */}
                                        <div className="mt-8 flex justify-end">
                                            {openViewSale === purchase._id && (
                                                <button onClick={() => toPDF()} className="submit px-6 py-3 mr-2 text-white rounded-md shadow-md -600 transition">
                                                    <i className="fas fa-file-pdf mr-2 text-white"></i>
                                                    Download PDF
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setOpenViewSale(null)}
                                                className="px-6 py-3 bg-gray-500 text-white rounded-md shadow-md hover:bg-gray-600 transition">
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
    );

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
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

            <div>
                <div className="flex mb-0">
                    <button
                        className={`px-4 py-2 rounded-tl-md ${activeTab === 'customer' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setActiveTab('customer')}
                    >
                        Customer Returns
                    </button>
                    <button
                        className={`px-4 py-2 rounded-tr-md  ${activeTab === 'company' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setActiveTab('company')}
                    >
                        Company Returns
                    </button>
                </div>
                {loading ? (
                    <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                        <LinearProgress />
                    </Box>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <>
                        {activeTab === 'customer' && renderTable(customerReturns, 'Customer Returns')}
                        {activeTab === 'company' && renderTable(companyReturns, 'Company Returns')}
                    </>
                )}
            </div>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}  // Close modal
                onConfirm={() => handleDelete(purchaseReturnToDelete)}  // Confirm delete
                message="Are you sure you want to delete this purchase return?"
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
export default ViewPurchaseReturnBody;
