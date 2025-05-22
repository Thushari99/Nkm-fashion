import React, { useState } from 'react';
import axios from 'axios';
import '../../../styles/role.css';
import { Link,useNavigate} from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';

function CreateBaseUnitBody() {
    const [BaseUnitName, setBaseUnit] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true); // Show loading bar

        const userData = { BaseUnitName, description };

        try {
            const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createBaseUnit`, userData);
            toast.success(
                    "Base Unit created successfully!",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                  );
                navigate('/viewBaseUnit');
        } catch (error) {
            let errorMessage = "Base unit not added";
            if (error.response) {
                // If backend sends message or error
                errorMessage = error.response.data.message || errorMessage;
            }
            toast.error(errorMessage ,
                { autoClose: 2000 },
                { className: "custom-toast" });
        } finally {
            setProgress(false); // Hide loading bar
        }
    };

    const handleClear = () => {
        setBaseUnit('');
        setDescription('');
        setError('');
        setResponseMessage('');
    };

    return (
        <div className="background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5">
            {progress && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Base Unit</h2>
                </div>
                <div>
                    <Link
                        className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white'
                        to="/viewBaseUnit"
                    >
                        Back
                    </Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-[640px] h-[600px] rounded-2xl px-8 shadow-md relative">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Base unit <span className='text-red-500'>*</span></label>
                                    <div className="mt-2">
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            placeholder="Base unit"
                                            value={BaseUnitName}
                                            onChange={(e) => setBaseUnit(e.target.value)}
                                            autoComplete="given-name"
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Description <span className='text-red-500'>*</span></label>
                                    <div className="mt-2">
                                        <textarea
                                            id="text"
                                            name="text"
                                            type="text"
                                            required
                                            placeholder="Description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            autoComplete="email"
                                            className="block w-[500px] h-[200px] max-h-[200px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 overflow-y-auto"
                                        />
                                    </div>
                                </div>
                                <div className="container mx-auto text-left">
                                    <div className="mt-10 flex justify-start">
                                        <button
                                            type="submit"
                                            className="button-bg-color button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px] focus:ring-gray-500 focus:ring-offset-2"
                                            onClick={handleClear}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                    <div className="mt-5">
                        {error && (
                            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                {error}
                            </p>
                        )}
                        {responseMessage && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center mx-auto max-w-sm inline-block">
                                {responseMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateBaseUnitBody;
