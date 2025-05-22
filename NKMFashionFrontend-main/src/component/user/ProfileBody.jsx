import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import '../../styles/dashboardBody.css';
import { useNavigate } from 'react-router-dom';
import { PencilIcon } from '@heroicons/react/24/outline';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { Link } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import imageCompression from "browser-image-compression";
import { useRef } from 'react';
import { toast } from 'react-toastify';

function ProfileBody() {
    const { userData } = useContext(UserContext);
    const [formData, setFormData] = useState({ username: '', firstName: '', lastName: '', profileImage: '', mobile: '' });
    const [ImageFile, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const defaultAvatar = 'https://jingslearning.com/media/images/login-user-head.png';

    // Initialize form data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userData.username) {
                setErrors(prevErrors => ({ ...prevErrors, general: 'Username is not available.' }));
                return;
            }
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchUsers`, {
                    params: { username: userData.username },
                });
                const fetchedData = response.data;
                setFormData(fetchedData);
            } catch (error) {
                console.error('Error fetching customer data:', error);
                setErrors(prevErrors => ({ ...prevErrors, general: 'Failed to fetch customer data.' }));
            } finally {
                setProgress(false);
            }
        };

        fetchUserData();
    }, [userData.username]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setErrors({});
        setResponseMessage('');

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        if (name === 'mobile') {
            const mobileRegex = /^\+94\d{9}$/;
            if (!mobileRegex.test(value)) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    mobile: 'Invalid mobile number. Format: +94xxxxxxxxx'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    mobile: ''
                }));
            }
        }
    };

    // Handle image changes with validation and compression
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            setErrors("No file selected.");
            return;
        }

        // Check file type (strictly allow only JPG files)
        if (file.type !== "image/jpeg" || !file.name.toLowerCase().endsWith(".jpg")) {
            setErrors("Only JPG files are allowed. Please upload a valid JPG file.");
            alert("Only JPG files are allowed. Please upload a valid JPG file.");
            inputRef.current.value = ""; // Clear the input field
            return;
        }

        // Check file size (max 4MB)
        const maxFileSizeMB = 2;
        if (file.size / 1024 / 1024 > maxFileSizeMB) {
            setErrors(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
            alert(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
            inputRef.current.value = ""; // Clear the input field
            return;
        }

        // Compression options
        const options = {
            maxSizeMB: 0.02, // Target size (20KB in MB)
            maxWidthOrHeight: 800, // Reduce dimensions to help with compression
            useWebWorker: true, // Enable Web Worker for efficiency
        };

        try {
            // Convert file to data URL to validate dimensions
            const image = await imageCompression.getDataUrlFromFile(file);
            const img = new Image();
            img.src = image;

            // Check image aspect ratio (1:1 within 100px tolerance)
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    const width = img.width;
                    const height = img.height;
                    const tolerance = 100; // Allow 100px variance

                    if (Math.abs(width - height) > tolerance) {
                        setErrors("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
                        alert("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
                        inputRef.current.value = ""; // Clear the input field
                        reject();
                    } else {
                        resolve();
                    }
                };
                img.onerror = () => {
                    setErrors("Error loading image. Please try again.");
                    inputRef.current.value = ""; // Clear the input field
                    reject();
                };
            });

            // Display the preview of the original image immediately
            const originalPreviewUrl = URL.createObjectURL(file);
            setImagePreview(originalPreviewUrl);

            // Compress the image asynchronously
            const compressedBlob = await imageCompression(file, options);

            // Convert compressed Blob to File with .jpg extension
            const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
            });

            // Update state with the compressed image and its preview
            setSelectedImage(compressedFile);
            setErrors("");
        } catch (error) {
            console.error("Compression Error:", error);
            setErrors("Error during image processing. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setResponseMessage('');
        setProgress(true); // Show loading bar

        if (!formData.username.includes('@')) {
            setErrors({ username: 'Username must be a valid email address containing "@"' });
            setProgress(false); // Hide loading bar
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('firstName', formData.firstName);
        formDataToSubmit.append('lastName', formData.lastName);
        formDataToSubmit.append('mobile', formData.mobile);
        formDataToSubmit.append('username', formData.username);
        if (ImageFile) formDataToSubmit.append('profileImage', ImageFile);

        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateUser`, formDataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.status === 'success') {
                toast.success(
                    "User updated successfully!",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                navigate('/users');
            } else {
                setErrors(response.data.message || 'User update failed.');
            }
        } catch (error) {
            console.error("Error while updating user:", error.response || error);
            const errorMsg = error.response?.data?.message || 'An error occurred while updating user.';
            toast.error(
                errorMsg,
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } finally {
            setProgress(false); // Hide loading bar
        }
    };


    // Handle cancel
    const handleCancel = () => {
        setFormData({ username: '', firstName: '', lastName: '', profileImage: '', mobile: '' });
        setSelectedImage(null);
        setImagePreview(null);
        setErrors({});
        setResponseMessage('');
    };

    return (
        <div className='dashBody'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            {formData ? (
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-center h-20 mt-20 relative">
                        <img
                            style={{ width: '140px', height: '140px' }}
                            className="rounded-full"
                            alt="Profile"
                            src={imagePreview ? imagePreview : formData.profileImage || defaultAvatar}
                            onError={(e) => { e.target.src = defaultAvatar; }}
                            ref={inputRef}
                        />
                        <input
                            type="file"
                            id="fileInput"
                            accept="image/*"
                            style={{ display: 'none' }}
                            name="profileImage"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="fileInput" style={{ position: "relative", top: "60px", right: "30px" }} className="absolute cursor-pointer">
                            <PencilIcon className="text-blue-500 w-6 h-6" />
                        </label>
                        <Link className="absolute px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors hover:bg-[#35AF87] hover:text-white" style={{ top: '-20px', right: '40px' }} to={'/users'}>
                            Back
                        </Link>
                    </div>
                    <div className="flex space-x-6 mt-10" style={{ padding: '40px' }}>
                        <div className="flex-1 space-y-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900 text-left">First Name <span className='text-red-500'>*</span></label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Alex"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 focus:ring-2"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900 text-left">Last Name <span className='text-red-500'>*</span></label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Boult"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 focus:ring-2"
                                />
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">Mobile Number <span className='text-red-500'>*</span></label>
                                <input
                                    id="mobile"
                                    name="mobile"
                                    type="text"
                                    required
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    maxLength={12}
                                    placeholder="+94 xx xxxx xxx"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 focus:ring-2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4 ml-10">
                        <button
                            type="submit"
                            className="saveBtn inline-flex justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            onClick={handleCancel} // Reset fields on cancel
                        >
                            Cancel
                        </button>
                    </div>
                    {/* Error and Response Messages */}
                    {errors.mobile && (
                        <p className="text-red-500 text-base mt-1 px-5 py-2 rounded-md mt-5 text-center mx-auto max-w-sm">
                            {errors.mobile}
                        </p>
                    )}
                    {responseMessage && (
                        <p className={`text-color px-5 py-2 rounded-md mt-5 text-center mx-auto max-w-sm ${responseMessage.includes('success') ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                            {responseMessage}
                        </p>
                    )}

                </form>
            ) : (
                <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                </Box>
            )}
        </div>
    );
}

export default ProfileBody;
