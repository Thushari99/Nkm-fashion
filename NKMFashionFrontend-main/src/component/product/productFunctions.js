import axios from 'axios';
import { toast } from 'react-toastify';

export const searchCategory = async (query, setProgress, setError, setCategoryData, setResponseMessage, categoryData) => {
    setProgress(true);
    setError('');
    try {
        if (!query.trim()) {
            setCategoryData(categoryData);
            setResponseMessage('');
            return;
        }
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCategory`, {
            params: { category: query },
        });
        if (response.data.foundCategory && response.data.foundCategory.length > 0) {
            setCategoryData(response.data.foundCategory);
            setResponseMessage('');
        } else {
            setCategoryData([]);
            setError('No categories found for the given query.');
        }
    } catch (error) {
        console.error('Find categories error:', error);
        setCategoryData([]);
        setError('No categories found for the given name.');
    } finally {
        setProgress(false);
    }
};


export const searchBrands = async (query, setProgress, setError, setBrandData, setResponseMessage, brandData) => {
    setProgress(true);
    setError('');
    try {
        if (!query.trim()) {
            setBrandData(brandData);
            setResponseMessage('');
            return;
        }
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchBrand`, {
            params: { brandName: query },
        });
        if (response.data.brand && response.data.brand.length > 0) {
            setBrandData(response.data.brand);
            setResponseMessage('');
        } else {
            setBrandData([]);
            setError('No brand found for the given query.');
        }
    } catch (error) {
        console.error('Find brand error:', error);
        setBrandData([]);
        setError('No brand found for the given name.');
    } finally {
        setProgress(false);
    }
};

export const searchSupplier = async (query, setProgress, setError, setSuplierData, setResponseMessage, suplierData) => {
    setProgress(true);
    setError('');
    try {
        if (!query.trim()) {
            setSuplierData(suplierData);
            setResponseMessage('');
            return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchSupplier`, {
            params: { keyword: query },
        });
        if (response.data.suppliers && response.data.suppliers.length > 0) {
            setSuplierData(response.data.suppliers);
            setResponseMessage('');
        } else {
            setSuplierData([]);
            setError('No supplier found for the given query.');
        }
    } catch (error) {
        console.error('Find supplier error:', error);
        setSuplierData([]);
        setError('No supplier found for the given name.');
    } finally {
        setProgress(false);
    }
};


export const handleSubmitCategory = (event, setError, setResponseMessage, setProgress, setAddCategoryOpen, categoryName, logo, code) => {
    event.preventDefault();
    setError('');
    setResponseMessage('');
    setProgress(true);
    const category = categoryName
    if (!category) {
        setError('Please add a category name.');
        return;
    }
    const formData = new FormData();
    formData.append('category', category);
    formData.append('logo', logo);
    formData.append('code', code);

    // Axios request to add category
    axios.post(`${process.env.REACT_APP_BASE_URL}/api/createCategory`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
        .then(result => {
            toast.success(
                "Category created successfully!",
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
            setAddCategoryOpen(false)
        })
        .catch(error => {
            if (error.response) {
                // Backend errors
                if (error.response.status === 400) {
                    const backendMessage = error.response?.data?.message || "Please provide valid inputs.";
                    toast.error(
                        backendMessage,
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                } else if (error.response.status === 409) {
                    toast.error(
                        "This category already exists.",
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                    // setError("This category already exists.");
                } else {
                    toast.error(
                        "Something went wrong. Please try again later.",
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
                    // setError("Something went wrong. Please try again later.");
                }
            } else {
                toast.error(
                    "Unable to connect to the server. Please check your network.",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                // setError("Unable to connect to the server. Please check your network.");
            }
        })
        .finally(() => {
            setProgress(false);
        });

};

export const handleSubmitBrand = async (
    event,
    setError,
    setResponseMessage,
    setProgress,
    setAddBrandOpen,
    brandName,
    logo,
    setLogoPreview,
    setBrandName
  ) => {
    event.preventDefault();
    setResponseMessage("");
    setError("");
  
    if (!brandName) {
      setError("Please add a brand name.");  // ✅ Only check brandName
      return;
    }
  
    const formData = new FormData();
    formData.append("brandName", brandName);
  
    if (logo) {
      formData.append("logo", logo);  // ✅ Append logo only if exists
    }
  
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
  
      toast.success("Brand created successfully!", { autoClose: 2000 });
      setAddBrandOpen(false);
      setLogoPreview('');
      setBrandName('');
    } catch (error) {
      toast.error("Brand not added", { autoClose: 2000 });
      console.error("Error creating brand:", error);
    } finally {
      setProgress(false);
    }
  };
  

  export const handleSupplierSubmit = async (
    event,
    username,
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
  ) => {
    event.preventDefault();
    setError('');
    setResponseMessage('');
    setProgress(true);
  
    let isValid = true;
  
    const normalizedUsername = username.toLowerCase();
  
    // Empty field validation
    if (!normalizedUsername || !name || !companyName || !nic || !country || !city || !mobile || !address) {
      setError("All fields are required.");
      setProgress(false);  // 👈 stop loading immediately
      return;
    }
  
    // Email validation
    if (!normalizedUsername.includes('@')) {
      setError('Email must be a valid address containing "@"');
      setProgress(false);  // 👈 stop loading immediately
      return;
    }
  
    // Mobile number validation
    const mobileRegex = /^\+94\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      setError('Invalid mobile number. Format: +94xxxxxxxxx');
      setProgress(false);  // 👈 stop loading immediately
      return;
    }
  
    // NIC validation
    const newNICRegex = /^\d{12}$/;         // 12 digits only
    const oldNICRegex = /^\d{9}[VXvx]$/;    // 9 digits + 'V' or 'X'
    if (!newNICRegex.test(nic) && !oldNICRegex.test(nic)) {
      setError('NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).');
      setProgress(false);  // 👈 stop loading immediately
      return;
    }
  
    // Prepare data for the request
    const supplierData = {
      username: normalizedUsername,
      name,
      companyName,
      nic,
      country,
      city,
      mobile,
      address
    };
  
    try {
      const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createSuplier`, supplierData);
  
      if (result.data.status === "success") {
        toast.success("Supplier created successfully!", { autoClose: 2000 });
        setAddSupplierOpen(false);
        handleSupplierClear();
      } else {
        toast.error(result.data.message || "Supplier creation failed.", { autoClose: 2000 });
      }
    } catch (error) {
      if (error.response) {
        toast.error("Error: " + error.response.data.message, { autoClose: 2000 });
      } else {
        toast.error("Error: " + error.message, { autoClose: 2000 });
      }
    } finally {
      setProgress(false);
    }
  };
  