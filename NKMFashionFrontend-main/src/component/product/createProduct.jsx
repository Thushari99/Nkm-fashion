import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../styles/role.css";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { useCurrency } from '../../context/CurrencyContext';
import { searchCategory, searchBrands, searchSupplier, handleSubmitCategory, handleSubmitBrand, handleSupplierSubmit } from "./productFunctions";
import CamIcon from '../../img/icons8-camera-100.png';
import { BrandModal, CategoryModal, SupplierModel } from "./shortcutsModels";
import { useNavigate } from 'react-router-dom';


function CreateProductBody() {
  const navigate = useNavigate();

  // State management for submit
  const [name, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrands] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState([]);
  const [warehouse, setWarehouse] = useState([]);
  const [warehouseValues, setWarehouseValues] = useState({});
  const [barcode, setBarcode] = useState("");
  const [unit, setBaseUnit] = useState("");
  const [supplier, setSuplier] = useState("");
  const [saleUnit, setSaleUnit] = useState("");
  const [purchase, setPurchaseUnit] = useState("");
  const [status, setStatus] = useState("");
  const [quantityLimit, setQL] = useState("");
  const [variation, setVariation] = useState("");
  const [variationType, setVariationTypes] = useState([]);
  const [selectedVariationTypes, setSelectedVariationTypes] = useState([]);
  const [variationValues, setVariationValues] = useState({});
  const [formattedWarehouses, setFormattedWarehouses] = useState({});
  const [showSections, setShowSections] = useState({});
  const [ptype, setType] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState([]);
  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [code, setCode] = useState('');
  const inputRef = useRef(null);
  const debounceTimeout = useRef(null);
  const { currency } = useCurrency()
  const [warehouseVariationValues, setWarehouseVariationValues] = useState({});

  //satate managment for fetching data
  const [suplierData, setSuplierData] = useState([]);
  const [warehouseData, setWherehouseData] = useState([]);
  const [brandData, setBrandData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [variationData, setVariationData] = useState([]);
  const [progress, setProgress] = useState(false);

  //category shortcut state
  const [addCatergoryModel, setAddCategoryOpen] = useState(false);
  const [categoryName, setCatergory] = useState('');
  const [logo, setLogo] = useState(null);

  //brand shortcut state 
  const [addBrandModel, setAddBrandOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);;
  const [brandName, setBrandName] = useState('');

  // Supplier shortcut state
  const [addSupplierModel, setAddSupplierOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [suplierName, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [nic, setNIC] = useState("");
  const [mobile, setMobile] = useState("");

  // Category shortcut states
const [categoryLogo, setCategoryLogo] = useState(null);
const [categoryLogoPreview, setCategoryLogoPreview] = useState(null);

// Brand shortcut states
const [brandLogo, setBrandLogo] = useState(null);
const [brandLogoPreview, setBrandLogoPreview] = useState(null);


  useEffect(() => {
    console.log(warehouseVariationValues)
  }, [warehouseVariationValues])

  //Fetching properties for create products ==========================================================================================================
  const fetchData = async (url, setData, transformData) => {
    try {
      const response = await axios.get(url);
      const data = transformData ? transformData(response.data) : response.data;
      setData(data);
    } catch (error) {
      console.error(`Fetch data error from ${url}:`, error);
      setData([]);
    } finally {
      setProgress(false);
    }
  };
  useEffect(() => {
    setProgress(true);
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, setWherehouseData, (data) => data.warehouses || []
    );
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/allBaseUnit`, setBaseUnit
    );
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/findAllUnit`, setUnitData, (data) => data.units || []
    );
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/findAllVariations`, setVariationData, (data) => data.variations || []
    );
  }, []);

  const fetchCategories = () => {
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/findCategory`, setCategoryData, (data) => data.categories || []
    );
  };
  const fetchbrands = () => {
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/findBrand`, setBrandData, (data) => data.brands || []
    );
  };
  const fetchSupplier = () => {
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/fetchSupplier`, setSuplierData, (data) => data.suppliers || []
    );
  }

  const handleCategoryInput = (e) => {
    const value = e.target.value;
    setCategory(value);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      if (value.trim() === '') {
        setError('');
        setResponseMessage('');
        setCategoryData(categoryData);
      } else {
        searchCategory(value, setProgress, setError, setCategoryData, setResponseMessage, categoryData);
      }
    }, 100);
  };

  const handleBrandInput = (e) => {
    const value = e.target.value;
    setBrands(value);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      if (value.trim() === '') {
        setError('');
        setResponseMessage('');
        setBrandData(brandData);
      } else {
        searchBrands(value, setProgress, setError, setBrandData, setResponseMessage, brandData);
      }
    }, 100);
  }

  const handleSupplierInput = (e) => {
    const value = e.target.value;
    setSuplier(value);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      if (value.trim() === '') {
        setError('');
        setResponseMessage('');
        setSuplierData(suplierData);
      } else {
        searchSupplier(value, setProgress, setError, setSuplierData, setResponseMessage, suplierData);
      }
    }, 100);

  }

  const handleKeyDownCat = (e) => {
    const value = e.target.value;
    if (e.key === "Backspace" && value === '') {
      searchCategory(
        '',
        setProgress,
        setError,
        setCategoryData,
        setResponseMessage,
        categoryData
      );
    }
  };

  const handleKeyDownBrand = (e) => {
    const value = e.target.value;
    if (e.key === "Backspace" && value === '') {
      searchCategory(
        '',
        setProgress, setError, setBrandData, setResponseMessage, brandData
      );
    }
  };

  const handleKeyDownSup = (e) => {
    const value = e.target.value;
    if (e.key === "Backspace" && value === '') {
      searchCategory(
        '',
        setProgress, setError, setSuplierData, setResponseMessage, suplierData
      );
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (file.type !== "image/jpeg" || !file.name.toLowerCase().endsWith(".jpg")) {
      setError("Only JPG files are allowed. Please upload a valid JPG file.");
      alert("Only JPG files are allowed. Please upload a valid JPG file.");
      inputRef.current.value = "";
      return;
    }

    const maxFileSizeMB = 4;
    if (file.size / 1024 / 1024 > maxFileSizeMB) {
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
      // Ensure image is approximately square (1:1 ratio within a 100px tolerance)
      const image = await imageCompression.getDataUrlFromFile(file);
      const img = new Image();
      img.src = image;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const tolerance = 100;

          if (Math.abs(width - height) > tolerance) {
            alert("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            inputRef.current.value = "";
            reject();
            return;
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          inputRef.current.value = "";
          reject();
          return;
        };
      });

      const compressedBlob = await imageCompression(file, options);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
        type: "image/jpeg",
      });

      // Update state with the compressed image only if all validations pass
      setImage(compressedFile);
      setError("");
    } catch (error) {
      console.error("Compression Error:", error);
    }
  };

  // Handle sale unit from base units
  const handleBaseUnitChange = (e) => {
    const selectedBaseUnit = e.target.value;
    setBaseUnit(selectedBaseUnit);
    const correspondingUnit = unitData.find(
      (unit) => unit.baseUnit === selectedBaseUnit
    );
    if (correspondingUnit) {
      setSaleUnit(correspondingUnit.unitName);
    } else {
      setSaleUnit("");
    }
  };

  // Handle variation change
  const handleVariationChange = (e) => {
    e.preventDefault();
    setVariation('');
    setSelectedVariationTypes([]);
    setShowSections({});
    setWarehouseVariationValues({});
    const selectedVariation = e.target.value;
    setVariation(selectedVariation);
    setVariationValues({});

    const selectedData = variationData.find(
      (varn) => varn.variationName === selectedVariation
    );

    if (selectedData && Array.isArray(selectedData.variationType)) {
      setVariationTypes(selectedData.variationType);
    } else {
      setVariationTypes([]);
    }
  };


  const handleAddWarehouse = (e) => {
    const selectedOption = e.target.value;
    if (selectedOption && !selectedWarehouse.includes(selectedOption)) {
      setSelectedWarehouse([...selectedWarehouse, selectedOption]);

      // Initialize values based on product type
      if (ptype === "Single") {
        setWarehouseValues(prev => ({
          ...prev,
          [selectedOption]: {
            productCost: '',
            productPrice: '',
            productQty: '',
            stockAlert: '',
            orderTax: '',
            taxType: 'Exclusive',
            discount: ''
          }
        }));
      }
    }
    e.target.value = "";
  };


  // Update handleRemoveWarehouse to also clear warehouse values
  const handleRemoveWarehouse = (event, typeToRemove) => {
    setSelectedWarehouse(prev => prev.filter(type => type !== typeToRemove));
    setShowSections(prev => ({ ...prev, [typeToRemove]: false }));
    setWarehouseValues(prevValues => {
      const newValues = { ...prevValues };
      delete newValues[typeToRemove];
      console.log("🧹 Removing warehouse:", typeToRemove);
      return newValues;
    });
  };


  const handleVariationValueChange = (warehouseName, variationType, field, value) => {
    setWarehouseVariationValues(prev => ({
      ...prev,
      [warehouseName]: {
        ...prev[warehouseName],
        [variationType]: {
          ...(prev[warehouseName]?.[variationType] || {}),
          [field]: value
        }
      }
    }));
  };

  const handleAddVariationType = (e) => {
    const newVariation = e.target.value;

    setSelectedVariationTypes([...selectedVariationTypes, newVariation]);

    setWarehouseVariationValues(prev => {
      const updated = { ...prev };
      selectedWarehouse.forEach(warehouse => {
        updated[warehouse] = {
          ...updated[warehouse],
          [newVariation]: {}
        };
      });
      return updated;
    });
  };

  // Handle removing a selected variation type
  const handleRemoveVariationType = (typeToRemove) => {
    setSelectedVariationTypes(
      selectedVariationTypes.filter((type) => type !== typeToRemove)
    );
    setShowSections({
      ...showSections,
      [typeToRemove]: false,
    });
  };

  // //Handle variaion input changing
  const handleWarehouseValueChange = (warehouseName, field, value) => {
    setWarehouseValues(prev => ({
      ...prev,
      [warehouseName]: {
        ...prev[warehouseName],
        [field]: Number(value)
      }
    }));
  };

  //Save button enabile and disable checking
  const isFormValid =
    name &&
    code &&
    warehouse &&
    brand &&
    category &&
    supplier &&
    ptype &&
    unit &&
    saleUnit &&
    purchase &&
    status &&
    barcode &&
    quantityLimit;

  //Handle submit for save product
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResponseMessage("");
    setProgress(true);

    const formattedWarehouses =
  ptype === "Single"
    ? Object.entries(warehouseValues).reduce((acc, [warehouseName, values]) => {
        acc[warehouseName] = values;
        return acc;
      }, {})
    : Object.entries(warehouseVariationValues).reduce((acc, [warehouseName, variations]) => {
        acc[warehouseName] = variations;
        return acc;
      }, {});

    try {
      // Ensure warehouseValues is an object
      const formData = new FormData();
      formData.append("name", name);
      formData.append("code", code);
      if (image) {
        formData.append("image", image);
      }
      formData.append("brand", brand);
      formData.append("unit", unit);
      formData.append("ptype", ptype);
      formData.append("category", category);
      formData.append("saleUnit", saleUnit);
      formData.append("supplier", supplier);
      formData.append("status", status);
      formData.append("note", note);
      formData.append("purchase", purchase);
      formData.append("quantityLimit", quantityLimit);
      formData.append("barcode", barcode);
      formData.append("variation", variation);
      formData.append("warehouse", JSON.stringify(formattedWarehouses));
      formData.append("variationValues", JSON.stringify(variationValues));
      formData.append("variationType", JSON.stringify(variationType));

      // if (ptype === "Single") {
      //   formData.append("warehouse", JSON.stringify(warehouseValues));
      // }

      // Debugging: Log form data
      for (const [key, value] of formData.entries()) {
        try {
          const parsedValue = JSON.parse(value);
          console.log(`${key}:`, parsedValue);
        } catch (error) {
          console.log(`${key}:`, value);
        }
      }

      await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createProduct`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product created successfully!", { autoClose: 2000 });
      handleClear();

    } catch (error) {
      if (error.response) {
        const { message } = error.response.data;
        if (message) {
          toast.error(message, { autoClose: 2000 });
        } else {
          toast.error("Product not added", { autoClose: 2000 });
        }
      } else {
        toast.error(
          "An error occurred while creating the product. Please try again.",
          { autoClose: 2000 }
        );
      }
      console.error("Product creation failed:", error);
    } finally {
      setProgress(false);
    }
  };

  // Handle clear operation
  const handleClear = () => {
    setProductName("");
    setCode("");
    setCategory("");
    setBrands("");
    setSuplier("");
    setBarcode("");
    setBaseUnit("");
    setSaleUnit("");
    setPurchaseUnit("");
    setQL(""); // Quantity Limitation
    setType("");
    setNote("");
    setImage([]);
    setSelectedWarehouse([]);
    setWarehouse([]);
    setWarehouseValues({});
    setWarehouseVariationValues({});
    setVariation("");
    setVariationTypes([]);
    setSelectedVariationTypes([]);
    setVariationValues({});
    setShowSections({});
    setError("");
    setResponseMessage("");
    setStatus("");

    // 🛠 Clear file input manually
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  

  const handleClearCatergoryModel = () => {
    setCatergory('');
    setCode('');
    setLogoPreview(null);
    setCategoryLogoPreview(null);
    setLogo(null);
    setCategoryLogo(null)
    setError('');
    setResponseMessage('');
  };

  const handleClearBrandModel = () => {
    setBrandName('')
    setLogoPreview(null);
    setBrandLogoPreview(null);
    setLogo(null);
    setBrandLogo(null);
    setError('');
    setResponseMessage('');
  }

  const handleSupplierClear = () => {
    setEmail('');
    setCountry('');
    setCity('');
    setAddress('');
    setName('');
    setCompanyName('');
    setNIC('');
    setMobile('');
    setError('');
    setResponseMessage('');
  };

const handleCategoryLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("No file selected.");
      return;
    }
  
    // Check file type (strictly allow only JPG files)
    if (file.type !== "image/jpeg" || !file.name.toLowerCase().endsWith(".jpg")) {
      setError("Only JPG files are allowed. Please upload a valid JPG file.");
      alert("Only JPG files are allowed. Please upload a valid JPG file.");
      inputRef.current.value = ""; // Clear the input field
      return;
    }
  
    // Check file size (max 4MB)
    const maxFileSizeMB = 4;
    if (file.size / 1024 / 1024 > maxFileSizeMB) {
      setError(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
      alert(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
      inputRef.current.value = ""; // Clear the input field
      return;
    }
  
    // Compression 
    const options = {
      maxSizeMB: 0.02, // Target size (20KB in MB)
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
  
    try {
      const image = await imageCompression.getDataUrlFromFile(file);
      const img = new Image();
      img.src = image;
  
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const tolerance = 100; // Allow 100px variance
  
          if (Math.abs(width - height) > tolerance) {
            setError("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            alert("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            inputRef.current.value = ""; 
            reject();
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          setError("Error loading image. Please try again.");
          inputRef.current.value = "";
          reject();
        };
      });
  
      const originalPreviewUrl = URL.createObjectURL(file);

      setLogoPreview(originalPreviewUrl);

      setCategoryLogoPreview(originalPreviewUrl);   // 👉 setCategoryLogoPreview

      const compressedBlob = await imageCompression(file, options);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
  
      setCategoryLogo(compressedFile);   // 👉 setCategoryLogo
      setError("");
    } catch (error) {
      console.error("Compression Error:", error);
      setError("Error during image processing. Please try again.");
    }
  };
  

  const handleBrandLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("No file selected.");
      return;
    }
  
    // Check file type (strictly allow only JPG files)
    if (file.type !== "image/jpeg" || !file.name.toLowerCase().endsWith(".jpg")) {
      setError("Only JPG files are allowed. Please upload a valid JPG file.");
      alert("Only JPG files are allowed. Please upload a valid JPG file.");
      inputRef.current.value = ""; // Clear the input field
      return;
    }
  
    // Check file size (max 4MB)
    const maxFileSizeMB = 4;
    if (file.size / 1024 / 1024 > maxFileSizeMB) {
      setError(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
      alert(`File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`);
      inputRef.current.value = ""; // Clear the input field
      return;
    }
  
    // Compression options
    const options = {
      maxSizeMB: 0.02, // Target size (20KB in MB)
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
  
    try {
      const image = await imageCompression.getDataUrlFromFile(file);
      const img = new Image();
      img.src = image;
  
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const tolerance = 100; // Allow 100px variance
  
          if (Math.abs(width - height) > tolerance) {
            setError("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            alert("Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image.");
            inputRef.current.value = "";
            reject();
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          setError("Error loading image. Please try again.");
          inputRef.current.value = "";
          reject();
        };
      });
  
      const originalPreviewUrl = URL.createObjectURL(file);
      setBrandLogoPreview(originalPreviewUrl);   // 👉 Set brand logo preview here
  
      const compressedBlob = await imageCompression(file, options);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
  
      setBrandLogo(compressedFile);              // 👉 Set brand logo file here
      setError("");
    } catch (error) {
      console.error("Compression Error:", error);
      setError("Error during image processing. Please try again.");
    }
  };
  

  return (
    <div className='background-white absolute top-[80px] left-[18%] w-[82%] min-h-full p-5'>
      <div className='flex justify-between items-center'>
        {progress && (
          <Box
            sx={{
              width: "100%",
              position: "fixed",
              top: "80px",
              left: "18%",
              margin: "0",
              padding: "0",
              zIndex: 1200,
            }}
          >
            <LinearProgress />
          </Box>
        )}
        <div>
          <h2 className="text-lightgray-300  m-0 p-0 text-2xl">
            Create Product
          </h2>
        </div>
        <div>
          <Link
            className="px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white"
            to={"/viewProducts"}
          >
            Back
          </Link>
        </div>
      </div>
      <div className="bg-white mt-[20px] w-full min-h-full rounded-2xl px-8 shadow-md justify-between">
        <form className="pb-10 justify-between" onSubmit={handleSubmit}>
          <div className="flex min-h-full flex-1 flex-col px-2 py-10 lg:px-12 justify-between">
            {/* Container for the three sub-divs */}
            <div className="flex flex-col lg:flex-row lg:space-x-8 justify-between mt-2">
              {/* First Sub-Div ============================================================================== */}
              <div className="flex flex-col lg:flex-row lg:space-x-8 w-full">
                {/* Product Name */}
                <div className="flex-1 w-full">
                  <div className="mt-2">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Product name <span className="mt-1 text-xs text-gray-500 text-left">(Max 20 characters)</span> <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Enter name"
                        maxLength={20}
                        value={name}
                        onChange={(e) => setProductName(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Code */}
                <div className="flex-1">
                  <div className="mt-2">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Product code <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="code"
                        name="code"
                        type="text"
                        required
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter code"
                        value={code}
                        className="block w-full lg:w-80 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="flex-1 w-full">
                  <div className="mt-2">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Images
                    </label>
                    <div className="mt-2">
                      <input
                        id="image"
                        name="image"
                        type="file"
                        ref={inputRef}
                        onChange={handleImageChange}
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex flex-col lg:flex-row lg:space-x-4 mt-4">
              {/* Second Sub-Div ============================================================================== */}
              <div className="flex flex-col lg:flex-row lg:space-x-8 w-full">
                {/* Category */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-4">
                    <div className="flex mb-0 items-end justify-between">
                      <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => setAddCategoryOpen(true)}
                        className="bg-gray-300 p-2 pb-3 relative mr-0 ml-2 rounded-md flex items-center text-gray-400 self-end translate-y-3"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="white"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="relative w-full mt-1">
                      <form
                        className="flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          searchCategory(category);
                        }}
                      >
                        <input
                          onChange={handleCategoryInput}
                          onKeyDown={handleKeyDownCat}
                          id="category"
                          name="category"
                          onFocus={fetchCategories}
                          type="text"
                          placeholder="Search by category name..."
                          className="searchBox w-full pl-10 pr-10 py-[7.5px] border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                          value={category}
                        />
                        <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </form>
                      {categoryData.length > 0 && (
                        <div className="absolute w-full mt-2 z-10 shadow-md">
                          <ul className="searchBox w-full text-left shadow-sm focus:border-transparent bg-white rounded-md max-h-32 overflow-y-auto scroll-container">
                            {categoryData.map((ct, index) => (
                              <li
                                key={index}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  setCategory(ct.category);
                                  setCategoryData([]);
                                }}
                              >
                                {ct.category}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-4">
                    <div className="flex mb-0 items-end justify-between">
                      <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                        Brand <span className='text-red-500'>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => setAddBrandOpen(true)} // Add your handler function here
                        className="bg-gray-300 p-2 pb-3 relative mr-0 ml-2 rounded-md flex items-center text-gray-400 self-end translate-y-3"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="white"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="relative w-full mt-1">
                      <form
                        className="flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          searchBrands(brand);
                        }}
                      >
                        <input
                          onChange={handleBrandInput}
                          onKeyDown={handleKeyDownBrand}
                          id="brand"
                          name="brand"
                          required
                          onFocus={fetchbrands}
                          value={brand}
                          type="text"
                          placeholder="Search by brand name..."
                          className="searchBox w-full pl-10 pr-4 py-[7.5px] border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                        />
                        <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </form>{brandData.length > 0 && (
                        <div className="absolute w-full mt-2 z-10 shadow-md">
                          <ul className="searchBox w-full text-left shadow-sm focus:border-transparent bg-white rounded-md max-h-32 overflow-y-auto scroll-container">
                            {brandData.map((brand, index) => (
                              <li
                                key={index}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  setBrands(brand.brandName);
                                  setBrandData([]);
                                }}
                              >
                                {brand.brandName}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-4">
                    <div className="flex mb-0 items-end justify-between">
                      <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                        Supplier <span className='text-red-500'>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => setAddSupplierOpen(true)} // Add your handler function here
                        className="bg-gray-300 p-2 pb-3 relative mr-0 ml-2 rounded-md flex items-center text-gray-400 self-end translate-y-3"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="white"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="relative w-full mt-1">
                      <form
                        className="flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          searchSupplier(supplier);
                        }}
                      >
                        <input
                          onChange={handleSupplierInput}
                          onKeyDown={handleKeyDownSup}
                          id="supplier"
                          name="supplier"
                          required
                          onFocus={fetchSupplier}
                          value={supplier}
                          type="text"
                          placeholder="Search by supplier name..."
                          className="searchBox w-full pl-10 pr-4 py-[7.5px] border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                        />
                        <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </form>{suplierData.length > 0 && (
                        <div className="absolute w-full mt-2 z-10 shadow-md">
                          <ul className="searchBox w-full text-left pb-2 shadow-sm focus:border-transparent bg-white rounded-md max-h-32 overflow-y-auto scroll-container">
                            {suplierData.map((sp, index) => (
                              <li
                                key={index}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  setSuplier(sp.name);
                                  setSuplierData([]);
                                }}
                              >
                                {sp.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-4 mt-5">
              {/* Third Sub-Div ============================================================================== */}
              <div className="flex flex-col lg:flex-row lg:space-x-8 w-full">
                {/* Barcode */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Barcode type <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="barcode"
                        name="barcode"
                        required
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a barcode</option>
                        <option value="code128">Code 128</option>
                        <option value="code39">Code 39</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Purchase Unit <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="purchase_unit"
                        name="purchase_unit"
                        value={purchase}
                        required
                        onChange={(e) => setPurchaseUnit(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a purchase unit</option>
                        {Array.isArray(unitData) &&
                          unitData.map((u) => (
                            <option key={u.unitName} value={u.unitName}>
                              {u.unitName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Status <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="status"
                        name="status"
                        required
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a status</option>
                        <option value="Received">Received</option>
                        <option value="Pending">Pending</option>
                        <option value="Ordered">Ordered</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-4 mt-5">
              {/* Fourth Sub-Div ============================================================================== */}
              <div className="flex flex-col lg:flex-row lg:space-x-8 w-full">
                {/* Base Unit */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Base unit <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="unit"
                        name="unit"
                        required
                        value={unit}
                        onChange={handleBaseUnitChange}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a base unit</option>
                        {Array.isArray(unitData) &&
                          unitData.map((bu) => (
                            <option key={bu.baseUnit} value={bu.baseUnit}>
                              {bu.baseUnit}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sale Unit */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Sale Unit <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="sale_unit"
                        name="sale_unit"
                        value={saleUnit}
                        required
                        onChange={(e) => setSaleUnit(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a sale unit</option>
                        {Array.isArray(unitData) &&
                          unitData.map((u) => (
                            <option key={u.unitName} value={u.unitName}>
                              {u.unitName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quantity Limitation */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Quantity Limitation <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="QuantityLimitation"
                        name="QuantityLimitation"
                        type="text"
                        required
                        onChange={(e) => setQL(e.target.value)}
                        placeholder="Quantity Limitation"
                        value={quantityLimit}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-4 mt-5">
              {/* Fifth Sub-Div ============================================================================== */}
              <div className="flex flex-col lg:flex-row lg:space-x-8 w-full">
                {/* Note */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Note
                    </label>
                    <div className="mt-[8px]">
                      <input
                        id="note"
                        name="note"
                        placeholder="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Type */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Product type <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="ptype"
                        name="ptype"
                        required
                        value={ptype}
                        onChange={(e) => {
                          setType(e.target.value);
                          setVariation("");
                          setWarehouseValues({});
                          setSelectedVariationTypes([]);
                          setSelectedWarehouse([]);
                          setWarehouseVariationValues({});
                        }}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a type</option>
                        <option>Single</option>
                        <option>Variation</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Variation Dropdown */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Variation
                    </label>
                    <div className="mt-2">
                      <select
                        id="variation"
                        name="variation"
                        value={variation}
                        onChange={handleVariationChange}
                        className={`block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${ptype !== "Variation" ? "opacity-50 pointer-events-none" : ""}`}
                        disabled={ptype !== "Variation"}
                      >
                        <option value="">Select a variation</option>
                        {variationData.map((varn) => (
                          <option key={varn.variationName} value={varn.variationName}>
                            {varn.variationName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse */}
            <div className="flex-1 w-full lg:mb-0">
              <div className="mt-10 pr-16">
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Warehouse<span className='text-red-500'>*</span>
                </label>
                <div className="mt-2">
                  <select
                    id="warehouse"
                    name="warehouse"
                    value={selectedWarehouse}
                    onChange={handleAddWarehouse}
                    className="block w-1/3 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
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
            </div>
            <div className="flex flex-wrap mt-3 gap-2">
              {selectedWarehouse &&
                selectedWarehouse.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center px-3 py-1 bg-gray-200 rounded-full text-sm"
                  >
                    {type}
                    <button
                      type="button"
                      className="ml-2 text-red-500"
                      onClick={(event) => handleRemoveWarehouse(event, type)}
                    >
                      &#x2715;
                    </button>
                  </div>
                ))}
            </div>

            {/**VARIATION MANAGE SECTION========================================================================================================== */}

            <hr className="mt-16" />

            {/*CREATE VARIATION PROPERTIES============================================================================================================================*/}

            {variation && selectedWarehouse.map((warehouseName) => (
              <div className="border-2 mt-20 rounded-lg p-5 text-gray-700 text-left bold" key={warehouseName}>
                <button
                  type="button"
                  className="mr-4 text-gray-500 size-4 text-xl stroke-8"
                  onClick={(event) => handleRemoveWarehouse(event, warehouseName)}
                >
                  &#x2715;
                </button>

                Product Details For {warehouseName}

                {/* Variation type selection */}
                {ptype === "Variation" && (
                  <div className="mt-8">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Select Variation Types <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        onChange={handleAddVariationType}
                        className="block w-[31%] border-b border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:ring-0 focus:border-gray-600 outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select Types</option>
                        {variationType.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Selected variation chips */}
                <div className="flex flex-wrap mt-3 gap-2">
                  {selectedVariationTypes.map((type) => (
                    <div
                      key={type}
                      className="flex items-center px-3 py-1 bg-gray-200 rounded-full text-sm"
                    >
                      {type}
                      <button
                        type="button"
                        className="ml-2 text-red-500"
                        onClick={() => handleRemoveVariationType(type)}
                      >
                        &#x2715;
                      </button>
                    </div>
                  ))}
                </div>

                {/* Variation input fields */}
                {selectedVariationTypes.map((type) => (
                  <div className="mt-12 variationPropertyManaging" key={type}>
                    <h3 className="text-md mb-4 mt-5 text-gray-700">
                      {type} Properties for {warehouseName}
                    </h3>
                    <div className="p-[15px] rounded-md">
                      <div className="flex space-x-4 mb-5">
                        {/* Left Column */}
                        <div className="flex-1">
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                              Variation Type <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={type}
                              type="text"
                              readOnly
                              className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                          </div>
                          <label className="block mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                            Stock Alert <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="Stock Alert"
                            value={warehouseVariationValues[warehouseName]?.[type]?.stockAlert || ""}
                            onChange={(e) =>
                              handleVariationValueChange(
                                warehouseName,
                                type,
                                "stockAlert",
                                e.target.value
                              )
                            }
                            className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                          />
                          
                        </div>

                        {/* Middle Column */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Product Cost <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Product Cost"
                              value={warehouseVariationValues[warehouseName]?.[type]?.productCost || ""}
                              onChange={(e) =>
                                handleVariationValueChange(
                                  warehouseName,
                                  type,
                                  "productCost",
                                  e.target.value
                                )
                              }
                              className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                            <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px]  inset-y-0 right-0 pr-3 flex items-center px-2 ">
                              {currency}
                            </span>
                          </div>
                          <label className="block mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                            Order Tax
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Order Tax"
                              value={warehouseVariationValues[warehouseName]?.[type]?.orderTax || ""}
                              onChange={(e) =>
                                handleVariationValueChange(
                                  warehouseName,
                                  type,
                                  "orderTax",
                                  e.target.value
                                )
                              }
                              className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                            <span className="absolute mr-[10.6%] w-[47px] pl-4 text-center rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px] inset-y-0 right-0 pr-3 flex items-center px-2 ">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex-1">
                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Product Price <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Product Price"
                              value={warehouseVariationValues[warehouseName]?.[type]?.productPrice || ""}
                              onChange={(e) =>
                                handleVariationValueChange(
                                  warehouseName,
                                  type,
                                  "productPrice",
                                  e.target.value
                                )
                              }
                              className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                            <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px]  inset-y-0 right-0 pr-3 flex items-center px-2 ">
                              {currency}
                            </span>
                          </div>
                          <label className="block mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                            Tax Type
                          </label>
                          <select
                            value={warehouseVariationValues[warehouseName]?.[type]?.taxType || "Exclusive"}
                            onChange={(e) =>
                              handleVariationValueChange(
                                warehouseName,
                                type,
                                "taxType",
                                e.target.value
                              )
                            }
                            className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                          >
                            <option>Exclusive</option>
                            <option>Inclusive</option>
                          </select>
                        </div>

                        {/* Price/Quantity Column */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Product Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="Add Product Quantity"
                            value={warehouseVariationValues[warehouseName]?.[type]?.productQty || ""}
                            onChange={(e) =>
                              handleVariationValueChange(
                                warehouseName,
                                type,
                                "productQty",
                                e.target.value
                              )
                            }
                            className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                          />

<label className="block mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                            Discount
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Discount"
                              value={warehouseVariationValues[warehouseName]?.[type]?.discount || ""}
                              onChange={(e) =>
                                handleVariationValueChange(
                                  warehouseName,
                                  type,
                                  "discount",
                                  e.target.value
                                )
                              }
                              className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                            <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px]  inset-y-0 right-0 pr-3 flex items-center px-2 ">
                              {currency}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-400 text-left">
                        Ensure numeric input fields contain valid numbers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/**SINGLE PRODUCT VARIATION PROPERTIES */}
            {ptype === "Single" && (
              <div className="mt-8">
                {selectedWarehouse.length > 0 ? (
                  selectedWarehouse.map((warehouseName) => (
                    <div key={warehouseName} className="border-2 p-5 text-left mt-4 rounded-xl mb-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-md text-gray-700">{warehouseName}</h3>
                        <button
                          type="button"
                          className="mr-4 text-gray-500 size-4 text-xl stroke-8"
                          onClick={(event) => handleRemoveWarehouse(event, warehouseName)}

                        >
                          &#x2715;
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product Cost <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={warehouseValues[warehouseName]?.productCost || ""}
                                onChange={(e) => handleWarehouseValueChange(warehouseName, 'productCost', e.target.value)}
                                className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                                placeholder="0.00"
                              />
                              <span className="m-[1px] absolute top-0 bottom-0 right-0 flex items-center px-2 bg-gray-100 text-gray-500 rounded-r-[5px]">
                                {currency}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Stock Alert <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={warehouseValues[warehouseName]?.stockAlert || ""}
                              onChange={(e) => handleWarehouseValueChange(warehouseName, 'stockAlert', e.target.value)}
                              className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product Price <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={warehouseValues[warehouseName]?.productPrice || ""}
                                onChange={(e) => handleWarehouseValueChange(warehouseName, 'productPrice', e.target.value)}
                                className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                                placeholder="0.00"
                              />
                              <span className="m-[1px] absolute top-0 bottom-0 right-0 flex items-center px-2 bg-gray-100 text-gray-500 rounded-r-[5px]">
                                {currency}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Order Tax (%)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={warehouseValues[warehouseName]?.orderTax || ""}
                                onChange={(e) => handleWarehouseValueChange(warehouseName, 'orderTax', e.target.value)}
                                className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                                placeholder="0"
                              />
                              <span className="absolute rounded-r-[4px] w-[44px] justify-center m-[1px] bg-gray-100 text-gray-500 inset-y-0 right-0 pr-3 flex items-center px-2 ">
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={warehouseValues[warehouseName]?.productQty || ""}
                              onChange={(e) => handleWarehouseValueChange(warehouseName, 'productQty', e.target.value)}
                              className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tax Type
                            </label>
                            <select
                              value={warehouseValues[warehouseName]?.taxType || "Exclusive"}
                              onChange={(e) => handleWarehouseValueChange(warehouseName, 'taxType', e.target.value)}
                              className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                            >
                              <option>Exclusive</option>
                              <option>Inclusive</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Discount
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={warehouseValues[warehouseName]?.discount || ""}
                                onChange={(e) => handleWarehouseValueChange(warehouseName, 'discount', e.target.value)}
                                className="block w-[100%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                                placeholder="0.00"
                              />
                              <span className="m-[1px] absolute top-0 bottom-0 right-0 flex items-center px-2 bg-gray-100 text-gray-500 rounded-r-[5px]">
                                {currency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-center">
                      No warehouses added yet. Select warehouses above to add pricing and inventory details.
                    </p>
                  </div>
                )}
              </div>
            )}
            <CategoryModal
              addCatergoryModel={addCatergoryModel}
              setAddCategoryOpen={setAddCategoryOpen}
              handleSubmit={handleSubmit}
              categoryName={categoryName}
              setCatergory={setCatergory}
              code={code}
              setCode={setCode}
              handleLogoChange={handleCategoryLogoChange}
              logoPreview={categoryLogoPreview}
              inputRef={inputRef}
              CamIcon={CamIcon}
              handleSubmitCategory={handleSubmitCategory}
              setError={setError}
              setResponseMessage={setResponseMessage}
              setProgress={setProgress}
              logo={categoryLogo}
              handleClearCatergoryModel={handleClearCatergoryModel}
            />

            <BrandModal
              addBrandModel={addBrandModel}
              setAddBrandOpen={setAddBrandOpen}
              handleSubmit={handleSubmit}
              brandName={brandName}
              setBrandName={setBrandName}
              handleLogoChange={handleBrandLogoChange}
              logoPreview={brandLogoPreview}
              inputRef={inputRef}
              CamIcon={CamIcon}
              handleSubmitBrand={handleSubmitBrand}
              setError={setError}
              setResponseMessage={setResponseMessage}
              setProgress={setProgress}
              logo={brandLogo}
              setLogoPreview={setLogoPreview}
              handleClearBrandModel={handleClearBrandModel}
            />


            <SupplierModel
              addSupplierModel={addSupplierModel}
              setAddSupplierOpen={setAddSupplierOpen}
              email={email}
              setEmail={setEmail}
              country={country}
              setCountry={setCountry}
              city={city}
              setCity={setCity}
              address={address}
              setAddress={setAddress}
              name={suplierName}
              setName={setName}
              companyName={companyName}
              setCompanyName={setCompanyName}
              nic={nic}
              setNIC={setNIC}
              mobile={mobile}
              setMobile={setMobile}
              error={error}
              responseMessage={responseMessage}
              handleSupplierSubmit={handleSupplierSubmit}
              handleSupplierClear={handleSupplierClear}
              setError={setError}
              setResponseMessage={setResponseMessage}
              setProgress={setProgress}
            />

            {/*SAVE AND CLEAR BUTTONS==============================================================================================================================*/}
            <div className="flex justify-start mt-10">
              <div className="mt-20">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`rounded-md px-4 py-3.5 h-[48px] text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[171px] text-center ${isFormValid
                    ? "button-bg-color button-hover-color"
                    : "bg-[#35af8787] cursor-not-allowed"
                    }`}
                >
                  Save Product
                </button>
                <button
                  type="button"
                  className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-3.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[170px] focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProductBody;
