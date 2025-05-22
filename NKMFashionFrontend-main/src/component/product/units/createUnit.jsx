import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';

function CreateUnitBody() {
    // State management
    const [unitName, setUnit] = useState('');
    const [shortName, setShortUnit] = useState('');
    const [baseUnits, setBaseUnits] = useState([]); // Changed to array to hold multiple units
    const [selectedBaseUnit, setSelectedBaseUnit] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();

    // Fetching base units for making units
    useEffect(() => {
        const FetchingBaseUnits = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/allBaseUnit`);
                setBaseUnits(response.data.baseUnits || []);
                console.log('Fetched base units:', response.data.baseUnits);
            } catch (err) {
                console.error('Error fetching base units:', err);
                setError('Error fetching base units');
            }
        }
        FetchingBaseUnits();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);

        const userData = {
            unitName,
            shortName,
            baseUnit: selectedBaseUnit
        };
        console.log('Submitting data:', userData);

        try {
            const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createUnit`, userData);
            toast.success(
                result.data.message || "Unit added successfully!",
                                                { autoClose: 2000 },
                                                { className: "custom-toast" }
                                              );
                navigate('/viewUnit');
        } catch (error) {
            console.error('Error creating unit:', error);
            let errorMessage = "Unit not added.Try again.";
            if (error.response) {
                // If backend sends message or error
                errorMessage = error.response.data.message || errorMessage;
                }
            toast.error(errorMessage ,
                { autoClose: 2000 },
                { className: "custom-toast" });
        }
        finally {
            setProgress(false); // Hide loading bar
        }
    };

    const handleClear = () => {
        setUnit('');
        setSelectedBaseUnit(''); // Clear the selected base unit
        setShortUnit('');
        setError('');
        setResponseMessage('');
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Unit</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewUnit'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-[630px] h-[600px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Baseunit name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Base unit <span className='text-red-500'>*</span></label>
                                    <div className="mt-2">
                                        <select
                                            id="baseUnit"
                                            name="baseUnit"
                                            value={selectedBaseUnit}
                                            onChange={(e) => setSelectedBaseUnit(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        >
                                            <option value="">Select a base unit</option>
                                            {baseUnits.map(unit => (
                                                <option key={unit._id} value={unit.BaseUnitName}>{unit.BaseUnitName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Unit name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Unit <span className='text-red-500'>*</span></label>
                                    <div className="mt-2">
                                        <input
                                            id="text"
                                            name="text"
                                            type="text"
                                            required
                                            placeholder='Unit name'
                                            value={unitName}
                                            onChange={(e) => setUnit(e.target.value)}
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Short name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Short name <span className='text-red-500'>*</span></label>
                                    <div className="mt-2">
                                        <input
                                            id="text"
                                            name="text"
                                            type="text"
                                            required
                                            placeholder='kg / cm / ml '
                                            value={shortName}
                                            onChange={(e) => setShortUnit(e.target.value)}
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                <div className="container mx-auto text-left">
                                    <div className='mt-10 flex justify-start'>
                                        <button type='submit' className="button-bg-color  button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
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
                            </div>
                        </div>
                    </form>

                    {/* Error and Response Messages */}
                    <div className='mt-5'>
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

export default CreateUnitBody;
