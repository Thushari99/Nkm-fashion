import { useState, useEffect, useRef } from 'react'
import { useCurrency } from '../../context/CurrencyContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';
import bgrndfour from '../../img/Data-Analysis-explained.jpg';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { PieChart } from 'react-minimal-pie-chart';
import { Bar } from 'react-chartjs-2';
import '../../styles/login.css';
import PaginationDropdown from '../utill/Pagination';
import formatWithCustomCommas from '../utill/NumberFormate';
import Fillter from '../../img/filter.png';
import Profit from '../../img/profits.png';
import Loss from '../../img/loss.png';
import { Chart, registerables } from 'chart.js';
import { handleExportPdf } from '../utill/ExportingPDF';
import ProfitAndLossPDF from './profitAndLossPDF';
Chart.register(...registerables);

const ProfitAndLost = ({ totalSales, totalExpensesAmount, totalGrandTotal, totalProfitAmount, totalPaidAmount }) => {
    const [totalSaleReturnAmount, setTotalSaleReturn] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [expensesData, setExpenses] = useState([]);
    const [totalLost, setTotalLost] = useState(0);
    const [tax, setTax] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [warehouse, setWarehouse] = useState(['all']);
    const [totalDiscountAmount, setTotalDiscountAmount] = useState(0);
    const [fillterOptionPopUp, setFiltterOptionPopUp] = useState(false);
    const [returnProductData, setReturnProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const [timeRange, setTimeStatus] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [saleData, setSaleData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
    const [cashPaymentAmount, setCashPaymentAmount] = useState(0);
    const [checkPaymentAmount, setCheckPaymentAmount] = useState(0);
    const [totalSaleAmount, setTotalSales] = useState(0); 
    const [bankTransferPaymentAmount, setBankTransferPaymentAmount] = useState(0);
    const ref = useRef();
    const { currency } = useCurrency();
    const total = totalProfit + totalLost;
    const profitPercentage = ((totalProfit / total) * 100).toFixed(2);
    const lossPercentage = ((totalLost / total) * 100).toFixed(2);
    const saleReturnLossData = returnProductData;
    const revenueData = saleData;

    const formatAmount = (amount) => {
        const value = amount / 1000;
        if (value >= 1000) {
            return `${(value / 1000).toFixed(2)}M`;
        }
        return `${value.toFixed(2)}K`;
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {

                let url = `${process.env.REACT_APP_BASE_URL}/api`;
                switch (timeRange) {
                    case 'today':
                        url += `/getTodayReportData/${warehouse}`;
                        break;
                    case 'lastweek':
                        url += `/getLastWeekReportData/${warehouse}`;
                        break;
                    case 'lastMonth':
                        url += `/getLastMonthReportData/${warehouse}`;
                        break;
                    case 'lastYear':
                        url += `/getLastYearReportData/${warehouse}`;
                        break;
                    default:
                        url += `/getReportData/${warehouse}`;
                        break;
                }

                const response = await axios.get(url);
                const sales = response.data.data.sales;
                const saleReturns = response.data.data.saleReturns;
                const expenses = response.data.data.expenses;
                setExpenses(response.data.data.expenses);

                const formatAmount = (amount) => {
                    const value = amount / 1000;
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(2)}M`; // For values above 10 lakh
                    }
                    return `${value.toFixed(2)}K`; // For values below 10 lakh
                };

                // Calculate the total paid amount for today's sales and purchase
                const totalSalesAmount = sales.reduce((total, sale) => total + parseFloat(sale.grandTotal || 0), 0);
                const totalProfitAmount = sales.reduce((total, sale) => total + parseFloat(sale.pureProfit || 0), 0);
                const totalSaleReturnAmount = saleReturns.reduce((total, sale) => total + parseFloat(sale.paidAmount || 0), 0);
                const totalExpensesAmount = expenses.reduce((total, expenses) => total + parseFloat(expenses.amount || 0), 0);
                const {totalCard,totalCash,totalBankTransfer} = sales.reduce((acc, sale) => {
                    sale.paymentType.forEach(payment => {
                      const amount = Number(payment.amount) || 0; 
                      switch (payment.type) {
                        case 'card': acc.totalCard += amount; break;
                        case 'cash': acc.totalCash += amount; break;
                        case 'bank_transfer': acc.totalBankTransfer += amount; break;
                        default:
                            break;
                      }
                    });
                    return acc;
                  }, { totalCard: 0, totalCash: 0, totalCheck: 0, totalBankTransfer: 0 });

                const { total, totalTaxAmount } = sales.reduce((totals, sale) => {
                    if (sale && sale.productsData) {
                        let saleTax = 0;

                        if (sale.tax && sale.grandTotal) {
                            saleTax = (parseFloat(sale.tax) / 100) * parseFloat(sale.grandTotal);
                        }
                        sale.productsData.forEach(product => {
                            const quantity = parseInt(product.quantity || 0, 10);
                            const tax = parseFloat(product.taxRate || 0);
                            const price = parseFloat(product.price || 0);

                            const subTotal = price * quantity;
                            totals.total += subTotal;
                            const taxAmount = (tax * price * quantity) + saleTax;
                            totals.totalTaxAmount += taxAmount;
                        });
                    }
                    return totals;
                }, { total: 0, totalTaxAmount: 0 });

                const { grandTotal, totalDiscountAmount } = sales.reduce((totals, sale) => {
                    if (sale && sale.productsData) {
                        let saleSubtotal = 0;
                        let productDiscounts = 0;

                        sale.productsData.forEach(product => {
                            const quantity = parseInt(product.quantity || 0, 10);
                            const price = parseFloat(product.price || 0);
                            const discount = parseFloat(product.discount || 0);
                            const specialDiscount = parseFloat(product.specialDiscount || 0);

                            const subTotal = price * quantity;
                            saleSubtotal += subTotal;
                            productDiscounts += (discount + specialDiscount) * quantity;
                        });

                        let saleDiscount = 0;
                        if (sale.discount) {
                            const discountValue = parseFloat(sale.discount);
                            saleDiscount = sale.discountType === 'percentage'
                                ? saleSubtotal * (discountValue / 100)
                                : discountValue;
                        }
                        const offerDiscount = saleSubtotal * (parseFloat(sale.offerPercentage || 0) / 100);
                        totals.grandTotal += saleSubtotal;
                        totals.totalDiscountAmount += productDiscounts + saleDiscount + offerDiscount;
                    }
                    return totals;
                }, { grandTotal: 0, totalDiscountAmount: 0 });

                setTotalDiscountAmount(totalDiscountAmount);
                setTotalProfit((totalProfitAmount))
                setTotalSales(totalSalesAmount);
                setTotalSaleReturn(formatAmount(totalSaleReturnAmount));
                setTotalExpenses(totalExpensesAmount);
                setTax(totalTaxAmount);
                setCardPaymentAmount(totalCard);
                setCashPaymentAmount(totalCash);
                setBankTransferPaymentAmount(totalBankTransfer);
            } catch (error) {
                console.error('Error fetching report data:', error);
                setError('Failed to fetch report data');
            }
            finally {
                setLoading(false)
            }
        };

        fetchReportData();
    }, [warehouse, timeRange]);

    useEffect(() => {
        const getSaleReturnLost = async () => {
            const url = `${process.env.REACT_APP_BASE_URL}/api/returnProductLostReport/${timeRange}`;
            const response = await axios.get(url);
            const expensesLost = (totalExpenses);
            setReturnProductData(response.data.detailedReturns || []);
            console.log(response.data.detailedReturns)
            const returnLost = (response.data.totalReturnAmount)
            const totalLost = expensesLost + returnLost
            setTotalLost((totalLost))
        }
        getSaleReturnLost();
    }, [totalLost, totalExpenses, timeRange, totalSaleReturnAmount]);

    const fetchSaleData = async () => {
        setLoading(true);
        try {
            let endpoint;
            switch (timeRange) {
                case 'today':
                    endpoint = `${process.env.REACT_APP_BASE_URL}/api/fetchTodaySales/today`;
                    break;
                case 'lastweek':
                    endpoint = `${process.env.REACT_APP_BASE_URL}/api/fetchLastWeekSales/lastweek`;
                    break;
                case 'lastMonth':
                    endpoint = `${process.env.REACT_APP_BASE_URL}/api/fetchLastMonthSales/lastmonth`;
                    break;
                case 'lastYear':
                    endpoint = `${process.env.REACT_APP_BASE_URL}/api/fetchLastYearSales/lastyear`;
                    break;
                default:
                    endpoint = `${process.env.REACT_APP_BASE_URL}/api/fetchSales`;
            }

            const response = await axios.get(endpoint, {
                params: {
                    'page[size]': size,
                    'page[number]': page,
                },
            });
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setSaleData(response.data);
                setTotalPages(Math.ceil(response.data.length / size));
                setKeyword('');
                setLoading(false);
            } else {
                console.warn('No sales data found.');
                setSaleData([]);
                setTotalPages(0);
                setError('No sales data available.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Fetch sale data error:', error);
            setError('No sales found.');
            setLoading(false);
            setSaleData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (keyword.trim() === '') {
            fetchSaleData();
        }
    }, [keyword, page, size, timeRange]);

    const data = {
        labels: ['Profit', 'Loss', 'Tax', 'Discount'],
        datasets: [
            {
                label: 'Amount in Thousands',
                data: [totalProfit, totalLost, tax, totalDiscountAmount],
                backgroundColor: [
                    '#1A5B63',
                    '#44BC8D',
                    '#1A5B63',
                    '#44BC8D',
                ],
                borderColor: [
                    '#1A5B63',
                    '#44BC8D',
                    '#1A5B63',
                    '#44BC8D',
                ],
                borderWidth: 0,
            },
        ],
    };

    useEffect(() => {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
        });
    }, []);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }
    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const handleExport = (data, title, summaryTitle, tableColumns, dataKeys, additionalData) => {
        handleExportPdf({
            data,
            currency,
            title,
            summaryTitle,
            tableColumns,
            dataKeys,
            additionalData: additionalData || {},
        });
    };


    return (
        <div className='dashBody min-h-full pb-10'>
            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : (
                <div>
                    <div className='flex items-center'>
                        <button onClick={() => setFiltterOptionPopUp(true)} className='flex mt-4 ml-8  justify-end'>
                            <img src={Fillter} alt='Fillter' className='w-10 h-10' />
                        </button>
                        <h1 className='ml-2 mt-2'>
                            Status of {timeRange ? timeRange : 'Ever'}
                        </h1>
                        <div className='absolute right-10 items-center'>
                            <PDFDownloadLink
                                document={
                                    <ProfitAndLossPDF
                                        totalProfit={totalProfit}
                                        totalLost={totalLost}
                                        tax={tax}
                                        totalDiscountAmount={totalDiscountAmount}
                                        cashPaymentAmount={cashPaymentAmount}
                                        cardPaymentAmount={cardPaymentAmount}
                                        bankTransferPaymentAmount={bankTransferPaymentAmount}
                                        checkPaymentAmount={checkPaymentAmount}
                                        currency={currency}
                                        totalSales={totalSaleAmount}
                                    />
                                }
                                fileName="profit_and_loss_statement.pdf"
                            >

                                <button
                                    className="submit flex-none mt-4 rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                                >
                                    Export as PDF
                                </button>

                            </PDFDownloadLink>
                        </div>
                    </div>
                </div>
            )}
            <div ref={ref}>
                <div>
                    <div className="pr-10 pl-10 pt-4">
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4 ">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(totalProfit)}
                                        </h1>
                                        <div className='flex justify-end'>
                                            <img src={Profit} alt='profit' className='w-5 h-5 mr-2' />
                                            <p className="text-white text-sm">Profit Amount</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: ' #44BC8D',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(totalLost)}
                                        </h1>
                                        <div className='flex justify-end'>
                                            <img src={Loss} alt='Loss' className='w-4 h-4 mr-2 flex justify-end' />
                                            <p className="text-white text-sm flex justify-end">Loss Amount</p> {/* Sale label */}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(tax)}
                                        </h1>
                                        <p className="text-white text-sm">Tax Amount</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(totalDiscountAmount)}
                                        </h1>
                                        <p className="text-white text-sm">Discount Amount</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(cashPaymentAmount)}
                                        </h1>
                                        <p className="text-white text-sm">Cash Payments</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(cardPaymentAmount)}
                                        </h1>
                                        <p className="text-white text-sm">Card Payments</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(bankTransferPaymentAmount)}
                                        </h1>
                                        <p className="text-white text-sm">Back Transfer</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>

                            <div className="h-28 flex flex-col items-center justify-center rounded-[10px] shadow-md relative" style={{
                                background: '#1A5B63',
                            }} data-aos="fade-down">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-no-repeat bg-cover opacity-5"
                                    style={{ backgroundImage: `url(${bgrndfour})` }}
                                ></div>

                                <div className="flex flex-row items-start space-x-4">
                                    <p className="text-white font-bold mt-[5px] text-2xl">{currency}</p> {/* Shopping Cart Icon */}
                                    <div className="flex flex-col items-start">
                                        <h1 className="text-white font-bold text-center text-[10px] sm:text-[20px] md:text-[20px] lg:text-[24px] xl:text-[28px]">
                                            {formatAmount(checkPaymentAmount)}
                                        </h1>
                                        <p className="text-white text-sm">Check Payments</p> {/* Sale label */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-1 p-10 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                        <div className="mt-2">
                            <Bar data={data} width={800} height={450} />
                        </div>
                        <div className="mt-2">
                            <h1 className="text-left text-center mr-4">Profit and Loss Percentage</h1>
                            <div className='flex justify-center '>
                                <div className="w-full h-full flex justify-center items-start rounded-lg">
                                    <div className="w-[300px] h-[300px]">
                                        <PieChart
                                            data={[
                                                { title: 'Profit', value: totalProfit, color: '#1A5B63' },
                                                { title: 'Loss', value: totalLost, color: '#44BC8D' },
                                            ]}
                                            animate
                                            animationDuration={500}
                                            radius={42} // Default radius value
                                            lineWidth={50}
                                            rounded
                                            paddingAngle={5}
                                            label={({ dataEntry }) => `${Math.round(dataEntry.percentage)}%`}
                                            labelStyle={{
                                                fontSize: '3.5px',
                                                fontFamily: 'sans-serif',
                                                fill: '#fff',
                                            }}
                                            labelPosition={70}
                                        />
                                    </div>
                                </div>
                                <div className="justify-center mt-4">
                                    <div className="flex items-center mr-4">
                                        <div className="w-4 h-4 bg-[#1A5B63] mr-2"></div>
                                        <span>Profit</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-[#44BC8D] mr-2"></div>
                                        <span>Loss</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {fillterOptionPopUp && (
                    <div className="fixed inset-0 pt-28 z-50 bg-gray-900 bg-opacity-50 flex pb-10 ">
                        <div className="bg-white ml-[318px] w-[250px] h-[200px] sm:w-[200px] p-2 rounded-xl shadow-2xl transform scale-100 opacity-0 animate-fadeIn" >
                            <div className=''>
                                <label className="text-left block text-sm font-medium text-gray-700">Duration</label>
                                <select
                                    value={timeRange}
                                    onChange={(e) => {
                                        setTimeStatus(e.target.value);
                                        setFiltterOptionPopUp(false);
                                    }}
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Filter</option>
                                    <option value="today">Today</option>
                                    <option value="lastweek">Last week</option>
                                    <option value="lastMonth">Last Month</option>
                                    <option value="lastYear">Last Year</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative w-full mt-10">
                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                        </Box>
                    ) : (
                        <div className='flex justify-between p-10 z-10'>
                            {returnProductData.length > 0 ? (
                                <div className="overflow-x-auto w-1/2">
                                    <div className="flex justify-between items-center">
                                        <h1 className='text-left text-2xl mb-2 mt-2'>Sale Return Loss</h1>
                                        <button
                                            onClick={() =>
                                                handleExport(
                                                    saleReturnLossData.map(exp => ({
                                                        date: new Date(exp.date).toLocaleDateString(),
                                                        returnAmount: formatWithCustomCommas(exp.returnAmount),
                                                    })),
                                                    'Sale Return Loss Report',
                                                    'Summary of Sale Return Loss',
                                                    ['Date', `Return Amount (${currency})`],
                                                    ['date', 'returnAmount'],
                                                    {
                                                        "Total Sale Return Loss": (totalSaleReturnAmount)  // Correctly format and pass totalSaleReturnAmount as additional data
                                                    }
                                                )
                                            }
                                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                                        >
                                            Export as PDF
                                        </button>




                                    </div>
                                    <div className='max-h-[500px] overflow-y-auto scroll-container'>
                                        <table className="min-w-full bg-white border mb-5 border-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {returnProductData.map((exp) => (
                                                    <tr key={exp._id}>
                                                        <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                            {new Date(exp.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                            {currency}{' '}{formatWithCustomCommas(exp.returnAmount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p>No sale return loss data available.</p>
                            )}

                            {expensesData.length > 0 ? (
                                <div className="overflow-x-auto w-1/2 ml-5">
                                    <div className="flex justify-between items-center">
                                        <h1 className='text-left text-2xl mb-2 mt-2'>Expenses</h1>
                                        <button
                                            onClick={() =>
                                                handleExport(
                                                    expensesData.map(exp => ({
                                                        category: exp.category,
                                                        title: exp.title,
                                                        amount: formatWithCustomCommas(exp.amount)
                                                    })),
                                                    'Expenses Report',
                                                    'Summary of Expenses',
                                                    ['Category', 'Title', `Amount(${currency})`],
                                                    ['category', 'title', 'amount'],
                                                    {
                                                        "Total Expenses": formatWithCustomCommas(totalExpenses) // Changed from totalExpensesAmount
                                                    }
                                                )
                                            }
                                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                                        >
                                            Export as PDF
                                        </button>

                                    </div>
                                    <div className='max-h-[500px] overflow-y-auto' style={{ scrollbarWidth: 'none' }}>
                                        <table className="min-w-full bg-white border mb-5 border-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {expensesData.map((exp) => (
                                                    <tr key={exp._id}>
                                                        <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                            {exp.category}
                                                        </td>
                                                        <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                            {exp.title}
                                                        </td>
                                                        <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                                            {currency}{' '}{formatWithCustomCommas(exp.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p>No expenses data available.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className='pl-10 pr-10 max-h-[800px] overflow-y-auto scroll-container'>
                    <div className="flex justify-between items-center">
                        <h1 className='text-left text-2xl mb-2 mt-2'>Revenue</h1>
                        <button
                            onClick={() =>
                                handleExport(
                                    revenueData.map(revenue => ({
                                        refferenceId: revenue.refferenceId,
                                        date: revenue.date,
                                        orderStatus: revenue.orderStatus,
                                        paymentStatus: revenue.paymentStatus,
                                        grandTotal: formatWithCustomCommas(revenue.grandTotal), // Format Grand Total
                                        paidAmount: formatWithCustomCommas(revenue.paidAmount), // Format Paid Amount
                                        pureProfit: formatWithCustomCommas(revenue.pureProfit) // Format Profit
                                    })),
                                    'Revenue Report',
                                    'Summary of Revenue',
                                    ['Reference', 'Date', 'Status', `Grand Total(${currency})`, `Paid(${currency})`, `Profit(${currency})`],
                                    ['refferenceId', 'date', 'orderStatus', 'grandTotal', 'paidAmount', 'pureProfit'],
                                    {
                                        Profit: profitPercentage + '%',
                                        Loss: lossPercentage + '%',
                                    }
                                )
                            }
                            className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible-outline-2 focus-visible-outline-offset-2 w-40 text-center"
                        >
                            Export as PDF
                        </button>

                    </div>
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {saleData.map((sale) => (
                                <tr key={sale._id}>
                                    <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        <p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>{sale.refferenceId}</p>
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900"><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{sale.orderStatus}</p></td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        <p className={`rounded-[5px] text-center p-[6px] ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-500' : sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-500' :
                                            'bg-red-100 text-red-500'}`}>
                                            {sale.paymentStatus}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {currency}{' '}{formatWithCustomCommas(sale.grandTotal)}
                                    </td>
                                    <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {currency}{' '}{formatWithCustomCommas(sale.paidAmount)}
                                    </td>
                                    <td className="px-5 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {currency}{' '}{formatWithCustomCommas(sale.pureProfit ? sale.pureProfit : 0.00)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className=''>
                    {!error && saleData.length > 0 && (
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
            </div>
        </div>
    )
}
export default ProfitAndLost
