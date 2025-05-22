import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { fetchExpensesCatData } from './ExpensesController.js';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { toast } from 'react-toastify';

function EditExpensesBody() {
    // State management
    const [expensesData, setExpensesData] = useState({});
    const [categoryData, setExCatergoryData] = useState([]);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const [warehouseData, setWarehouseData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const findExpensesById = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findExpensesById/${id}`);
                if (response.data) {
                    setExpensesData(response.data.data);
                } else {
                    setError('No expense data found for the provided ID.');
                }
            } catch (error) {
                setError('Error getting expenses data.Please try again.');
                console.error('Error fetching expense by ID:', error.response ? error.response.data : error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            findExpensesById();
        }
    }, [id]);

    const fetchData = async (url, setter) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get(url);
            setter(data);
        } catch (error) {
            console.error(`${url} fetch error:`, error);
            setter([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, setWarehouseData);
    }, []);

    useEffect(() => {
        fetchExpensesCatData(setExCatergoryData, setLoading, setError);
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setResponseMessage('');
        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateExpenses/${id}`, expensesData);
            if (response.data && response.data.status === 'success') {
                toast.success(
                    response.data.message || 'Expenses updated successfully!',
                                    { autoClose: 2000 },
                                    { className: "custom-toast" }
                                );
                                navigate('/viewExpenses');
            } else {
                toast.error(
                    'Update failed. Please try again.',
                                    { autoClose: 2000 },
                                    { className: "custom-toast" }
                                );
            }
        } catch (err) {
            console.error('Error updating expense:', err.response ? err.response.data : err.message);
            toast.error(
                'Missing required fields.',
                                { autoClose: 2000 },
                                { className: "custom-toast" }
                            );
        } finally {
            setLoading(false);
        }
    };
    
    // Handle clear operation
    const handleClear = () => {
        setExpensesData({});
        setError('')
        setResponseMessage('')

    };
    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
             {loading && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 ml-4 m-0 p-0 text-2xl">Edit Expenses</h2>
                </div>
                <div>
                    <Link   className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewExpenses'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[800px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Date field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                    <input
                                        type="date"
                                        value={expensesData.date ? new Date(expensesData.date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setExpensesData(prev => ({ ...prev, date: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Warehouse <span className='text-red-500'>*</span></label>
                                    <input
                                        value={expensesData.warehouse || ''}
                                        readOnly
                                        onChange={(e) => setExpensesData(prev => ({ ...prev, warehouse: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    >
                                        {/* <option value="">Select a warehouse</option>
                                        {warehouseData.map((wh) => (
                                            <option key={wh.name} value={wh.name}>
                                                {wh.name}
                                            </option>
                                        ))} */}
                                    </input>
                                </div>

                                {/* Amount field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Amount <span className='text-red-500'>*</span></label>
                                    <input
                                        type="text"
                                        placeholder='Enter the amount'
                                        value={expensesData.amount || ''}
                                        onChange={(e) => setExpensesData(prev => ({ ...prev, amount: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                {/* Title field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Title <span className='text-red-500'>*</span></label>
                                    <input
                                        type="text"
                                        placeholder='For transport cost'
                                        value={expensesData.title || ''}
                                        onChange={(e) => setExpensesData(prev => ({ ...prev, title: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* Category field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Expenses Category <span className='text-red-500'>*</span></label>
                                    <select
                                        value={expensesData.category || ''}
                                        onChange={(e) => setExpensesData(prev => ({ ...prev, category: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    >
                                        <option value="">Select a Category</option>
                                        {categoryData.map((c) => (
                                            <option key={c.expensesName} value={c.expensesName}>
                                                {c.expensesName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Details field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Details <span className='text-red-500'>*</span></label>
                                    <input
                                        type="text"
                                        placeholder='Enter details'
                                        value={expensesData.details || ''}
                                        onChange={(e) => setExpensesData(prev => ({ ...prev, details: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button type='submit' className="saveBtn flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 w-[150px] text-center">
                                    Update & Save
                                </button>
                                <button
                                    type="button"
                                    className="ml-2 rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 w-[100px]"
                                    onClick={handleClear}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Error and Response Messages */}
                    <div className='mt-10'>
                        {error && (
                            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                {error}
                            </p>
                        )}
                        {responseMessage && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                                {responseMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditExpensesBody;
