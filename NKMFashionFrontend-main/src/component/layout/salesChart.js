import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import { useCurrency } from '../../context/CurrencyContext'; 

const CombinedSalesChart = () => {
    const [monthlySalesData, setMonthlySalesData] = useState([]);
    const [weeklySalesData, setWeeklySalesData] = useState([]);
    const [dailySalesData, setDailySalesData] = useState([]);
    const [monthlyPurchaseData, setMonthlyPurchaseData] = useState([]);
    const [weeklyPurchaseData, setWeeklyPurchaseData] = useState([]);
    const [dailyPurchaseData, setDailyPurchaseData] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('daily');
    const [chartType, setChartType] = useState('bar');
    const [error, setError] = useState(null);
    const chartRef = useRef(null);
    const [noData, setNoData] = useState(false);
    const [chartInstance, setChartInstance] = useState(null);
     const {currency} = useCurrency()   

useEffect(() => {
    const fetchSalesData = async () => {
        try {
            const [monthlyResponse, weeklyResponse, dailyResponse] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/api/sales/monthly`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/api/sales/weekly`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/api/sales/daily`)
            ]);
            const currentYear = new Date().getFullYear();
            const monthlyDataWithYear = monthlyResponse.data
                .filter(item => new Date(item.date).getFullYear() === currentYear)
                .map(item => ({
                    ...item,
                    label: `${item.label} ${currentYear}`
                }));
            setMonthlySalesData(monthlyDataWithYear);
            setWeeklySalesData(weeklyResponse.data);
            setDailySalesData(dailyResponse.data);
            if (!monthlyDataWithYear.length && !weeklyResponse.data.length && !dailyResponse.data.length) {
                setNoData(true); // No data available
            } else {
                setNoData(false); // Data available
            }
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setError('Failed to fetch sales data');
        }
    };

    const fetchPurchaseData = async () => {
        try {
            const [monthlyResponse, weeklyResponse, dailyResponse] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/api/purchases/monthly`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/api/purchases/weekly`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/api/purchases/daily`)
            ]);
            const currentYear = new Date().getFullYear();
            const monthlyDataWithYear = monthlyResponse.data
                .filter(item => new Date(item.date).getFullYear() === currentYear)
                .map(item => ({
                    ...item,
                    label: `${item.label} ${currentYear}`
                }));
            setMonthlyPurchaseData(monthlyDataWithYear);
            setWeeklyPurchaseData(weeklyResponse.data);
            setDailyPurchaseData(dailyResponse.data);
        } catch (error) {
            console.error('Error fetching purchase data:', error);
            setError('Failed to fetch purchase data');
        }
    };


        fetchSalesData();
        fetchPurchaseData();

        
    }, []);

    useEffect(() => {
        if (selectedPeriod === 'monthly' && monthlySalesData.length && monthlyPurchaseData.length) {
            renderChart(monthlySalesData, monthlyPurchaseData, 'Monthly Sales and Purchases (LKR)', formatMonthlyLabels);
        } else if (selectedPeriod === 'weekly' && weeklySalesData.length && weeklyPurchaseData.length) {
            renderChart(weeklySalesData, weeklyPurchaseData, 'Weekly Sales and Purchases (LKR)', formatWeeklyLabels);
        } else if (selectedPeriod === 'daily' && dailySalesData.length && dailyPurchaseData.length) {
            renderDailyChart(dailySalesData, dailyPurchaseData, 'Daily Sales and Purchases (LKR)');
        }
    }, [selectedPeriod, chartType, monthlySalesData, weeklySalesData, dailySalesData, monthlyPurchaseData, weeklyPurchaseData, dailyPurchaseData]);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Ensure all months are included in the labels
    const formatMonthlyLabels = () => {
        return monthNames;
    };

    const fillMissingMonthlyData = (data) => {
        const filledData = Array(12).fill(0).map((_, index) => ({
            month: index + 1,
            totalSales: 0,
            totalPurchases: 0
        }));
        
        data.forEach(item => {
            if (item.month !== null) {
                filledData[item.month - 1] = {
                    month: item.month,
                    totalSales: item.totalSales,
                    totalPurchases: item.totalPurchases
                };
            }
        });

        return filledData;
    };

    const formatWeeklyLabels = () => {
        const labels = [];
        const currentDate = new Date();
        const currentWeek = getWeekNumber(currentDate);
        const currentYear = currentDate.getFullYear();
        const weeksToShow = 7; // Number of weeks to show

        for (let i = Math.max(currentWeek - weeksToShow, 1); i <= currentWeek; i++) {
            labels.push(`Week ${i} (${currentYear})`);
        }

        return labels;
    };

    const fillMissingWeeklyData = (data) => {
        const labels = formatWeeklyLabels();
        const filledData = labels.map((label, index) => ({
            week: index + 1 + Math.max(getWeekNumber(new Date()) - 10, 0),
            totalSales: 0,
            totalPurchases: 0
        }));
        
        data.forEach(item => {
            if (item.week !== null) {
                filledData[item.week - 1 - Math.max(getWeekNumber(new Date()) - 10, 0)] = {
                    week: item.week,
                    totalSales: item.totalSales,
                    totalPurchases: item.totalPurchases
                };
            }
        });

        return filledData;
    };

    const getWeekNumber = (date) => {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((date.getDay() + 1 + days) / 7);
    };

    const formatDailyLabels = () => {
        const today = new Date();
        const labels = [];

        for (let i = 10; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        return labels;
    };

    const renderChart = (salesData, purchaseData, label, formatLabels) => {
        const ctx = chartRef.current.getContext('2d');
        if (chartInstance) {
            chartInstance.destroy();
        }

        const labels = formatLabels();
        let filledSalesData, filledPurchaseData;

        if (label === `Monthly Sales and Purchases (${currency})`) {
            filledSalesData = fillMissingMonthlyData(salesData);
            filledPurchaseData = fillMissingMonthlyData(purchaseData);
        } else if (label === `Weekly Sales and Purchases (${currency})`) {
            filledSalesData = fillMissingWeeklyData(salesData);
            filledPurchaseData = fillMissingWeeklyData(purchaseData);
        } else {
            filledSalesData = salesData;
            filledPurchaseData = purchaseData;
        }

        const sales = filledSalesData.map(item => item.totalSales);
        const purchases = filledPurchaseData.map(item => item.totalPurchases);

        const newChartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sales',
                        data: sales,
                        backgroundColor: chartType === 'bar' ? '#1A5863' : 'rgba(0, 0, 0, 0)', // No fill color for line chart
                        borderColor: '#1A5863',
                        borderWidth: chartType === 'line' ? 3 : 1, // Bold line for line chart
                        fill: false, // Do not fill under the line
                    },
                    {
                        label: 'Purchases',
                        data: purchases,
                        backgroundColor: chartType === 'bar' ? '#187C71' : 'rgba(0, 0, 0, 0)', // No fill color for line chart
                        borderColor: '#187C71',
                        borderWidth: chartType === 'line' ? 3 : 1, // Bold line for line chart
                        fill: false, // Do not fill under the line
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2, // Adjust this value as needed
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                const inMillions = value / 1_000_000;
                                return `${inMillions}M`;
                            },
                        },
                        title: {
                            display: true,
                            text: `Amount (${currency})`,
                        },
                    },
                },
            },
        });

        setChartInstance(newChartInstance);
    };

    const renderDailyChart = (salesData, purchaseData, label) => {
        const ctx = chartRef.current.getContext('2d');
        if (chartInstance) {
            chartInstance.destroy();
        }

        const labels = formatDailyLabels();
        const salesMap = new Map(salesData.map(item => [item.date, item.totalAmount || item.totalSales]));
        const purchaseMap = new Map(purchaseData.map(item => [item.date, item.totalAmount || item.totalPurchases]));

        const sales = labels.map(date => salesMap.get(date) || 0);
        const purchases = labels.map(date => purchaseMap.get(date) || 0);

        const newChartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sales',
                        data: sales,
                        backgroundColor: chartType === 'bar' ? '#1A5863' : 'rgba(0, 0, 0, 0)', // No fill color for line chart
                        borderColor: '#1A5863',
                        borderWidth: chartType === 'line' ? 3 : 1, // Bold line for line chart
                        fill: false, // Do not fill under the line
                    },
                    {
                        label: 'Purchases',
                        data: purchases,
                        backgroundColor: chartType === 'bar' ? '#187C71' : 'rgba(0, 0, 0, 0)', // No fill color for line chart
                        borderColor: '#187C71',
                        borderWidth: chartType === 'line' ? 3 : 1, // Bold line for line chart
                        fill: false, // Do not fill under the line
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2, // Adjust this value as needed
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: '',
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                const inMillions = value / 1_000_000;
                                return `${inMillions}M`;
                            },
                        },
                        title: {
                            display: true,
                            text: `Amount (${currency})`,
                        },
                    },
                },
            },
        });

        setChartInstance(newChartInstance);
    };

    return (
        <div>
            {noData ? (
                <p>No data available</p>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2></h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            value={selectedPeriod} 
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            {/* <option value="monthly">Monthly</option> */}
                        </select>
                        <select 
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                        >
                            <option value="bar">Bar</option>
                            <option value="line">Line</option>
                        </select>
                    </div>
                </div>
            )}
    
            {/* Conditionally render the chart canvas only if noData is false */}
            <canvas ref={chartRef} style={{ width: '100%', height: '400px', maxHeight: '400px' }}></canvas>
        </div>
    );
    
};

export default CombinedSalesChart;