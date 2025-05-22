import React from "react";

export const BrandModal = ({ addBrandModel, setAddBrandOpen, handleSubmit, brandName, setBrandName, handleLogoChange, logoPreview, inputRef, CamIcon, handleSubmitBrand,
    setError, setResponseMessage, setProgress, logo, setLogoPreview, handleClearBrandModel,
}) => {
    if (!addBrandModel) return null;

    return (
        <div className="fixed inset-0 bg-black mt-20 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-[550px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                {/* Close button */}
                <button
                    onClick={(e) => setAddBrandOpen(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="flex space-x-16">
                        <div className="flex-1">
                            {/* Brand Name Field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Brand Name <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="Enter the name"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="mt-5 relative">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Add logo
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
                                        onClick={() => document.getElementById("file").click()}
                                        className={`block w-[100px] h-[100px] rounded-md border-0 py-2.5 px-2.5 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${logoPreview ? "bg-cover bg-center" : "bg-gray-200 opacity-70 hover:bg-gray-300"
                                            }`}
                                        style={{ backgroundImage: logoPreview ? `url(${logoPreview})` : "none" }}
                                    >
                                        {!logoPreview && <img src={CamIcon} alt="cam" className="ml-5 w-10 h-10" />}
                                    </button>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="container mx-auto text-left">
                                <div className="mt-10 flex justify-start">
                                    <button
                                        onClick={(e) =>
                                            handleSubmitBrand(
                                                e,
                                                setError,
                                                setResponseMessage,
                                                setProgress,
                                                setAddBrandOpen,
                                                brandName,
                                                logo,
                                                setLogoPreview,
                                                setBrandName
                                            )
                                        }
                                        className="button-bg-color button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px] focus:ring-gray-500 focus:ring-offset-2"
                                        onClick={handleClearBrandModel}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const CategoryModal = ({ addCatergoryModel, setAddCategoryOpen, handleSubmit, categoryName, setCatergory, code, setCode, handleLogoChange, logoPreview, inputRef, CamIcon,
    handleSubmitCategory, setError, setResponseMessage, setProgress, logo, handleClearCatergoryModel,
}) => {
    if (!addCatergoryModel) return null;

    return (
        <div className="fixed inset-0 bg-black mt-20 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-[550px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                {/* Close button */}
                <button
                    onClick={() => setAddCategoryOpen(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="flex space-x-16">
                        <div className="flex-1">
                            {/* Category Field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="Enter the name"
                                        value={categoryName}
                                        onChange={(e) => setCatergory(e.target.value)}
                                        autoComplete="given-name"
                                        className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                            
                            {/* Logo Upload */}
                            <div className="mt-5 relative">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Add logo
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
                                        onClick={() => document.getElementById("file").click()}
                                        className={`block w-[100px] h-[100px] rounded-md border-0 py-2.5 px-2.5 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${logoPreview ? "bg-cover bg-center" : "bg-gray-200 opacity-70 hover:bg-gray-300"
                                            }`}
                                        style={{ backgroundImage: logoPreview ? `url(${logoPreview})` : "none" }}
                                    >
                                        {!logoPreview && <img src={CamIcon} alt="cam" className="ml-5 w-10 h-10" />}
                                    </button>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="container mx-auto text-left">
                                <div className="mt-10 flex justify-start">
                                    <button
                                        onClick={(e) =>
                                            handleSubmitCategory(e, setError, setResponseMessage, setProgress, setAddCategoryOpen, categoryName, logo, code)
                                        }
                                        className="button-bg-color button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px] focus:ring-gray-500 focus:ring-offset-2"
                                        onClick={handleClearCatergoryModel}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const SupplierModel = ({
    addSupplierModel, setAddSupplierOpen, email, setEmail, country, setCountry, city, setCity, address, setAddress, name, setName, companyName,

    setCompanyName, nic, setNIC, mobile, setMobile, error, responseMessage, handleSupplierSubmit, handleSupplierClear, setError, setResponseMessage, setProgress, etAddSupplierOpen

}) => {

    const validateAndSubmitSupplier = (
        e,
        email,
        name,
        companyName,
        nic,
        country,
        city,
        mobile,
        address,
        setError,
        setResponseMessage,
        setProgress,
        setAddSupplierOpen,
        handleSupplierClear,
        handleSupplierSubmit
      ) => {
        e.preventDefault(); // Prevent default form submit behavior
        setError(''); // Clear previous errors
        setResponseMessage('');
        setProgress(true); // Show loading bar if you want
      
        let isValid = true;
      
        const normalizedEmail = email.toLowerCase();
      
        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
        if (!emailRegex.test(normalizedEmail)) {
            setError('Username must be a valid email address (example: user@gmail.com)');
            setProgress(false);
            isValid = false;
        }
      
        // Mobile Validation
        const mobileRegex = /^\+94\d{9}$/;
        if (!mobileRegex.test(mobile)) {
          setError('Invalid mobile number. Format: +94xxxxxxxxx');
          setProgress(false);
          isValid = false;
        }
      
        // NIC Validation
        const newNICRegex = /^\d{12}$/;
        const oldNICRegex = /^\d{9}[VXvx]$/;
        if (!newNICRegex.test(nic) && !oldNICRegex.test(nic)) {
          setError('NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).');
          setProgress(false);
          isValid = false;
        }
      
        // If validation passes, call the original submit
        if (isValid) {
          handleSupplierSubmit(
            e,
            normalizedEmail,
            name,
            companyName,
            nic,
            country,
            city,
            mobile,
            address,
            setError,
            setResponseMessage,
            setProgress,
            setAddSupplierOpen,
            handleSupplierClear
          );
        }
      };

    if (!addSupplierModel) return null;
    return (
        <div className="fixed inset-0 bg-black mt-20 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-[750px] h-[600px] rounded-lg p-6 relative" data-aos="fade-down">
                <button
                    onClick={() => setAddSupplierOpen(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>

                <form onSubmit={handleSupplierSubmit}>
                    <div className="flex space-x-16">
                        <div className="flex-1">
                            {/* Email field */}
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    Enter the Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="sample@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            {/* Country field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Sri Lanka"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            {/* City field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Kandy"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            {/* Address field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    Address <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    placeholder="No 46, Rock View Garden Thennekumbura"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            {/* Name field */}
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ben"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            {/* Company Name field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Hemas"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            {/* NIC field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    NIC <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="200123456789"
                                    maxLength={12}
                                    value={nic}
                                    onChange={(e) => setNIC(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>

                            {/* Mobile number field */}
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-gray-900 text-left">
                                    Mobile number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="+94 xx xxxx xxx"
                                    maxLength={12}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-start">
                        <button type="button" onClick={(e) => validateAndSubmitSupplier(
                            e,
                            email,
                            name,
                            companyName,
                            nic,
                            country,
                            city,
                            mobile,
                            address,
                            setError,
                            setResponseMessage,
                            setProgress,
                            setAddSupplierOpen,
                            handleSupplierClear,
                            handleSupplierSubmit
                        )}
                            className="button-bg-color button-hover-color text-white px-4 py-2 rounded-md">Save</button>
                      <button type="button" onClick={handleSupplierClear} className="ml-2 bg-gray-600 text-white px-4 py-2 rounded-md">Clear</button>

                        {/* <button type="button" onClick={handleSupplierClear} className="ml-2 bg-gray-600 text-white px-4 py-2 rounded-md">Clear</button> */}

                    </div>
                </form>
                {/* Error and Response Messages */}
                {error && (
                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                    {error}
                    </p>
                    )}
            </div>
        </div>
    );
};