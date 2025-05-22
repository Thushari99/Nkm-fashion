import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/role.css';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ReactToPrint from "react-to-print";
import PrintZbill from './PrintZbill';
import { useReactToPrint } from 'react-to-print';
import { UserContext } from '../../context/UserContext';
import { FaCalendarAlt, FaClock, FaUser, FaMoneyBillWave, FaCashRegister, FaCreditCard, FaUniversity, FaTag, FaBalanceScale } from 'react-icons/fa';
import Fillter from '../../img/filter.png';

const ZBill = () => {
    const { currency } = useCurrency()
    const [saleData, setSaleData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedCustomerSale, setSearchedCustomerSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const popupRef = useRef(null);
    const [openCashDetails, setCashDetails] = useState(null);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zBillToDelete, setZbillToDelete] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [permissionData, setPermissionData] = useState({});
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyMobile, setCompanyMobile] = useState('');
    const [fillterOptionPopUp, setFiltterOptionPopUp] = useState(false)
    const [logo, setLogo] = useState(null);
    const [date, setDate] = useState('');
    const { userData } = useContext(UserContext);
    const printRefs = useRef({})
    //const { toPDF, targetRef } = usePDF({ filename: `${saleData.customer || 'invoice'}.pdf` });
    const combinedProductData = searchedCustomerSale ? searchedCustomerSale : saleData;

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

    const fetchZData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/zreading`, {
                params: {
                    'page[number]': page, 
                    'page[size]': size,   
                },
            });
            setSaleData(response.data.data);
            setSearchedCustomerSale(response.data.data);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
            setError('');
        } catch (error) {
            console.error('Fetch sale data error:', error);
            setError('No adjustments found.');
            setSaleData([]);
            setSearchedCustomerSale([]);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all customers
    useEffect(() => {
        if (keyword.trim() === '') {
            fetchZData();
        }
    }, [keyword, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const showConfirmationModal = (zBillId) => {
        setZbillToDelete(zBillId);
        setIsModalOpen(true);
    };

    const handleSaleViewPopUp = async (saleId) => {
        setCashDetails(openCashDetails === saleId ? null : saleId);
    };

    useEffect(() => {
        AOS.init({
            duration: 400,
            easing: 'ease-in-out',
            once: true,
        });
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
            setEmail(data.email || '');
            setCompanyName(data.companyName || '');
            setCompanyMobile(data.companyMobile || '');
            setLogo(data.logo || null);
        } catch (error) {
            console.error("[DEBUG] Error fetching settings:", error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchZDataByDate = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getZreadingByDate`, {
                    params: {
                        'page[size]': size,
                        'page[number]': page,
                        date: date,
                    },
                });
                setSaleData(response.data.data);
                setSearchedCustomerSale(response.data.data);
                setTotalPages(response.data.totalPages || 0);
                setKeyword('');
                setError('');
            } catch (error) {
                console.error('Fetch sale data error:', error);
                setError('No adjustments found.');
                setSaleData([]);
                setSearchedCustomerSale([]);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };
        fetchZDataByDate();
    }, [date]);

    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteZBill/${_id}`);
            setSaleData(saleData.filter(sale => sale._id !== _id));
            toast.success('Z bill deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            setRefreshKey(prevKey => prevKey + 1);
            fetchZData();
        } catch (error) {
            console.error('Error deleting Z bill:', error);
            toast.error('Error deleting Z bill!', { autoClose: 2000 }, { className: "custom-toast" });
            if (error.response) {
                console.error('Error details:', error.response.data);
                setError(error.response.data.message || 'An error occurred on the server');
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('No response received from server. Please try again later.');
            } else {
                console.error('Request setup error:', error.message);
                setError(error.message || 'An unexpected error occurred.');
            }
        }
        finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        content: () => printRefs.current,
    });

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <div>
                        <button onClick={() => setFiltterOptionPopUp(true)} className='flex mt-2 mb-2 justify-end'>
                            <img src={Fillter} alt='Fillter' className='w-10 h-10' />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : error ? (
                <div className=" ">
                    {error && (
                        <p className="">
                        </p>
                    )}
                </div>
            ) : combinedProductData.length > 0 ? (
                <div className="overflow-x-auto scroll-container">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Hand In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Transfer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Variance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedProductData.map((zReading) => (
                                <tr key={zReading._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap">{new Date(zReading.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap">{zReading.registerData.openTime.split(', ')[1]}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap">  {new Date(zReading.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap">{zReading.registerData.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500'>{currency} {formatWithCustomCommas(zReading.registerData.cashHandIn)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{currency} {formatWithCustomCommas(zReading.cardPaymentAmount)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{currency} {formatWithCustomCommas(zReading.cashPaymentAmount)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{currency} {formatWithCustomCommas(zReading.bankTransferPaymentAmount)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{currency} {formatWithCustomCommas(zReading.cashVariance)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{currency} {formatWithCustomCommas(zReading.totalDiscountAmount)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{currency} {formatWithCustomCommas(zReading.registerData.cashHandIn + zReading.cardPaymentAmount + zReading.cashPaymentAmount + zReading.bankTransferPaymentAmount)}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className='flex justify-end'>
                                            {permissionData.view_zbills && (
                                                <button
                                                    onClick={() => handleSaleViewPopUp(zReading._id)}
                                                    className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-eye mr-1"></i>
                                                </button>
                                            )}
                                            {permissionData.delete_zbill && (
                                                <button
                                                    onClick={() => showConfirmationModal(zReading._id)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* View Sale popup ref={targetRef}*/}
                                    {openCashDetails === zReading._id && (
                                        <div ref={popupRef} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" data-aos="fade-down">
                                            <div className="overflow-y-auto scroll-container bg-white w-[1300px] max-h-[90vh] overflow-auto rounded-md shadow-lg mt-40 mb-10">
                                                <div className="flex justify-between gap-2 bg-[#35AF87] h-20 p-4 pt-2 items-center ">
                                                    <div className='flex items-center'>
                                                        <img src={logo} className='w-16 h-16' alt='logo' />
                                                        <h1 className='text-lg font-semibold text-white'>{companyName}</h1>
                                                    </div>
                                                    <div className='gap-4 items-center text-right'>
                                                        <h1 className='text-sm text-white'><strong>Mobile</strong> {companyMobile}</h1>
                                                        <h1 className='text-sm text-white'><strong>Email</strong> {email}</h1>
                                                    </div>
                                                </div>
                                                <div className='p-8'>
                                                    {/* Inputs Data */}
                                                    <div className='flex justify-between'>
                                                        <div>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaCalendarAlt className="inline-block mr-2" />
                                                                <strong>Date</strong> {new Date(zReading.createdAt).toLocaleDateString()}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaClock className="inline-block mr-2" />
                                                                <strong>Open Time</strong> {zReading.registerData.openTime.split(', ')[1]}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaClock className="inline-block mr-2" />
                                                                <strong>Close Time</strong>{new Date(zReading.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaUser className="inline-block mr-2" />
                                                                <strong>Username</strong> {zReading.registerData.username}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaMoneyBillWave className="inline-block mr-2" />
                                                                <strong>Cash Hand In</strong> {currency} {formatWithCustomCommas(zReading.registerData.cashHandIn)}
                                                            </h1>
                                                        </div>
                                                        <div className='ml-20'>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaCashRegister className="inline-block mr-2" />
                                                                <strong>Cash Payment</strong> {currency} {formatWithCustomCommas(zReading.cardPaymentAmount)}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaCreditCard className="inline-block mr-2" />
                                                                <strong>Card Payment</strong> {currency} {formatWithCustomCommas(zReading.cashPaymentAmount)}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaUniversity className="inline-block mr-2" />
                                                                <strong>Bank Transfer</strong> {currency} {formatWithCustomCommas(zReading.bankTransferPaymentAmount)}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaTag className="inline-block mr-2" />
                                                                <strong>Discount</strong> {currency} {formatWithCustomCommas(zReading.totalDiscountAmount)}
                                                            </h1>
                                                            <h1 className='text-left mb-1 text-gray-500'>
                                                                <FaBalanceScale className="inline-block mr-2" />
                                                                <strong>Cash Variance</strong> {currency} {formatWithCustomCommas(zReading.totalDiscountAmount)}
                                                            </h1>
                                                        </div>
                                                        <div className='ml-20'>
                                                            <h1 className='text-left text-3xl text-color font-bold'>Total  {currency} {formatWithCustomCommas(zReading.registerData.cashHandIn + zReading.cardPaymentAmount + zReading.cashPaymentAmount + zReading.bankTransferPaymentAmount)}</h1>
                                                        </div>
                                                    </div>
                                                    <div className="mt-6">
                                                        <h2 className="text-lg font-medium text-left text-gray-900">Notes</h2>
                                                        <table className="min-w-full divide-y divide-gray-200 mt-4">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note / Coin</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {zReading.inputs.map(input => (
                                                                    <tr key={input._id}>
                                                                        <td className="px-6 py-4 text-left whitespace-nowrap">{input.denomination}</td>
                                                                        <td className="px-6 py-4 text-left whitespace-nowrap">{input.quantity}</td>
                                                                        <td className="px-6 py-4 text-left whitespace-nowrap">{currency} {formatWithCustomCommas(input.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Footer  */}
                                                    <div className="mt-8 flex justify-end">
                                                        {openCashDetails === zReading._id && (
                                                            <ReactToPrint
                                                                trigger={() => (
                                                                    <button className="submit px-6 py-3 mr-2 text-white rounded-md shadow-md transition">
                                                                       <i className="fas fa-print mr-2 text-white"></i>
                                                                        Print Z Bill
                                                                    </button>
                                                                )}
                                                                content={() => printRefs.current[zReading._id]}
                                                            />
                                                        )}
                                                        <button
                                                            onClick={() => setCashDetails(null)}
                                                            className="px-6 py-3 bg-gray-500 text-white rounded-md shadow-md hover:bg-gray-600 transition">
                                                            Close
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'none' }}>
                                                <PrintZbill
                                                    ref={(el) => (printRefs.current[zReading._id] = el)}
                                                    companyDetails={{
                                                        name: companyName,
                                                        mobile: companyMobile,
                                                        email: email,
                                                        logo: logo
                                                    }}
                                                    zReadingData={zReading}
                                                    registerData={zReading.registerData}
                                                    currency={currency}
                                                    formatCurrency={formatWithCustomCommas}
                                                />
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

            {fillterOptionPopUp && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex pb-10 justify-center items-center">
                    <div className="bg-white w-[350px] sm:w-[400px] p-6 rounded-xl shadow-2xl transform scale-100 opacity-0 animate-fadeIn" >
                        <button
                            onClick={() => setFiltterOptionPopUp(false)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-all"
                        >
                            <img
                                className="w-4 h-4"
                                src="https://th.bing.com/th/id/OIP.Ej48Pm2kmEsDdVNyEWkW0AHaHa?rs=1&pid=ImgDetMain"
                                alt="close"
                            />
                        </button>
                        <h1 className='text-center text-gray-600 font-semi-bold'>Fillters</h1>
                        <div className="mt-5 mb-1">
                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date </label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                autoComplete="given-name"
                                className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                        </div>
                        <div className='flex justify-end'>
                            <button
                                onClick={() => {
                                    setFiltterOptionPopUp(false);
                                    fetchZData();
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(zBillToDelete)}
                message="Are you sure you want to delete this adjustment?"
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
    )
}

export default ZBill