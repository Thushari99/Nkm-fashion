import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css'
import { fetchExpensesCatData } from './ExpensesController.js'
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { toast } from 'react-toastify';

function CreateExpensesBody() {
    // State management
    const [warehouseData, setWarehouseData] = useState([]);
    const [categoryData, setExCatergoryData] = useState([])
    const [warehouse, setWarehouse] = useState('');
    const [category, setCategory] = useState('')
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('');
    const [details, setDetails] = useState('')
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllWarehouses = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`);
                setWarehouseData(response.data.warehouses || []);
            } catch (error) {
                console.error('Failed to fetch all warehouses:', error);
            }
        };
    
        fetchAllWarehouses();
    }, []);

    useEffect(() => {
        fetchExpensesCatData(setExCatergoryData, setLoading, setError);
    }, []);

    useEffect(() => {
            // Set the default value to today's date in 'YYYY-MM-DD' format
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            setDate(formattedDate);
        }, []);
    

    //Handle submit 
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setResponseMessage('')

        const expensesData = {
            warehouse,
            category,
            amount,
            date,
            title,
            details,
        };
        axios.post(`${process.env.REACT_APP_BASE_URL}/api/createExpenses`, expensesData)
            .then(result => {
                toast.success(
                    "Expenses added successfully!",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                navigate('/viewExpenses');
            })
            .catch(error => {
                toast.error(
                    "Error expenses is not added",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            })
            .finally(() => {
                // Hide loading bar after success or failure
                setLoading(false);
            });
        console.log(expensesData);
    };

    // Handle clear operation
    const handleClear = () => {
        setAmount('');
        setCategory('');
        setDate('');
        setDetails('');
        setTitle('');
        setWarehouse('');
        setError('');
        setResponseMessage('');
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
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Create Expenses</h2>
                </div>
                <div>
                    <Link  className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewExpenses'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[800px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* date */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                    <input
                                        id="date"
                                        name="date"
                                        type="date"
                                        placeholder='date'
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* warehouse field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Warehouse <span className='text-red-500'>*</span></label>
                                    <select
                                        id="country"
                                        name="country"
                                        required
                                        placeholder="warehouse"
                                        value={warehouse}
                                        onChange={(e) => setWarehouse(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    >
                                        <option value="">Select a warehouse</option>
                                        {warehouseData.map((wh) => (
                                            <option key={wh.name} value={wh.name}>
                                                {wh.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* amount */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Amount <span className='text-red-500'>*</span></label>
                                    <input
                                        id="text"
                                        name="text"
                                        type="text"
                                        required
                                        placeholder='Enter the amount'
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                {/* Name field */}
                                <div className="mt-2">
                                    <label className="block text-sm  font-medium leading-6 text-gray-900 text-left">Title <span className='text-red-500'>*</span></label>
                                    <input
                                        id="text"
                                        name="text"
                                        type="text"
                                        required
                                        placeholder='For transport cost'
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* catergory field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Expenses Catergory <span className='text-red-500'>*</span></label>
                                    <select
                                        id="text"
                                        name="text"
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
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

                                {/* Mobile number field */}
                                <div className="mt-5 mt-2">
                                    <label htmlFor="mobile" className="block  text-sm font-medium leading-6 text-gray-900 text-left">
                                        Details <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-0">
                                        <input
                                            id="text"
                                            name="text"
                                            type="text"
                                            required
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            placeholder='Enter details'
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button type='submit' className="saveBtn flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px]  focus:ring-gray-500 focus:ring-offset-2"
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

export default CreateExpensesBody;
