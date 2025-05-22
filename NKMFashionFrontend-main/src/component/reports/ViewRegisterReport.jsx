import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { handleExportPdf } from '../../component/utill/ExportingPDF';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';

function ViedRegisterReportBody() {
    // State management
    const { currency } = useCurrency()
    const [registerData, setRegisterData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef();

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findRegisterData`);
                if (response.data) {
                    setRegisterData(response.data.data);
                } else {
                    console.error('Unexpected response format:', response.data);
                    setRegisterData([]);
                }
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError('Failed to fetch report data');
            }
            finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    const tableColumns = ['Open Time', 'Username', 'User', `Cash Hand In(${currency})`, `Total(${currency})`];
    const dataKeys = ['openTime', 'username', 'name', 'cashHandIn', 'totalBalance'];

     // Calculate summary data
     const totalCashHandIn = registerData.reduce((acc, reg) => acc + (reg.cashHandIn || 0), 0);
     const totalBalance = registerData.reduce((acc, reg) => acc + (reg.totalBalance || 0), 0);
 

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-screen p-5'>
            <div className='absolute right-10'>
            <button
                    onClick={() => handleExportPdf({
                        data: registerData,
                        currency,
                        title: 'Register Report',
                        summaryTitle: 'Summary of the Report',
                        tableColumns,
                        dataKeys,
                        additionalData: {
                            'Total Cash Hand In': `${currency} ${formatWithCustomCommas(totalCashHandIn)}`,
                            'Total Balance': `${currency} ${formatWithCustomCommas(totalBalance)}`
                        }
                    })}
                    className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                >
                    {'Export As PDF'}
                </button>
            </div>
            <div>
                <div ref={ref} className='mt-16'>
                    <div className="ml-6 flex justify-left">
                        <h1 className="text-lightgray-300 m-0 p-0 text-2xl">Registry Report</h1>
                    </div>
                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : registerData.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Time</th>
                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">user</th>
                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash hand in</th>
                                        <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {registerData.map((reg) => (
                                        <tr key={reg._id}>
                                            <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900"><p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">{reg.openTime}</p></td>
                                            <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{reg.username}</td>
                                            <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{reg.name}</td>
                                            <td className="px-4 py-5 text-left whitespace-nowrap text-m text-gray-900"> <p className="rounded-[5px] text-center py-[6px] bg-blue-100 text-blue-500">{currency}{' '} {formatWithCustomCommas(reg.cashHandIn)}</p></td>
                                            <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900"> <p className="rounded-[5px] text-center py-[6px] bg-green-100 text-green-500">{currency}{' '} {formatWithCustomCommas(reg.totalBalance)}</p></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) :
                        <p className='text-center text-gray-700 mt-5'>Not data available</p>}
                </div>
                <div>
                    {error && <p className="text-green-500 mt-5 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}
export default ViedRegisterReportBody;
