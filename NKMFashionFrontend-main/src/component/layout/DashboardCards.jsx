import React, { useState, useEffect, useContext } from 'react';
import { FaMoneyBill, FaCartPlus, FaExchangeAlt, } from 'react-icons/fa';
import '../../styles/dashboardBody.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import AOS from 'aos';
import axios from 'axios';
import 'aos/dist/aos.css'
import bgrnd from '../../img/sales-kpis.png';
import bgrndtwo from '../../img/analysis.jpg';
import bgrndthree from '../../img/Ecommerce-Retail-Business-PNG-Image.png'
import bgrndfour from '../../img/Data-Analysis-explained.jpg';
import QuantityAlertTable from '../reports/quantityAlertTable';
import { Link } from 'react-router-dom';
import CombinedSalesChart from '../layout/salesChart';
import CombinedProfitAndLostChart from '../layout/profitAndLostChart';
import { useCurrency } from '../../context/CurrencyContext';
import { UserContext } from '../../context/UserContext';

const DashboardBody = ({ }) => {
    const { userData } = useContext(UserContext);
    const [totalSaleAmount, setTotalSale] = useState(0);
    const [totalSaleReturnAmount, setTotalSaleReturn] = useState(0);
    const [totalPurchaseAmount, setTotalPurchase] = useState(0);
    const [totalPurchaseReturnAmount, setTotalPurchaseReturn] = useState(0);
    const [todaySaleReturnLost, setTodaySaleReturnLost] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [todayExpensesAmount, setTodayExpenses] = useState(0);
    const [totalLost, setLost] = useState(0);
    const [todayLost, setTodayLost] = useState(0);
    const [todaySale, setTodaySale] = useState([]); // State for today's sales
    const [todayProfit, setTodayProfit] = useState([]);
    const [totalProfit, setTotalProfit] = useState([])
    const [todayPurchase, setTodayPurchase] = useState([]); // State for today's purchases
    const [warehouse, setWarehouse] = useState(['all']);
    const [todaySaleReturn, setTodaySaleReturn] = useState(0);
    const [todayPurchaseReturn, setTodayPurchaseReturn] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const [stokeData, setStokeData] = useState({});
    const [searchedStokeReport, setSearchedStokeReport] = useState(null);
    const { currency } = useCurrency()
    const ProductIcon = 'https://cdn0.iconfinder.com/data/icons/creative-concept-1/128/PACKAGING_DESIGN-512.png';

    const combinedProductData = Array.isArray(searchedStokeReport) && searchedStokeReport.length > 0
        ? searchedStokeReport
        : Array.isArray(stokeData) && stokeData.length > 0
            ? stokeData
            : [];

    const [permissionData, setPermissionData] = useState({});
    
      useEffect(() => {
        if (userData) {
          console.log("UserData received in useEffect:", userData);
          
          const permissions = userData?.permissions || {};
      
          const hasAnyPermission = (permissionKey) => {
            const subPermissions = permissions[permissionKey] || {};
            return Object.values(subPermissions).some(Boolean);
          };
      
          setPermissionData({
            manageProducts: hasAnyPermission("manageProducts"),
            manageBaseUnits: hasAnyPermission("manageBaseUnits"),
            manageUnits: hasAnyPermission("manageUnits"),
            manageVariation: hasAnyPermission("manageVariation"),
            manageBrands: hasAnyPermission("manageBrands"),
            manageProductCategories: hasAnyPermission("manageCategory"),
            manageBarcodePrint: hasAnyPermission("manageBarcodePrint"),
            manageCustomers: hasAnyPermission("manageCustomers"),
            manageUsers: hasAnyPermission("manageUsers"),
            manageSuppliers: hasAnyPermission("manageSuppliers"),
            manageWarehouse: hasAnyPermission("manageWarehouse"),
            manageTransfer: hasAnyPermission("manageTransfer"),
            manageSales: hasAnyPermission("manageSales"),
            manageSaleReturns: hasAnyPermission("manageSaleReturns"),
            managePurchases: hasAnyPermission("managePurchases"),
            managePurchaseReturns: hasAnyPermission("managePurchaseReturns"),
            manageQuotations: hasAnyPermission("manageQuotations"),
            manageCurrency: hasAnyPermission("manageCurrency"),
            manageExpenses: hasAnyPermission("manageExpenses"),
            manageExpensesCategory: hasAnyPermission("manageExpensesCategory"),
            manageRolesAndPermissions: hasAnyPermission("manageRolesAndPermissions"),
            manageReports: hasAnyPermission("manageReports"),
            manageAdjustments: hasAnyPermission("manageAdjustments"),
            manageLanguage: hasAnyPermission("manageLanguage"),
            manageSettings: hasAnyPermission("manageSettings"),
            manageMailSettings: hasAnyPermission("manageMailSettings"),
            manageReceiptSettings: hasAnyPermission("manageReceiptSettings"),
            managePrefixesSettings: hasAnyPermission("managePrefixesSettings"),
            managePOS: hasAnyPermission("managePOS"),
          
            // Extract specific "create" permissions from parent manage permissions
            // create_product: permissions.manageProducts?.create_product || false,
            // create_sale: permissions.manageSales?.create_sale || false,
            view_sale: permissions.manageSales?.view_sale || false,
            view_purchase: permissions.managePurchases?.view_purchase || false,
            view_sl_return: permissions.manageSaleReturns?.view_sl_return || false,
            view_pur_return: permissions.managePurchaseReturns?.view_pur_return || false,
            // create_expense: permissions.manageExpenses?.create_expense || false,
          });
          
        }
      }, [userData]);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true)
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getReportData/${warehouse}`);
                const sales = response.data.data.sales;
                const saleReturns = response.data.data.saleReturns;
                const purchases = response.data.data.purchases;
                const purchaseReturns = response.data.data.purchaseReturns;
                const expenses = response.data.data.expenses;

                const formatAmount = (amount) => {
                    const value = amount / 1000;
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(2)}M`; // For values above 10 lakh
                    }
                    return `${value.toFixed(2)}K`; // For values below 10 lakh
                };

                const today = new Date().toISOString().split('T')[0]; // Example: "2024-12-27"
                const todaySales = sales.filter(sale => {
                    const saleDate = new Date(sale.date).toISOString().split('T')[0];
                    return saleDate === today;
                });

                const todayPurchases = purchases.filter(purchase => {
                    const purchaseDate = new Date(purchase.date).toISOString().split('T')[0];
                    return purchaseDate === today;
                });

                // Filter sale returns and purchase returns for today
                const todaySaleReturns = saleReturns.filter(saleReturn => {
                    const returnDate = new Date(saleReturn.date).toISOString().split('T')[0];
                    return returnDate === today;
                });

                const todayPurchaseReturns = purchaseReturns.filter(purchaseReturn => {
                    const returnDate = new Date(purchaseReturn.date).toISOString().split('T')[0];
                    return returnDate === today;
                });

                const todayExpenses = expenses.filter(expenses => {
                    const returnDate = new Date(expenses.date).toISOString().split('T')[0];
                    return returnDate === today;
                });


                // Calculate the total paid amount for today's sales and purchase
                const totalProfitAmount = sales.reduce((total, sale) => total + parseFloat(sale.pureProfit || 0), 0);
                const totalSaleAmount = sales.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const totalSaleReturnAmount = saleReturns.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const totalPurchaseAmount = purchases.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const totalPurchaseReturnAmount = purchaseReturns.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const todaySaleAmount = todaySales.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const todayPurchaseAmount = todayPurchases.reduce((total, purchase) => total + parseFloat(purchase.paidAmount || 0), 0)
                const todaySaleReturnAmount = todaySaleReturns.reduce((total, saleReturn) => total + parseFloat(saleReturn.paidAmount || 0), 0);
                const todayPurchaseReturnAmount = todayPurchaseReturns.reduce((total, purchaseReturn) => total + parseFloat(purchaseReturn.paidAmount || 0), 0);
                const totalExpensesAmount = expenses.reduce((total, expenses) => total + parseFloat(expenses.amount || 0), 0);
                const todayExpensesAmount = todayExpenses.reduce((total, expenses) => total + parseFloat(expenses.amount || 0), 0);
                const todayProfitAmount = todaySales.reduce((total, sale) => total + parseFloat(sale.pureProfit || 0), 0);

                setTodaySaleReturn(formatAmount(todaySaleReturnAmount));
                setTodayProfit(formatAmount(todayProfitAmount));
                setTotalProfit(formatAmount(totalProfitAmount));
                setTodayPurchaseReturn(formatAmount(todayPurchaseReturnAmount));
                setTotalSale(formatAmount(totalSaleAmount));
                setTotalSaleReturn(formatAmount(totalSaleReturnAmount));
                setTotalPurchase(formatAmount(totalPurchaseAmount));
                setTotalPurchaseReturn(formatAmount(totalPurchaseReturnAmount));
                setTodaySale(formatAmount(todaySaleAmount));
                setTodayPurchase(formatAmount(todayPurchaseAmount));
                setTotalExpenses(totalExpensesAmount);
                setTodayExpenses(todayExpensesAmount);
            } catch (error) {
                console.error('Error fetching report data:', error);
                setError('Failed to fetch report data');
            }
            finally {
                setLoading(false)
            }
        };

        fetchReportData();
    }, [warehouse]);

    useEffect(() => {
        const getSaleReturnLost = async () => {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/returnProductLostReport`);

            const formatAmount = (amount) => {
                const value = amount / 1000;
                if (value >= 1000) {
                    return `${(value / 1000).toFixed(2)}M`; // For values above 10 lakh
                }
                return `${value.toFixed(2)}K`; // For values below 10 lakh
            };
            const expensesLost = (totalExpenses);
            const returnLost = (response.data.totalReturnAmount)
            const totalLost = expensesLost + returnLost
            setLost(formatAmount(totalLost))
        }
        getSaleReturnLost();
    }, [totalLost, totalExpenses, totalSaleReturnAmount]);


    useEffect(() => {
        const getTodaySaleReturnLost = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/returnProductLostReport`);

                const formatAmount = (amount) => {
                    const value = amount / 1000;
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(2)}M`; 
                    }
                    return `${value.toFixed(2)}K`; 
                };

                const { detailedReturns } = response.data;

                if (!Array.isArray(detailedReturns)) {
                    console.error('Unexpected data format: detailedReturns is not an array', detailedReturns);
                    return;
                }

                const today = new Date().toISOString().split('T')[0];
                const todaySaleReturns = detailedReturns.filter(({ date }) => {
                    const returnDate = new Date(date).toISOString().split('T')[0];
                    return returnDate === today;
                });

                const todaySaleReturnAmount = todaySaleReturns.reduce((total, { returnAmount }) => total + returnAmount, 0);

                setTodaySaleReturnLost(todaySaleReturnAmount);

                const todayLostAmount = Number(todayExpensesAmount) + Number(todaySaleReturnLost);
                console.log();
                setTodayLost(formatAmount(todayLostAmount));
            } catch (error) {
                console.error('Error fetching sale return lost data:', error);
            }
        };

        getTodaySaleReturnLost();
    }, [todayExpensesAmount, todayLost, todaySaleReturnLost]);

    useEffect(() => {
        AOS.init({
            duration: 1000, // Animation duration in milliseconds
            easing: 'ease-in-out', // Easing function
            once: true, // Whether animation should happen only once
        });
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findStokeReport/all`);
                if (response.data && response.data.products && Array.isArray(response.data.products)) {
                    setStokeData(response.data.products);
                    setError(null);
                } else {
                    setStokeData([]);
                }
            } catch (err) {
                setError('Failed to fetch report data');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    return (
        <div className='dashBody min-h-full'>
            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : (
                <div>
                    <div className=" p-4 ">
                        <div className="grid gap-4 sm:grid-cols-1 mt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <Link to={permissionData.view_sale ? '/viewSale' : '#'} className={`${!permissionData.view_sale ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg relative" style={{
                                    background: ' #1A5B63',
                                }} data-aos="fade-up">
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                        style={{ backgroundImage: `url(${bgrndthree})` }}
                                    ></div>
                                    <div className="flex flex-row items-start space-x-4">
                                        <FaMoneyBill className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {todaySale}
                                            </h1>
                                            <p className="text-white text-sm">Today Sale</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to={permissionData.view_purchase ? '/viewPurchase' : '#'} className={`${!permissionData.view_purchase ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg relative" style={{
                                    background: ' #44BC8D',
                                }} data-aos="fade-up">
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                        style={{ backgroundImage: `url(${bgrndfour})` }}
                                    ></div>
                                    <div className="flex flex-row items-start space-x-4">
                                        <FaCartPlus className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {todayPurchase}
                                            </h1>
                                            <p className="text-white text-sm">Today Purchase</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to={permissionData.view_pur_return ? '/viewPurchaseReturns' : '#'} className={`${!permissionData.view_pur_return ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg relative" style={{
                                    background: ' #1A5B63',
                                }} data-aos="fade-up">
                                    {/* Background Image */}
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-[5%]"
                                        style={{ backgroundImage: `url(${bgrnd})` }}
                                    ></div>
                                    <div className="flex flex-row items-start space-x-4">
                                        <FaExchangeAlt className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {todayPurchaseReturn}
                                            </h1>
                                            <p className="text-white text-sm">Today Purchase Return</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to={permissionData.view_sl_return ? '/viewSaleReturns' : '#'} className={`${!permissionData.view_sl_return ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                    background: ' #44BC8D',
                                }} data-aos="fade-up">
                                    {/* Background Image */}
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-10"
                                        style={{ backgroundImage: `url(${bgrnd})` }}
                                    ></div>

                                    <div className="flex flex-row items-start space-x-4">
                                        <FaExchangeAlt className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {todaySaleReturn}
                                            </h1>
                                            <p className="text-white text-sm">Today Sale Return</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to={permissionData.view_sale ? '/viewSale' : '#'} className={`${!permissionData.view_sale ? 'cursor-not-allowed' : ''}`}>
                                <div
                                    className="h-28 flex items-center justify-center rounded-[10px] shadow-lg relative"
                                    style={{ backgroundColor: '#1A5B63' }}
                                    data-aos="fade-down"
                                >
                                    {/* Background Image */}
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-10"
                                        style={{ backgroundImage: `url(${bgrnd})` }}
                                    ></div>

                                    {/* Content */}
                                    <div className="flex flex-row items-start space-x-4 relative z-10">
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]" >
                                                {currency}  &nbsp; {totalSaleAmount}
                                            </h1>
                                            <p className="text-white text-sm">Sale</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to={permissionData.view_purchase ? '/viewPurchase' : '#'} className={`${!permissionData.view_purchase ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg relative" style={{
                                    background: ' #1A5B63',
                                }} data-aos="fade-down">

                                    {/* Background Image */}
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-[2%]"
                                        style={{ backgroundImage: `url(${bgrndtwo})` }}
                                    ></div>

                                    <div className="flex flex-row items-start space-x-4">
                                        <FaCartPlus className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {totalPurchaseAmount}
                                            </h1>
                                            <p className="text-white text-sm">Purchase</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to={permissionData.view_sl_return ? '/viewSaleReturns' : '#'} className={`${!permissionData.view_sl_return ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg relative" style={{
                                    background: ' #44BC8D',
                                }} data-aos="fade-down">
                                    {/* Background Image */}
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                        style={{ backgroundImage: `url(${bgrndthree})` }}
                                    ></div>
                                    <div className="flex flex-row items-start space-x-4">
                                        <FaExchangeAlt className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {totalSaleReturnAmount}
                                            </h1>
                                            <p className="text-white text-sm">Sale Return</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                        
                            <Link to={permissionData.view_pur_return ? '/viewPurchaseReturns' : '#'} className={`${!permissionData.view_pur_return ? 'cursor-not-allowed' : ''}`}>
                                <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-lg relative" style={{
                                    background: ' #1A5B63',
                                }} data-aos="fade-down">
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                        style={{ backgroundImage: `url(${bgrndfour})` }}
                                    ></div>
                                    <div className="flex flex-row items-start space-x-4">
                                        <FaExchangeAlt className="text-white w-10 h-10" /> {/* Shopping Cart Icon */}
                                        <div className="flex flex-col items-start">
                                            <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                                {totalPurchaseReturnAmount}
                                            </h1>
                                            <p className="text-white text-sm">Purchase Return</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                        </div>
                        <div>
                            {error && <p className="text-green-500 mt-5 text-center">{error}</p>}
                        </div>
                    </div>
                    <div className="mt-8 ml-5 mr-5 bg-white p-4 rounded-lg  shadow-md" data-aos="fade-down"> {/* Added a white background and padding */}
                        <h2 className="text-2xl mb-4 text-center text-gray-700">Sales and Purchases</h2>
                        <CombinedSalesChart />
                    </div>
                    
                    <div className="mt-8 ml-5 mr-5 bg-white p-4 rounded-lg shadow-md" data-aos="fade-down"> {/* Added a white background and padding */}
                        <h2 className="text-2xl mb-4 text-center text-gray-700">Stock Alert Report</h2> {/* Add a table title */}
                        <div className="max-h-96 overflow-auto">
                            <QuantityAlertTable
                                combinedProductData={combinedProductData}
                                loading={loading}
                                ProductIcon={ProductIcon}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardBody;
