import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { handleProductSelect, handleProductSearch, handleSuplierSearch, handleSuplierSelect, handleWarehouseChange, handleVariationChange, getQty, getPriceRange, handleDelete, handleQtyChange, getTax, handleSave, handleWarehouseChangeProduct } from '../../component/purchase/PurchaseController'
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../pos/utils/fetchByWarehose';
import Decrease from '../../img/down-arrow (1).png';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import formatWithCustomCommas from '../utill/NumberFormate';
import { toast } from 'react-toastify';
import { useCurrency } from '../../context/CurrencyContext';
import CreateProductBody from '../product/createProduct';
import imageCompression from 'browser-image-compression';
import { FaTimes, FaPlus } from "react-icons/fa";

function CreatePurchaseBody() {
    // State management
    const { currency } = useCurrency()
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSuplier, setSearchSuplier] = useState('');
    const [filteredSuplier, setFilteredSuplier] = useState([])
    const [selectedSuplier, setSelectedSuplier] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [date, setDate] = useState('')
    const [invoiceNumber, setInvoice] = useState('');
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [productBillingHandling, setSearchedProductData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [discountSymbole, setDiscountSymbole] = useState(currency);
    const [discount, setDiscount] = useState('')
    const [shipping, setShipping] = useState('')
    const [tax, setTax] = useState('')
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [brandData, setBrandData] = useState([]);
      const [categoryData, setCategoryData] = useState([]);
       const debounceTimeout = useRef(null);
       const [suplierData, setSuplierData] = useState([]);
       const [unitData, setUnitData] = useState([]);
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [name, setProductName] = useState("");
    const [code, setCode] = useState('');
      const [category, setCategory] = useState("");
      const [brand, setBrands] = useState("");
      const [barcode, setBarcode] = useState("");
      const [unit, setBaseUnit] = useState("");
      const [supplier, setSuplier] = useState("");
      const [saleUnit, setSaleUnit] = useState("");
      const [purchase, setPurchaseUnit] = useState("");
      const [status, setStatus] = useState("");
      const [quantityLimit, setQL] = useState("");
      const [variation, setVariation] = useState("");
      const [variationType, setVariationTypes] = useState([]);
      const [variationValues, setVariationValues] = useState({});
      const [formattedWarehouses, setFormattedWarehouses] = useState({});
      const [ptype, setType] = useState("");
      const [note, setNote] = useState("");
      const [image, setImage] = useState([]);
      const navigate = useNavigate()
      const inputRef = useRef(null);
      const [variationData, setVariationData] = useState([]);
      const [selectedWarehouse, setSelectedWarehouse] = useState([]);
        const [warehouseValues, setWarehouseValues] = useState({});
        const [showSections, setShowSections] = useState({});
          const [selectedVariationTypes, setSelectedVariationTypes] = useState([]);
            const [warehouseVariationValues, setWarehouseVariationValues] = useState([]);
            const [WherehouseData, setWherehouseData] = useState([]);
          


    useEffect(() => {
        const fetchAllWarehouses = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`);
                setWarehouseData(response.data.warehouses || []);
            } catch (error) {
                console.error('Failed to fetch all warehouses:', error);
            }
        };

        fetchAllWarehouses();
    }, []);

    useEffect(() => {
        // Set the default value to today's date in 'YYYY-MM-DD' format
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setDate(formattedDate);
    }, []);


    const calculateTotal = () => {
        // Calculate the product total with each product's tax included
        const productTotal = selectedProduct.reduce((total, product) => {
            // Get price and quantity
            const productPrice = Number(getPriceRange(product, product.selectedVariation));
            const productQty = product.barcodeQty || 1; // Default to 1 if barcodeQty is not set

            // Determine the tax rate for each product (or variation)
            const taxRate = product.oderTax
                ? product.oderTax / 100
                : getTax(product, product.selectedVariation) / 100; // Use variation tax if available

            // Calculate subtotal for this product (including tax)
            const subTotal = (productPrice * productQty) + (productPrice * productQty * taxRate);

            // Accumulate the subtotal for the product
            return total + subTotal;
        }, 0);


        // Calculate discount based on the type (fixed or percentage)
        let discountValue = 0;
        if (discountType === 'fixed') {
            discountValue = Number(discount);
        } else if (discountType === 'percentage') {
            discountValue = (productTotal * Number(discount)) / 100;
        }

        // Shipping cost remains the same
        const shippingValue = Number(shipping);
        const globalTaxRate = Number(tax) / 100; // Convert to decimal
        const globalTax = productTotal * globalTaxRate; // Tax on total product amount
        const grandTotal = productTotal - discountValue + shippingValue + globalTax;
        return grandTotal;
    };

    const handleDiscountType = (e) => {
        setDiscountType(e.target.value)
    }
    const handleDiscount = (e) => {
        if (!discountType) {
            alert('Please select a discount type first.');
            return;
        }
        const value = e.target.value;
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }
        setDiscount(value);
    };
    useEffect(() => {
        if (discountType === 'fixed') {
            return setDiscountSymbole(currency);
        }
        if (discountType === 'percentage') {
            return setDiscountSymbole('%');
        }
    }, [discountType]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setResponseMessage("");
        setProgress(true);
    
        try {
          // Ensure warehouseValues is an object
          const formData = new FormData();
          formData.append("name", name);
          if (image) {
            formData.append("image", image);
          }
          //formData.append("code", code);
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
    
          // Debugging: Log form data
          for (const [key, value] of formData.entries()) {
            try {
              const parsedValue = JSON.parse(value);
              console.log(`${key}:`, parsedValue);
            } catch (error) {
              console.log(`${key}:`, value);
            }
          }
    
          const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createProduct`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
    
          toast.success("Product created successfully!", { autoClose: 2000 });
          setTimeout(() => {
            navigate('/createQuotation');
            setIsPopupOpen(!isPopupOpen);
        }, 1000);
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
    

    const handleTax = (e) => {
        setTax(e.target.value)
    }
    const handleShippng = (e) => {
        setShipping(e.target.value)
    }

    const togglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    }
    const handleClose = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    // product creation inside create-purchase

const handleImageChange = async (e, setError) => {
    const file = e.target.files[0];

    if (file.type !== "image/jpeg" || !file.name.toLowerCase().endsWith(".jpg")) {
      setError("Only JPG files are allowed. Please upload a valid JPG file.");
      alert("Only JPG files are allowed. Please upload a valid JPG file.");
      inputRef.current.value = ""; // Clear the input field
      return;
    }

    // Check file size (max 4MB)
    const maxFileSizeMB = 4;
    if (file.size / 1024 / 1024 > maxFileSizeMB) {
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
      // Ensure image is approximately square (1:1 ratio within a 100px tolerance)
      const image = await imageCompression.getDataUrlFromFile(file);
      const img = new Image();
      img.src = image;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const tolerance = 100; // Allow 100px variance

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

  const searchCategory = async (query) => {
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
        console.error('Find base unit error:', error);
        setCategoryData([]);
        setError('No categories found for the given name.');
      } finally {
        setProgress(false);
      }
    };

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
            searchCategory(value);
          }
        }, 100);
      };

      const handleKeyDown = (e) => {
        const value = e.target.value;
        if (e.key === "Backspace" && value === '') {
          searchCategory([]);
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

  const handleAddWarehouse = (e) => {
    const selectedOption = e.target.value;
    if (selectedOption && !selectedWarehouse.includes(selectedOption)) {
      setSelectedWarehouse([...selectedWarehouse, selectedOption]);
      setShowSections({
        ...showSections,
        [selectedOption]: true,
      });
      setWarehouseValues((prevValues) => ({
        ...prevValues,
        [selectedOption]: {},
      }));
    }
    e.target.value = "";
  };

  const handleRemoveWarehouse = (typeToRemove) => {
    setSelectedWarehouse(
      selectedWarehouse.filter((type) => type !== typeToRemove)
    );
    setShowSections({
      ...showSections,
      [typeToRemove]: false,
    });
  };

  //Handle variaion input changing
  const handleWarehouseValueChange = (type, field, value) => {
    setWarehouseValues((prevValues) => ({
      ...prevValues,
      [type]: {
        ...prevValues[type],
        [field]: value,
      },
    }));
  };

  //Save button enabile and disable checking
  // const isFormValid =
  //   name &&
  //   warehouse &&
  //   brand &&
  //   category &&
  //   supplier &&
  //   ptype &&
  //   unit &&
  //   saleUnit &&
  //   purchase &&
  //   status &&
  //   barcode &&
  //   quantityLimit;

    const handleVariationValueChange = (type, field, value) => {
        setVariationValues((prevValues) => ({
          ...prevValues,
          [type]: {
            ...prevValues[type],
            [field]: value,
          },
        }));
      };
    
      const handleAddVariationType = (e) => {
        const selectedOption = e.target.value;
    
        if (!selectedWarehouse || selectedWarehouse.length === 0) {
          console.log("Please select a warehouse first.");
          return;
        }
    
        if (selectedOption) {
          setSelectedVariationTypes((prevTypes) => [...prevTypes, selectedOption]);
          setShowSections((prevSections) => ({
            ...prevSections,
            [selectedOption]: true,
          }));
    
          setWarehouseVariationValues((prevValues) => {
            // Create a copy of the previous state
            const newValues = { ...prevValues };
    
            // Ensure only the selected warehouse(s) are updated
            selectedWarehouse.forEach((warehouse) => {
              if (!newValues[warehouse]) {
                newValues[warehouse] = {}; // Initialize warehouse if missing
              }
    
              if (!newValues[warehouse][selectedOption]) {
                newValues[warehouse][selectedOption] = {}; // Add only for selected warehouse
              }
            });
    
            return newValues;
          });
        } else {
          console.log("Variation type is already selected.");
        }
    
        e.target.value = "";
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

  const handleInputChange = (type, value) => {
    setVariationValues((prev) => ({ ...prev, [type]: value }));
  };

  // Handle clear operation
  const handleClear = () => {
    setProductName("");
    setBrands("");
    setCategory("");
    setNote("");
    setSaleUnit("");
    setPurchaseUnit("");
    setQL("");
    setType("");
    setStatus("");
    setSuplier("");
    setWarehouse([]);
    setVariation("");
    setBarcode("");
    setError("");
    setResponseMessage("");
    setVariationValues({});
    setSelectedVariationTypes([]);
    setShowSections({});
    setImage([]);
    inputRef.current.value = "";
  };

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
      `${process.env.REACT_APP_BASE_URL}/api/fetchSupplier`, setSuplierData, (data) => data.suppliers || []
    );
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, setWherehouseData, (data) => data.warehouses || []
    );
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/findBrand`, setBrandData, (data) => data.brands || []
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

  useEffect(() => {
      const formatted = Object.entries(warehouseValues).reduce(
        (acc, [warehouseName, wherehouseData]) => {
          const variations = Object.entries(variationValues).reduce(
            (varAcc, [variationName, variationData]) => {
              varAcc[variationName] = variationData;
              return varAcc;
            },
            {}
          );
          acc[warehouseName] = { ...wherehouseData, ...variations };
          return acc;
        },
        {}
      );
      setFormattedWarehouses(formatted);
    }, [warehouseValues, variationValues]);
  
    //Handle submit for save product
    const handleCreateProduct = async (event) => {
      event.preventDefault();
      setError("");
      setResponseMessage("");
      setProgress(true);
  
      try {
        // Ensure warehouseValues is an object
        const formData = new FormData();
        formData.append("name", name);
        if (image) {
          formData.append("image", image);
        }
        //formData.append("code", code);
        formData.append("brand", brand);
        formData.append("code", code);
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
  
        // Debugging: Log form data
        for (const [key, value] of formData.entries()) {
          try {
            const parsedValue = JSON.parse(value);
            console.log(`${key}:`, parsedValue);
          } catch (error) {
            console.log(`${key}:`, value);
          }
        }
  
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createProduct`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
  
        toast.success("Product created successfully!", { autoClose: 2000 });
        setTimeout(() => {
          window.location.href = '/createPurchase';
      }, 1000);
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

     // Handle variation change
 const handleVariationChangeProduct = (e) => {
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

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex mt-20 justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300  m-0 p-0 text-2xl">Create Purchase</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewPurchase'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] min-h-[100vh] w-full rounded-2xl px-8 shadow-md pb-10">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1"> {/* Use flex-1 to allow the field to take full width */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    required
                                    value={warehouse}
                                    disabled={selectedProduct.length > 0}
                                    onChange={(e) => handleWarehouseChangeProduct(e, setWarehouse, fetchProductDataByWarehouse, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select a warehouse</option>
                                    {warehouseData.map((wh) => (
                                        <option key={wh.name} value={wh.name}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* suplier */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Supplier <span className='text-red-500'>*</span></label>
                                <input
                                    id="supplier"
                                    name="supplier"
                                    value={searchSuplier}
                                    required
                                    onChange={(e) => handleSuplierSearch(e, setSearchSuplier, setFilteredSuplier)}
                                    placeholder="Search Supplier..."
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                                />
                                {/* Dropdown for filtered suppliers */}
                                {filteredSuplier.length > 0 && (
                                    <ul className="absolute z-10 mt-1 w-[344px] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredSuplier.map((suplier) => (
                                            <li
                                                key={suplier._id}
                                                onClick={() => handleSuplierSelect(suplier, setSelectedSuplier, setSearchSuplier, setFilteredSuplier)}
                                                className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                                            >
                                                {suplier.name} {/* Display the supplier name */}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            {/*Supplier Invoice Number*/}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Supplier Invoice No </label>
                                <input
                                    id="invoiceNumber"
                                    name="invoiceNumber"
                                    type="invoiceNumber"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoice(e.target.value)}
                                    placeholder="Enter purchase number..."
                                    className="w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                                />
                            </div>

                            {/*Date*/}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>
                    <div className="flex-1 mt-5 relative">
  
        <label className="block text-sm font-medium leading-6 text-gray-900 text-left mr-2">Search Products</label>
        <div className="flex items-center w-full">
        {/* Input Field */}
        <input
            id="text"
            name="text"
            type="text"
            required
            disabled={!warehouse}
            value={searchTerm}
            onChange={(e) => handleProductSearch(e, setSearchTerm, setFilteredProducts, warehouse)}
            placeholder={searchTerm ? "" : "        Search..."}
            className="block w-[95%] rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
        />

        {/* Product Create Shortcut Icon */}

        <button
    type="button"
    onClick={togglePopup} // Navigate to the create product page
    className="ml-3 px-3 py-2 bg-gray-200 hover:bg-gray-100 rounded-md border-0"
    aria-label="Add Product"
>
    <FaPlus className="text-gray-900" size={18} /> {/* Plus Icon */}
</button>
    </div>

    {/* Dropdown for filtered products */}
    {filteredProducts.length > 0 && (
        <ul className="absolute left-0 z-10 w-[90%] bg-white border border-gray-300 rounded-md shadow-lg mt-1">
            {filteredProducts.map((product) => (
                <li
                    key={product._id}
                    onClick={() => handleProductSelect(product, setSelectedProduct, setSearchTerm, setFilteredProducts)}
                    className="cursor-pointer hover:bg-gray-100 text-left px-4 py-2"
                >
                    {product.name}
                </li>
            ))}
        </ul>
    )}
      {!warehouse && (
                            <p className="text-red-500 text-sm mt-1 text-left">Please select a warehouse to search products.</p>
                        )}
</div>


                    <div className="overflow-x-auto">
                        {selectedProduct.length > 0 && (
                            <table className="mt-10 min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProduct.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm "><p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.productQty || getQty(product, product.selectedVariation)}</p></td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, -1)} // Decrement
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='increase' />
                                                    </button>
                                                    {/* Input Field for Quantity */}
                                                    <input
                                                        type="number"
                                                        value={
                                                            product.ptype === "Variation"
                                                                ? product.variationValues[product.selectedVariation]?.barcodeQty || 1
                                                                : product.barcodeQty || 1
                                                        }
                                                        onChange={(e) =>
                                                            handleQtyChange(index, product.selectedVariation, setSelectedProduct, parseInt(e.target.value, 10), true)
                                                        }
                                                        className="mx-2 w-16 py-[6px] text-center border rounded outline-none focus:ring-1 focus:ring-blue-100"
                                                        min="1"
                                                    />
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, 1)} // Increment            
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='decrease' />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {' '}{getPriceRange(product, product.selectedVariation)}
                                            </td>

                                            {/* Display Product Tax */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.oderTax
                                                    ? `${product.oderTax}%`
                                                    : `${getTax(product, product.selectedVariation)}%`}
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {' '} {
                                                    (() => {
                                                        const price = getPriceRange(product, product.selectedVariation);
                                                        const quantity = product.variationValues?.[product.selectedVariation]?.barcodeQty || product.barcodeQty || 1;
                                                        const taxRate = product.oderTax
                                                            ? product.oderTax / 100
                                                            : getTax(product, product.selectedVariation) / 100;

                                                        const subtotal = (price * quantity) + (price * quantity * taxRate);
                                                        return formatWithCustomCommas(subtotal);
                                                    })()
                                                }
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.ptype === 'Variation' && product.variationValues ? (
                                                    <select
                                                        value={product.selectedVariation}
                                                        onChange={(e) => handleVariationChange(index, e.target.value, setSelectedProduct)}
                                                        className="block w-full border py-2 border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                                    >
                                                        {Object.keys(product.variationValues).map((variationKey) => (
                                                            <option key={variationKey} value={variationKey}>
                                                                {variationKey}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span>No Variations</span>
                                                )}
                                            </td>


                                            {/* Delete Action */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleDelete(index, selectedProduct, setSelectedProduct)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="">
                        {/* DISCOUNT, SHIPPING AND TAX INPUT */}
                        <div className="grid grid-cols-4 gap-4 mb-4 mt-60">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Type:</label>
                                <select
                                    onChange={handleDiscountType}
                                    value={discountType}
                                    required
                                    className="block w-full rounded-md text-left border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option value=''>Discount type</option>
                                    <option value='fixed'>Fixed</option>
                                    <option value='percentage'>Percentage</option>
                                </select>
                            </div>
                            <div className='relative'>
                                <label className="block text-left text-sm font-medium text-gray-700">Discount:</label>
                                <input
                                    onChange={handleDiscount}
                                    value={discount}
                                    type="text"
                                    required
                                    placeholder="Discount"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {discountSymbole}
                                </span>
                            </div>
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">Tax:</label>
                                <input
                                    onChange={handleTax}
                                    value={tax}
                                    required
                                    type="text"
                                    placeholder="Tax"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    %
                                </span>
                            </div>
                            <div className='relative'>
                                <label className="block text-left text-sm font-medium text-gray-700">Shipping:</label>
                                <input
                                    onChange={handleShippng}
                                    value={shipping}
                                    type="text"
                                    required
                                    placeholder="Shipping"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-end mb-2 pr-3 text-gray-500">
                                    {currency}
                                </span>
                            </div>
                        </div>

                        {/* Order, Payment Status, and Payment Type Selects */}
                        <div className="grid grid-cols-3 gap-4 mt-10">
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700">Order Type: <span className='text-red-500'>*</span></label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    required
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Order Status</option>
                                    <option value="pending">Received</option>
                                    <option value="ordered">Ordered</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            {/* Payment Status Select */}
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700">Payment Status: <span className='text-red-500'>*</span></label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    required
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Payment Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>

                            {/* Payment Type Select */}
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700">Payment Type: <span className='text-red-500'>*</span></label>
                                <select
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                    required
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select Payment Type</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="check">Check</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Total: {currency} {formatWithCustomCommas(calculateTotal())}
                    </div>
                    <button onClick={() => handleSave(
                        calculateTotal().toFixed(2), orderStatus, paymentStatus, paymentType, shipping, discountType, discount, tax, warehouse, selectedSuplier, selectedProduct, invoiceNumber, date, setError, setResponseMessage, setProgress, navigate)} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
                        Save Purchase
                    </button>

                    {/* Error and Response Messages */}
                    <div className="mt-20">
                        <div className="relative">
                            {/* Reserve space for messages */}
                            <div className="absolute top-0 left-0 w-full">
                                {error && (
                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 text-center mx-auto max-w-sm">
                                        {error}
                                    </p>
                                )}
                                {responseMessage && (
                                    <p className="text-color px-5 py-2 rounded-md bg-green-100 text-center mx-auto max-w-sm">
                                        {responseMessage}
                                    </p>
                                )}
                            </div>
                            {/* Reserve empty space to maintain layout */}
                            <div className="h-[50px]"></div>
                        </div>
                    </div>
                </div>

                {isPopupOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white w-[1200px] max-h-[80vh] overflow-y-auto h-[62cdb0px] overflow-auto p-8 pt-4 rounded-md shadow-lg mt-28 mb-10" data-aos="fade-down">
            <form onSubmit={handleCreateProduct}>
                {/* Your form fields */}
           
                <div className="flex justify-between items-center w-full mb-4 mt-4">
  <h2 className="text-gray-700 text-2xl font-semibold">Create Product</h2>
  <button
    type="button"
    onClick={handleClose}
    className="text-gray-500 hover:text-red-500 transition duration-200"
  >
    <FaTimes size={24} />
  </button>
</div>

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
                        onChange={(e) => setProductName(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Code – INSERTED FIELD */}
                <div className="flex-1 w-full">
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
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter code"
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
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
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Category <span className='text-red-500'>*</span>
                    </label>

                    <div className="relative w-full mt-2">
                      <form
                        className="flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          searchCategory(category);
                        }}
                      >
                        <input
                          onChange={handleCategoryInput}
                          onKeyDown={handleKeyDown}
                          id="category"
                          name="category"
                          type="text"
                          placeholder="Search by category name..."
                          className="searchBox w-full pl-10 pr-4 py-[7.5px] border border-gray-300 rounded-md shadow-sm focus:border-transparent"
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
                      </form>{categoryData.length > 0 && (
                        <div className="absolute w-full mt-2 z-10 shadow-md">
                          <ul className="searchBox w-full text-left shadow-sm focus:border-transparent bg-white rounded-md max-h-60 overflow-y-auto">
                            {categoryData.map((ct, index) => (
                              <li
                                key={index}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  setCategory(ct.category);
                                  setCategoryData([]); // Clear categoryData to close the selection tab
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

                {/* Brand */}
                <div className="flex-1 w-full mb-4 lg:mb-0">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Brand <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="brand"
                        name="brand"
                        required
                        value={brand}
                        onChange={(e) => setBrands(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a brand</option>
                        {Array.isArray(brandData) &&
                          brandData.map((br) => (
                            <option key={br.brandName} value={br.brandName}>
                              {br.brandName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="flex-1 w-full">
                  <div className="mt-5">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Supplier <span className='text-red-500'>*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="supplier"
                        name="supplier"
                        required
                        value={supplier}
                        onChange={(e) => setSuplier(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select a supplier</option>
                        {suplierData.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
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
                        onChange={(e) => setType(e.target.value)}
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
                        onChange={handleVariationChangeProduct}
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
                      className="ml-2 text-red-500"
                      onClick={() => handleRemoveWarehouse(type)}
                    >
                      &#x2715;
                    </button>
                  </div>
                ))}
            </div>

            {/**VARIATION MANAGE SECTION========================================================================================================== */}

            <hr className="mt-16" />


            {/*CREATE VARIATION PROPERTIES============================================================================================================================*/}
            {/**This is the variation property manage section one by one */}
            {selectedWarehouse.map((type, index) => (
              <div className="border-2 boder-200- mt-20 rounded-lg p-5 text-gray-700 text-left bold" key={index}>
                <button
                  className="mr-4 text-gray-500 size-4 text-xl stroke-8"
                  onClick={() => handleRemoveWarehouse(type)}
                >
                  &#x2715;
                </button>

                Product Details For {type}

                {/* Multi-select variation types with chips */}
                {variation && ptype !== "Single" && (
                  <div className="mt-8">
                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                      Select Variation Types <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        onChange={handleAddVariationType}
                        className="block w-[31%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                      >
                        <option value="">Select Types</option>
                        {variationType.map((type, index) => (
                          <option key={index} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Display selected types as chips */}
                <div className="flex flex-wrap mt-3 gap-2">
                  {ptype === "Variation" &&
                    selectedVariationTypes.map((type, index) => (
                      <div
                        key={index}
                        className="flex items-center px-3 py-1 bg-gray-200 rounded-full text-sm"
                      >
                        {type}
                        <button
                          className="ml-2 text-red-500"
                          onClick={() => handleRemoveVariationType(type)}
                        >
                          &#x2715;
                        </button>
                      </div>
                    ))}
                </div>
                {ptype === "Variation" &&
                  selectedVariationTypes.map(
                    (type) =>
                      showSections[type] && (
                        <div className="mt-12 variationPropertyManaging" key={type}>
                          <h3 className="text-md mb-4 mt-5 text-gray-700">
                            {type} Properties
                          </h3>
                          <div className="p-[15px] rounded-md">
                            <div className="flex space-x-4 mb-5">
                              <div className="flex-1">
                                <div>
                                  <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                    Variation Type <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    value={type}
                                    type="text"
                                    placeholder={`${type} Type`}
                                    onChange={(e) =>
                                      handleInputChange(type, e.target.value)
                                    }
                                    className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm sm:leading-6"
                                  />
                                </div>
                                <label className="block mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                                  Stock Alert <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  placeholder="Stock Alert"
                                  onChange={(e) =>
                                    handleVariationValueChange(
                                      type,
                                      "stockAlert",
                                      e.target.value
                                    )
                                  }
                                  className="block  w-[90%]  rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                                
                              </div>

                              <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                  Product Cost <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="Product Cost"
                                    onChange={(e) =>
                                      handleVariationValueChange(
                                        type,
                                        "productCost",
                                        e.target.value
                                      )
                                    }
                                    className="block w-[90%]  rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm sm:leading-6"
                                  />
                                  <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px] inset-y-0 right-0 pr-3 flex items-center px-2 ">
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
                                    onChange={(e) =>
                                      handleVariationValueChange(
                                        type,
                                        "orderTax",
                                        e.target.value
                                      )
                                    }
                                    className="block w-[90%]  rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                  />
                                  <span className="absolute mr-[10.6%] w-[47px] pl-4 text-center rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px] inset-y-0 right-0 pr-3 flex items-center px-2 ">
                                    %
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1">
                              <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                  Product Price <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="Product Price"
                                    onChange={(e) =>
                                      handleVariationValueChange(
                                        type,
                                        "productPrice",
                                        e.target.value
                                      )
                                    }
                                    className="block w-[90%]  rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                  />
                                  <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px]  inset-y-0 right-0 pr-3 flex items-center px-2 ">
                                    {currency}
                                  </span>
                                </div>
                                <label className="block  mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                                  Tax Type
                                </label>
                                <select
                                  type="text"
                                  placeholder="Tax Type"
                                  onChange={(e) =>
                                    handleVariationValueChange(
                                      type,
                                      "taxType",
                                      e.target.value
                                    )
                                  }
                                  className="block  w-[90%]  rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                  <option>Exclusive</option>
                                  <option>Inclusive</option>
                                </select>
                              </div>

                              <div className="flex-1">
                                

                                <label className="block  text-sm font-medium leading-6 text-gray-900 text-left">
                                  Product Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  placeholder="Add Product Quantity"
                                  onChange={(e) =>
                                    handleVariationValueChange(
                                      type,
                                      "productQty",
                                      e.target.value
                                    )
                                  }
                                  className="block w-[90%]  rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                                <label className="block mt-5 text-sm font-medium leading-6 text-gray-900 text-left">
                                  Discount
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="Discount"
                                    onChange={(e) =>
                                      handleVariationValueChange(type, "discount", e.target.value)
                                    }
                                    className="block w-[90%]  rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                  />
                                  <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px] inset-y-0 right-0 pr-3 flex items-center px-2 ">
                                    {currency}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-400 text-left">
                              Ensure to Number input fields keep with valid number
                            </p>
                          </div>
                        </div>
                      )
                  )}

                {/**SINGLE PRODUCT VARIATION PROPERTIES */}
                {ptype === "Single" && (
                  <div className="mt-10 variationPropertyManaging">
                    <h3 className="text-md mb-4 text-gray-700">
                      Single Product Properties
                    </h3>
                    <div className="p-6  rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col space-y-5">
                          <div>
                            <label className="block text-left text-sm font-medium leading-6 text-gray-900">
                              Stock Alert <span className='text-red-500'>*</span>
                            </label>
                            <input
                              type="number"
                              placeholder="Stock Alert"
                              onChange={(e) => handleWarehouseValueChange(type, "stockAlert", e.target.value)}
                              className="block w-[90%]  rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="block text-sm text-left font-medium leading-6 text-gray-900">
                              Order Tax
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="Order Tax"
                                onChange={(e) => handleWarehouseValueChange(type, "orderTax", e.target.value)}
                                className="block w-[90%] rounded-md border-0 py-2.5 px-3 pr-10 mt-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                              />
                              <span className="absolute mr-[10.6%] w-[47px] pl-4 text-center rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px] inset-y-0 right-0 pr-3 flex items-center px-2 ">
                                %
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                              Discount
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="Discount"
                                onChange={(e) =>
                                  handleWarehouseValueChange(type, "discount", e.target.value)
                                }
                                className="block w-[90%]  rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                              />
                              <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px] inset-y-0 right-0 pr-3 flex items-center px-2 ">
                                {currency}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-5">
                          <div>
                            <label className="block text-sm text-left font-medium leading-6 text-gray-900">
                              Product Cost <span className='text-red-500'>*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="Product Cost"
                                onChange={(e) => handleWarehouseValueChange(type, "productCost", e.target.value)}
                                className="block w-[90%]  rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                              />
                              <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px]  inset-y-0 right-0 pr-2 flex items-center px-2 ">
                                {currency}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-left font-medium leading-6 text-gray-900">
                              Tax Type
                            </label>
                            <select
                              className="block w-[90%] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:outline-none sm:text-sm"
                              onChange={(e) => handleWarehouseValueChange(type, "taxType", e.target.value)}
                            >
                              <option>Select</option>
                              <option>Exclusive</option>
                              <option>Inclusive</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-5">
                          <div>
                            <label className="block text-sm text-left font-medium leading-6 text-gray-900">
                              Product Price <span className='text-red-500'>*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="Product Price"
                                onChange={(e) => handleWarehouseValueChange(type, "productPrice", e.target.value)}
                                className="block w-[90%]  rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                              />
                              <span className="absolute mr-[10.6%] rounded-r-[5px] bg-gray-100 text-gray-500 mt-[1px] mb-[1px]  inset-y-0 right-0 pr-2 flex items-center px-2 ">
                                {currency}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-left font-medium leading-6 text-gray-900">
                              Add Product Quantity <span className='text-red-500'>*</span>
                            </label>
                            <input
                              type="number"
                              placeholder="Add Product Quantity"
                              onChange={(e) => handleWarehouseValueChange(type, "productQty", e.target.value)}
                              className="block w-[90%]  rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400  focus:outline-none sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-gray-400 text-left">Ensure that number input fields contain only valid numbers.</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

             {/*SAVE AND CLEAR BUTTONS==============================================================================================================================*/}
             <div className="flex justify-start mt-10">
              <div className="mt-20">
                <button
                  type="submit"
                  // disabled={!isFormValid}
                  className="rounded-md px-4 py-3.5 h-[48px] text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[171px] text-center button-bg-color button-hover-color"
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
            </form>


            {/* Error and Response Messages */}
            <div className="mt-10">
                <div className="relative">
                    {/* Reserve space for messages */}
                    <div className="absolute top-0 left-0 w-full">
                        {error && (
                            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 text-center mx-auto max-w-sm">
                                {error}
                            </p>
                        )}
                        {responseMessage && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 text-center mx-auto max-w-sm">
                                {responseMessage}
                            </p>
                        )}
                    </div>
                    {/* Reserve empty space to maintain layout */}
                    <div className="h-[50px]"></div>
                </div>
            </div>
        </div>
    </div>
)}
            </div>
        </div>
    );
}
export default CreatePurchaseBody;
