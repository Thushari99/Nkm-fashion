import { useState, useEffect } from 'react';
import { Link, useParams ,useNavigate} from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { toast } from 'react-toastify';

function EditBaseUnitBody() {
    const { id } = useParams();
    const [baseunitData, setBaseUnitData] = useState({ BaseUnitName: '', description: '' });
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch base unit data
    useEffect(() => {
        const fetchBaseUnitData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getBaseUnitForUpdate/${id}`);
                if (response.data.status === 'success') {
                    setBaseUnitData({
                        BaseUnitName: response.data.BU.BaseUnitName,
                        description: response.data.BU.description || '' // Set description if available
                    });
                } else {
                    setResponseMessage(response.data.message || 'Failed to fetch data');
                }
            } catch (error) {
                console.error('Fetch base unit data error:', error);
                setError('Data not fetched');
            } finally {
                setLoading(false);
            }
        };

        fetchBaseUnitData();
    }, [id]);

    // Handle input change
    const handleInputChange = (e) => {
        setBaseUnitData({ ...baseunitData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateBaseUnit`, {
                ...baseunitData,
                id
            });

            if (response.data.status === 'success') {
                toast.success(
                                    "Base Unit updated successfully!",
                                    { autoClose: 2000 },
                                    { className: "custom-toast" }
                                  );
                    navigate('/viewBaseUnit');
                setError('');
            } else {
                setResponseMessage('');
                toast.error('Failed to update base unit',
                                    { autoClose: 2000 },
                                    { className: "custom-toast" });
            }
        } catch (error) {
            console.error('Update base unit error:', error);
            let errorMessage = "Failed to update base unit";
                if (error.response) {
                    // If backend sends message or error
                     errorMessage = error.response.data.message || errorMessage;
                }
                toast.error(errorMessage ,
                    { autoClose: 2000 },
                    { className: "custom-toast" });
            setResponseMessage('');
        } finally {
            setLoading(false);
        }
    };

    // Handle clear 
    const handleClear = () => {
        setError('');
        setResponseMessage('');
        setBaseUnitData({ BaseUnitName: '', description: '' });
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5'>
            {loading && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit Base Unit</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewBaseUnit'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-[630px] h-[600px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    {loading ? (
                        <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                            <LinearProgress />
                        </Box>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="flex space-x-16">
                                <div className="flex-1">
                                    {/* Base unit name field */}
                                    <div className="mt-5">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Base unit <span className='text-red-500'>*</span></label>
                                        <div className="mt-2">
                                            <input
                                                id="BaseUnitName"
                                                name="BaseUnitName"
                                                type="text"
                                                required
                                                placeholder='Base unit'
                                                value={baseunitData.BaseUnitName}
                                                onChange={handleInputChange}
                                                autoComplete="given-name"
                                                className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                    {/* Description field */}
                                    <div className="mt-5">
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Description <span className='text-red-500'>*</span></label>
                                        <div className="mt-2">
                                            <textarea
                                                id="description"
                                                name="description"
                                                rows="4"
                                                placeholder='Description'
                                                value={baseunitData.description}
                                                onChange={handleInputChange}
                                                className="block w-[500px] h-[200px] max-h-[200px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
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
                    )}
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

export default EditBaseUnitBody;
