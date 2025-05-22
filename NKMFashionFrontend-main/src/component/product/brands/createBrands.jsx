import React, { useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import CamIcon from "../../../img/icons8-camera-100.png";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";

function CreateBrandsBody() {
    const [brandName, setBrandName] = useState("");
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null); // State for logo preview
    const [responseMessage, setResponseMessage] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef(null);
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();

    const handleLogoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            setError("No file selected.");
            return;
        }

        // Check file type (strictly allow only JPG files)
        if (
            file.type !== "image/jpeg" ||
            !file.name.toLowerCase().endsWith(".jpg")
        ) {
            setError(
                "Only JPG files are allowed. Please upload a valid JPG file."
            );
            alert(
                "Only JPG files are allowed. Please upload a valid JPG file."
            );
            inputRef.current.value = ""; // Clear the input field
            return;
        }

        // Check file size (max 4MB)
        const maxFileSizeMB = 4;
        if (file.size / 1024 / 1024 > maxFileSizeMB) {
            setError(
                `File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`
            );
            alert(
                `File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`
            );
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
                        setError(
                            "Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image."
                        );
                        alert(
                            "Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image."
                        );
                        inputRef.current.value = ""; // Clear the input field
                        reject();
                    } else {
                        resolve();
                    }
                };
                img.onerror = () => {
                    setError("Error loading image. Please try again.");
                    inputRef.current.value = ""; // Clear the input field
                    reject();
                };
            });

            // Display the preview of the original image immediately
            const originalPreviewUrl = URL.createObjectURL(file);
            setLogoPreview(originalPreviewUrl);

            // Compress the image asynchronously
            const compressedBlob = await imageCompression(file, options);
            // Convert compressed Blob to File with .jpg extension
            const compressedFile = new File(
                [compressedBlob],
                file.name.replace(/\.[^/.]+$/, ".jpg"),
                {
                    type: "image/jpeg",
                }
            );

            // Update state with the compressed image and its preview
            setLogo(compressedFile);
            setError("");
        } catch (error) {
            console.error("Compression Error:", error);
            setError("Error during image processing. Please try again.");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setResponseMessage("");
        setError("");

        if (!brandName) {
            setError("Please add a brand name.");
            return;
        }

        const formData = new FormData();
        formData.append("brandName", brandName);
        formData.append("logo", logo);

        try {
            setProgress(true);
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/createBrand`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            toast.success(
                "Brand created successfully!",
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
                navigate("/viewBrands");
            console.log(response.data);
        } catch (error) {
            let errorMessage = "Brand not added something went wrong!";
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
        setBrandName("");
        setLogo(null);
        setLogoPreview(null);
        setResponseMessage("");
        setError("");
    };

    return (
        <div className="background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5">
            {progress && (
                <Box
                    sx={{
                        width: "100%",
                        position: "absolute",
                        top: "0",
                        left: "0",
                        margin: "0",
                        padding: "0",
                    }}
                >
                    <LinearProgress />
                </Box>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">
                        Create Brands
                    </h2>
                </div>
                <div>
                    <Link
                        className="px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white"
                        to={"/viewBrands"}
                    >
                        Back
                    </Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-[630px] h-[600px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Brand name field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Brand name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="brandName"
                                            name="brandName"
                                            type="text"
                                            required
                                            placeholder="Enter the brand name"
                                            value={brandName}
                                            onChange={(e) =>
                                                setBrandName(e.target.value)
                                            }
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Logo upload field with pencil icon */}
                                <div className="mt-5 relative">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Add logo{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-2 relative">
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
                                                document
                                                    .getElementById("file")
                                                    .click()
                                            }
                                            className={`block w-[100px] h-[100px] rounded-md border-0 py-2.5 px-2.5 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${
                                                logoPreview
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
                                                    className="ml-5 w-10 h-10"
                                                />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="container mx-auto text-left">
                                    <div className="mt-10 flex justify-start">
                                        <button
                                            type="submit"
                                            className="button-bg-color  button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                        >
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
                    <div className="mt-5">
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

export default CreateBrandsBody;
