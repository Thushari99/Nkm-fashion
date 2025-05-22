import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { fetchSaleData, } from '../currency/CurrencyController';
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import { isAllowedKey } from '../utill/MobileValidation';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import CamIcon from "../../img/icons8-camera-100.png";
import imageCompression from 'browser-image-compression';
import { useLogo } from '../../context/logoContext';

function SystemSettingsBody() {
    // State management
    const [currencyData, setCurrencyData] = useState([]);
    const [warehouseData, setWarehouseData] = useState([]);
    const [email, setEmail] = useState('');
    const [currency, setCurrency] = useState('LKR');
    const [companyName, setCompanyName] = useState('');
    const [companyMobile, setCompanyMobile] = useState('');
    const [developerBy, setDeveloperBy] = useState('');
    const [footer, setFooter] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [dateFormat, setDateFormat] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [defaultWarehouse, setDefaultWarehouse] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [logoPreview, setLogoPreview] = useState(null);
    const inputRef = useRef(null);
    const [logo, setLogo] = useState(null);
    const { updateLogo } = useLogo();

    // Load currencies when the component mounts
    useEffect(() => {
        fetchData(
            `${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`,
            (data) => setWarehouseData(data.warehouses || [])
        );
        fetchSaleData(setCurrencyData, setLoading, setError);
        fetchSettings();
    }, []);

    // Handle keydown event to restrict invalid keys
    const handleKeyDown = (e) => {
        const key = e.key;
        if (!isAllowedKey(key)) {
            e.preventDefault();
        }
    };

    const fetchData = async (url, setter) => {
        setLoading(true);
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

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);

            setEmail(data.email || '');
            setCurrency(data.currency || 'LKR');
            setCompanyName(data.companyName || '');
            setCompanyMobile(data.companyMobile || '');
            setDeveloperBy(data.developerBy || '');
            setFooter(data.footer || '');
            setCountry(data.country || '');
            setCity(data.city || '');
            setDateFormat(data.dateFormat || 'MM/DD/YYYY');
            setPostalCode(data.postalCode || '');
            setAddress(data.address || '');
            if (data.defaultWarehouse) {
                setDefaultWarehouse(data.defaultWarehouse);
                sessionStorage.setItem("defaultWarehouse", data.defaultWarehouse);
            } else {
                console.warn("[DEBUG] No default warehouse received!");
            }

            if (data.logo) {
                console.log("[DEBUG] Logo received:", data.logo);
                setLogoPreview(data.logo); 
            } else {
                console.warn("[DEBUG] No logo received in API response!");
            }
        } catch (error) {
            console.error("[DEBUG] Error fetching settings:", error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);


    const handleLogoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            setError("No file selected.");
            return;
        }

        // Allow JPG and PNG files
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            setError("Only JPG and PNG files are allowed. Please upload a valid image.");
            alert("Only JPG and PNG files are allowed. Please upload a valid image.");
            inputRef.current.value = "";
            return;
        }

        // Check file size (max 4MB)
        const maxFileSizeMB = 4;
        if (file.size / 1024 / 1024 > maxFileSizeMB) {
            setError(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
            alert(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
            inputRef.current.value = ""; 
            return;
        }

        // Compression options
        const options = {
            maxSizeMB: 0.02, 
            maxWidthOrHeight: 800, 
            useWebWorker: true,
        };

        try {
            // Convert file to data URL to validate dimensions
            const image = await imageCompression.getDataUrlFromFile(file);
            const img = new Image();
            img.src = image;

            // Check image aspect ratio (1:1 within 100px tolerance)
            // await new Promise((resolve, reject) => {
            //     img.onload = () => {
            //         const width = img.width;
            //         const height = img.height;
            //         const tolerance = 100; 

            //         if (Math.abs(width - height) > tolerance) {
            //             setError("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            //             alert("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            //             inputRef.current.value = ""; 
            //             reject();
            //         } else {
            //             resolve();
            //         }
            //     };
            //     img.onerror = () => {
            //         setError("Error loading image. Please try again.");
            //         inputRef.current.value = ""; 
            //         reject();
            //     };
            // });

            // Display the preview of the original image immediately
            const originalPreviewUrl = URL.createObjectURL(file);
            setLogoPreview(originalPreviewUrl);

            // Compress the image asynchronously
            const compressedBlob = await imageCompression(file, options);

            // Convert compressed Blob to File with correct extension
            const fileExtension = file.type === "image/png" ? ".png" : ".jpg";
            const compressedFile = new File(
                [compressedBlob],
                file.name.replace(/\.[^/.]+$/, fileExtension),
                { type: file.type }
            );

            // Update state with the compressed image and its preview
            setLogo(compressedFile);
            setError("");
        } catch (error) {
            console.error("Compression Error:", error);
            setError("Error during image processing. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("email", email.toLowerCase());
        formData.append("currency", currency);
        formData.append("companyName", companyName);
        formData.append("companyMobile", companyMobile);
        formData.append("developerBy", developerBy);
        formData.append("footer", footer);
        formData.append("country", country);
        formData.append("city", city);
        formData.append("dateFormat", dateFormat);
        formData.append("postalCode", postalCode);
        formData.append("address", address);
        formData.append("defaultWarehouse", defaultWarehouse);
        if (logo) {
            formData.append("logo", logo);
        } else {
            if (logoPreview) {
                console.log("[DEBUG] Retaining old logo:", logoPreview);
                formData.append("logo", logoPreview);
            } else {
                console.warn("[DEBUG] No logo available, not attaching logo.");
            }
        }

        try {
            console.log("[DEBUG] Sending request to update settings...");
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/createOrUpdateSettings`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" }, 
                }
            );
            console.log("[DEBUG] API Response:", response.data);
            toast.success(
                response.data.message,
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
            //    sessionStorage.setItem("defaultWarehouse", defaultWarehouse);
            setTimeout(() => {
                window.location.href = '/settings';
            }, 1000);

            if (response.data.data.logo) {
                const newLogoUrl = response.data.data.logo;
                console.log("[DEBUG] New logo URL received:", newLogoUrl);
                updateLogo(newLogoUrl);
            } else {
                console.warn("[DEBUG] API response did not return a new logo URL!");
            }


        } catch (error) {
            console.error('Error saving data:', error);
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    toast.error(
                        error.response.data.message,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );

                } else {
                    toast.error(
                        `Server responded with status: ${error.response.status}`,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                }
            } else if (error.request) {
                toast.error(
                    'No response from the server. Please check your internet connection.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                // The request was made but no response was received
            } else {
                // Something happened in setting up the request that triggered an Error
                toast.error(
                    'An unexpected error occurred while setting up the request.',
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            }
        } finally {
            setLoading(false); // Reset loading state after the request is complete
        }

    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mt-20'>
                <div>
                    <h2 className="text-lightgray-300 p-0 text-2xl">System Settings</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/dashboard'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] pb-2 w-full rounded-2xl px-8 shadow-md">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        {/* Centered Round Logo Upload Field */}
                        <div className="mt-1 mb-8 flex justify-center">
                            <div className="relative">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-center">
                                    Add Company Logo <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2 relative flex justify-center">
                                    <input
                                        id="file"
                                        name="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                        ref={inputRef}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            document.getElementById("file").click()
                                        }
                                        className={`block w-[100px] h-[100px] rounded-full border-0 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${logoPreview
                                                ? "bg-cover bg-center"
                                                : "bg-gray-200 opacity-70 hover:bg-gray-300"
                                            }`}
                                        style={{
                                            backgroundImage: logoPreview
                                                ? `url(${logoPreview})`
                                                : "none",
                                        }}
                                    >
                                        {!logoPreview && (
                                            <img
                                                src={CamIcon}
                                                alt="cam"
                                                className="mx-auto w-10 h-10"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>


                        <div className="flex w-full space-x-5">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Default Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Default email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Currency</label>
                                <select
                                    id="currency"
                                    name="warehouse"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="searchBox w-full pl-4 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select a Currency</option>
                                    {currencyData.map((c) => (
                                        <option key={c.currencyCode} value={c.currencyCode}>
                                            {c.currencyCode}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Similar pattern for other fields */}
                        <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Company Name</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Company Name"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Company Mobile</label>
                                <input
                                    type="text"
                                    value={companyMobile}
                                    onChange={(e) => setCompanyMobile(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    maxLength={12}
                                    placeholder="Company Mobile"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        {/* Additional form fields */}
                        <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Developer By</label>
                                <input
                                    type="text"
                                    value={developerBy}
                                    onChange={(e) => setDeveloperBy(e.target.value)}
                                    placeholder="Developer by"
                                    readOnly
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Footer</label>
                                <input
                                    type="text"
                                    value={footer}
                                    onChange={(e) => setFooter(e.target.value)}
                                    placeholder="Footer"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Country</label>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="Country"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="City"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date Format</label>
                                <select
                                    id="dateFormat"
                                    name="dateFormat"
                                    value={dateFormat}
                                    onChange={(e) => setDateFormat(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Postal Code</label>
                                <input
                                    type="text"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    placeholder="Postal Code"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="flex w-full space-x-5 mt-10">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Address"
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Default Warehouse</label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    value={defaultWarehouse}
                                    onChange={(e) => setDefaultWarehouse(e.target.value)}
                                    className="searchBox w-full pl-4 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select a warehouse</option>
                                    {warehouseData.map((wh) => (
                                        <option key={wh.name} value={wh.name}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="container mx-auto text-left">
                            <div className='mt-5 flex justify-start'>
                                <button className='submit text-white rounded-md mt-5' type='submit'>
                                    Save Settings
                                </button>
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
                        {response && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                                {response}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default SystemSettingsBody;
