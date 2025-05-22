import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../../styles/dashboardBody.css';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';

function EditProfileByAdmin() {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        role: '',
        mobile: '',
        profileImage: ''
    });
    const [progress, setProgress] = useState(false);
    const [errors, setErrors] = useState({});
    const [jobRoles, setJobRoles] = useState([]);
    const [responseMessage, setResponseMessage] = useState('');
    const navigate = useNavigate();

    // Fetch job roles on component mount
    useEffect(() => {
        setProgress(true);
        axios.get(`${process.env.REACT_APP_BASE_URL}/api/getJobRoles`)
            .then(response => {
                setJobRoles(response.data.jobRoles);
            })
            .catch(error => {
                console.error('Error fetching job roles:', error);
                setErrors(prevErrors => ({ ...prevErrors, general: 'Failed to fetch job roles.' }));
            })
            .finally(() => {
                setProgress(false);
            });
    }, []);

    // Fetch user data when component mounts
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setProgress(true);
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchUsers`, {
                    params: { id }
                });

                const fetchedData = response.data;

                if (!fetchedData.profileImage) {
                    fetchedData.profileImage = '';
                }

                setFormData(fetchedData);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setErrors(prevErrors => ({ ...prevErrors, general: 'Failed to fetch user data.' }));
            } finally {
                setProgress(false);
            }
        };

        fetchProfile();
    }, [id]);

    // Handle input field values
    const handleChange = (e) => {
        setErrors({});
        setResponseMessage('');
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        // Mobile number validation
        if (name === 'mobile') {
            const mobileRegex = /^\+94\d{9}$/;  // This ensures the format +94xxxxxxxxx
            if (!mobileRegex.test(value)) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    mobile: 'Invalid mobile number. Format: +94xxxxxxxxx'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    mobile: ''  // Clear error if valid
                }));
            }
        }

        if (name === 'username') {
            if (!value.includes('@')) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    username: 'Email must contain "@"'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    username: '' 
                }));
            }
        }
        setFormData(updatedFormData);
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        setResponseMessage('');
        setProgress(true);

        const formDataToSubmit = {
            id,
            username: formData.username.toLowerCase(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            mobile: formData.mobile
        };

        console.log(formDataToSubmit)
        axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateUser`, formDataToSubmit)
            .then(response => {
                toast.success(
                    "Successfully updated the user",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                setTimeout(() => {
                    navigate("/users");
                }, 1000);
            })
            .catch(error => {
                console.error('Error updating user:', error);
                const errorMessage = error.response?.data?.message || "Failed to update the user, please try again";

                toast.error(errorMessage, { autoClose: 2000, className: "custom-toast" });
            })
            .finally(() => {
                setProgress(false);
            });
    };

    // Clear all fields except the profileImage
    const handleCancel = () => {
        setFormData(prevData => ({
            ...prevData,
            username: '',
            firstName: '',
            lastName: '',
            role: '',
            mobile: ''
        }));
        setErrors({});
        setResponseMessage('');
    };

    const defaultAvatar = 'https://jingslearning.com/media/images/login-user-head.png';

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200 }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit user</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/users'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[800px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center justify-center h-20 mt-20 relative">
                            <div>
                                <img
                                    style={{ width: "140px", height: "140px" }}
                                    className="rounded-full"
                                    alt="Profile"
                                    src={formData.profileImage || defaultAvatar}
                                    onError={(e) => { e.target.src = defaultAvatar; }}
                                />
                            </div>
                        </div>
                        <div className="flex space-x-6 mt-10" style={{ padding: '40px' }}>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        First name <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder='Alex'
                                            className="pass block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Last Name <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder='Boult'
                                            className="pass block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Role field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select user role <span className='text-red-500'>*</span></label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    >
                                        {jobRoles.map((jobRole) => (
                                            <option key={jobRole._id} value={jobRole.roleName}>{jobRole.roleName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex space-x-4 mt-5">
                                    <button
                                        type="submit"
                                        className="button-bg-color  button-bg-color:hover  inline-flex justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        type="button"
                                        className="inline-flex justify-center rounded-md bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Mobile number <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="mobile"
                                            name="mobile"
                                            type="tel"
                                            required
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            maxLength={12}
                                            placeholder='+94xxxxxxxxx'
                                            className="pass block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                        {errors.mobile && <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Username <span className='text-red-500'>*</span>
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="username"
                                            name="username"
                                            type="email"
                                            required
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder='example@gmail.com'
                                            className="pass block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                        {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {errors.general && (
                            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 text-center mx-auto max-w-sm">
                                {errors.general}
                            </p>
                        )}

                        {responseMessage && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center mx-auto max-w-sm">
                                {responseMessage}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditProfileByAdmin;