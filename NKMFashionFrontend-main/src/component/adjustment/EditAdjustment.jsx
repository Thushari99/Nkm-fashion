import React, { useState, useEffect } from "react";
import axios from "axios";
import { handleProductSearch, handleWarehouseChange } from "../sales/SaleController";
import { handleUpdateAdjustment } from "./AdjustmentController";
import "../../styles/role.css";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { fetchProductDataByWarehouse } from "../pos/utils/fetchByWarehose";
import Decrease from "../../img/down-arrow (1).png";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import formatWithCustomCommas from '../utill/NumberFormate';
import { useCurrency } from '../../context/CurrencyContext';

function EditAdjustmentBody() {
  const { currency } = useCurrency()
  const [warehouse, setWarehouse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
  const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
  const [productBillingHandling, setSearchedProductData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [saleProduct, setSaleProduct] = useState({});
  const [saleReturProductData, setSaleReturProductData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [progress, setProgress] = useState(false);
  const { id } = useParams();
  const [adjustmentTypes, setAdjustmentTypes] = useState('');
  const [total, setTotal] = useState(0); // State for storing total
  const navigate = useNavigate();

  // Fetch adjustment by ID
  useEffect(() => {
    const findSaleById = async () => {
      try {
        setProgress(true);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findAdjustmentById/${id}`);
        const fetchedProductsQty = response.data.productsData || [];
        const initializedProductsQty = fetchedProductsQty.map((pq) => ({
          ...pq,
          quantity: pq.quantity || Object.keys(pq.quantity)[0]
        }));
        setSaleReturProductData(initializedProductsQty);
        console.log(initializedProductsQty)
        setSaleProduct(response.data);
        setSelectedProduct(response.data.productsData || []); // Update selectedProduct state
      } catch (error) {
        console.error("Error fetching sale by ID:", error);
        const errorMessage = error.response?.data?.message || "An error occurred while fetching sale details.";
        alert(errorMessage);
      } finally {
        setProgress(false);
      }
    };

    if (id) {
      findSaleById();
    }
  }, [id]);

  const getTax = (product, selectedVariation) => {
    if (product.variationValues && selectedVariation && product.variationValues[selectedVariation]) {
      const variationTax = Number(product.variationValues[selectedVariation].orderTax);
      return !isNaN(variationTax) ? variationTax : 0;
    }
    return 0;
  };

  const getPriceRange = (product, selectedVariation) => {
    if (product.ptype === 'Variation' && product.variationValues) {
      if (selectedVariation && product.variationValues[selectedVariation]) {
        const variationPrice = Number(product.variationValues[selectedVariation].productPrice);
        return !isNaN(variationPrice) ? variationPrice : 'Price not available';
      }

      const prices = Object.values(product.variationValues)
        .map(variation => Number(variation.productPrice))
        .filter(price => !isNaN(price));

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return minPrice;
      }
    }

    const singlePrice = Number(product.productPrice);
    return !isNaN(singlePrice) && singlePrice > 0 ? singlePrice : 'Price not available';
  };

  const getQty = (product, selectedVariation) => {
    // If the product has variations
    if (product.variationValues && selectedVariation) {
      const variationQty = Number(product.variationValues[selectedVariation]?.productQty);
      console.log("qty check ", variationQty)
      return !isNaN(variationQty) && variationQty > 0 ? variationQty : 0;
    }
    const singleProductQty = Number(product.productQty);
    console.log("qty check ", singleProductQty)
    return !isNaN(singleProductQty) && singleProductQty > 0 ? singleProductQty : 0;
  };


  const handleProductSelect = (product) => {
    setSaleReturProductData((prevProducts) => {
      const isVariationProduct = product.ptype === 'Variation' && product.variationValues;
      const isSingleProduct = product.ptype === 'Single';
      const variationKeys = isVariationProduct ? Object.keys(product.variationValues) : [];
      const selectedVariation = isVariationProduct ? variationKeys[0] : null;

      // Check if the product already exists in the state
      const isDuplicate = prevProducts.some((p) => {
        if (isVariationProduct) {
          // Check for duplicate variation products
          return (
            p.name === product.name && // Match by _id for variation products
            p.ptype === 'Variation' && // Ensure the product type is 'Variation'
            p.selectedVariation === selectedVariation // Match the selected variation
          );
        } else if (isSingleProduct) {
          // Check for duplicate single products by name and product type
          return p.name === product.name && p.ptype === 'Single';
        }
        return false; // Default to no duplicates for unsupported types
      });

      if (isDuplicate) {
        const type = isVariationProduct
          ? `Variation (${selectedVariation})`
          : `Product (${product.name})`;
        alert(`${type} is already in the list.`);
        return prevProducts; // No changes to the list
      }

      let initialQuantity = 1; // Default quantity for selected product
      let stockQty = product.productQty || 0;

      // Create a new product object with defaults for variations or single products
      const newProduct = {
        ...product,
        selectedVariation: isVariationProduct ? selectedVariation : 'No variations', // Set default variation for single products
        barcodeFormat: product.barcode || '',
        quantity: 1,
        productPrice: getPriceRange(product, selectedVariation) || product.productPrice || 0,
        oderTax: getTax(product, selectedVariation)/100 ? getTax(product, selectedVariation)/100 :  product.oderTax/100 ? product.oderTax/100  :  0,
        source: 'frontend', // Mark as a new product
      };
      console.log( newProduct)

      // Append the new product to the previous list
      return [...prevProducts, newProduct];
    });

    // Clear search state
    setSearchTerm('');
    setFilteredProducts([]);
  };


  // Calculate total
  useEffect(() => {
    const newTotal = calculateTotal();
    setTotal(newTotal);
  }, [saleReturProductData]);

  // Calculate total price
  const calculateTotal = () => {
    try {
      const productTotal = saleReturProductData.reduce((total, product) => {
        const productPrice = parseFloat(product.productPrice) || 0;
        const productQty = parseInt(product.quantity) || 1;
        const taxRate = parseFloat(product.oderTax ? product.oderTax : product.taxRate ? product.taxRate : 0);
        const subTotal = (productPrice * productQty) + (productPrice * productQty * (taxRate));
        return total + subTotal;
      }, 0);

      // Return rounded total (to 2 decimal places)
      return productTotal.toFixed(2);
    } catch (error) {
      console.error("Error calculating total:", error);
      alert("An error occurred while calculating the total.");
      return 0;
    }
  };

  // Handle date formatting on component mount
  useEffect(() => {
    try {
      if (saleProduct.date) {
        const formattedDate = new Date(saleProduct.date).toISOString().slice(0, 10);
        setSelectedDate(formattedDate);
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      alert("An error occurred while processing the date.");
    }
  }, [saleProduct.date]);

  // Handle adjustment type
  useEffect(() => {
    try {
      saleReturProductData.forEach((product) => {
        if (product.AdjustmentType) {
          setAdjustmentTypes(product.AdjustmentType);
        }
      });
    } catch (error) {
      console.error("Error setting adjustment types:", error);
      alert("An error occurred while processing adjustment types.");
    }
  }, [saleReturProductData]);

  const handleTypeChange = (index, value) => {
    setSaleReturProductData((prevData) =>
      prevData.map((item, i) =>
        i === index
          ? { ...item, AdjustmentType: value } 
          : item
      )
    );
  };

  const handleVariationChange = (index, variation) => {
    setSaleReturProductData((prevProducts) =>
      prevProducts.map((product, i) => {
        if (i === index) {
          const productWithSameVariation = prevProducts.find(
            (p, j) => j !== index && p._id === product._id && p.selectedVariation === variation
          );

          if (productWithSameVariation) {
            alert(`The variation "${variation}" is already added.`);
            return product;
          }
          const selectedVariationDetails = product.variationValues[variation] || {};
          const updatedPrice = selectedVariationDetails.productPrice || product.productPrice;
          const updatedTax = selectedVariationDetails.orderTax || product.oderTax;
          const updatedQty = selectedVariationDetails.productQty || 1;
          const adjustedQty = Math.min(product.quantity || 1, updatedQty);

          if (adjustedQty < product.quantity) {
            alert(`Purchase quantity adjusted to the available stock (${updatedQty}) for the "${variation}" variation.`);
          }

          return {
            ...product,
            selectedVariation: variation,
            productPrice: updatedPrice,
            oderTax: updatedTax,
            productQty: updatedQty,
            quantity: adjustedQty > 0 ? adjustedQty : 1, 
          };
        }
        return product;
      })
    );
  };

  const handleQtyChange = (index, delta) => {
    setSaleReturProductData((prev) => {
      return prev.map((item, i) => {
        if (i !== index) return item; // Only update the product at the given index

        // Determine stock quantity
        let stockQty = item.productQty || 0; // Default stock for normal products
        if (item.ptype === "Variation" && item.selectedVariation) {
          const selectedVariation = item.variationValues?.[item.selectedVariation];
          if (selectedVariation) {
            stockQty = selectedVariation.productQty || 0; // Stock for selected variation
          }
        }

        // Calculate new quantity
        const newQty = Math.max(1, Math.min((item.quantity || 1) + delta,)); // Ensure within valid bounds

        // Calculate subtotal
        const productPrice = item.productPrice || 0;
        const productTaxRate = item.oderTax || 0; // Product-specific tax rate
        const newSubtotal = (productPrice * newQty) + (productPrice * newQty * (productTaxRate / 100));

        // Return updated product
        return {
          ...item,
          quantity: newQty,
          subtotal: newSubtotal.toFixed(2), // Update subtotal
        };
      });
    });
  };

  const handleDeleteProduct = (index) => {
    setSaleReturProductData(prevData => {
      const updatedData = prevData.filter((_, i) => i !== index);
      return updatedData;
    });
  };

  useEffect(() => {
    // Get the current date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Set the current date as the selected date
    setSelectedDate(formattedDate);
  }, []);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  return (
    <div className="background-white relative left-[18%] w-[82%] min-h-[100vh] p-5">
      {progress && (
        <Box
          sx={{ width: "100%", position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
          <LinearProgress />
        </Box>
      )}
      <div className="flex mt-20 justify-between items-center">
        <div>
          <h2 className="text-lightgray-300 m-0 p-0 text-2xl">
            Edit Adjustment
          </h2>
        </div>
        <div>
          <Link
            className="px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white"
            to={"/viewAdjustment"}
          >
            Back
          </Link>
        </div>
      </div>

      <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-14">
        <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
          <form>
            <div className="flex w-full space-x-5">
              {" "}
              <div className="flex-1">
                {" "}
                {/* Use flex-1 to allow the field to take full width */}
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Select warehouse <span className='text-red-500'>*</span>
                </label>
                <select
                  id="warehouse"
                  name="warehouse"
                  value={saleProduct.warehouse}
                  disabled={selectedProduct.length > 0}
                  onChange={(e) =>
                    handleWarehouseChange(
                      e,
                      setWarehouse,
                      fetchProductDataByWarehouse,
                      setProductData,
                      setSelectedCategoryProducts,
                      setSelectedBrandProducts,
                      setSearchedProductData,
                      setLoading
                    )
                  }
                  className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                >
                  <option value="">{saleProduct.warehouse}</option>
                </select>
                {error.username && (
                  <p className="text-red-500">{error.username}</p>
                )}
              </div>
              {/* Date */}
              <div className="flex-1">
                {" "}
                {/* Use flex-1 here as well */}
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Date <span className='text-red-500'>*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  disabled
                  value={selectedDate}
                  onChange={handleDateChange}
                  autoComplete="given-name"
                  className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </form>

          <div className="flex-1 mt-5 relative">
            {/* Input Field */}
            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
              Product :{" "} <span className='text-red-500'>*</span>
            </label>
            <input
              id="text"
              name="text"
              type="text"
              required
              value={searchTerm}
              onChange={(e) =>
                handleProductSearch(
                  e,
                  setSearchTerm,
                  setFilteredProducts,
                  saleProduct.warehouse
                )
              }
              placeholder={searchTerm ? "" : "        Search..."}
              className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
            />
            {filteredProducts.length > 0 && (
              <ul className="absolute left-0 z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                {filteredProducts.map((product) => (
                  <li
                    key={product._id}
                    onClick={() =>
                      handleProductSelect(
                        product,
                        setSelectedProduct,
                        setSearchTerm,
                        setFilteredProducts,
                        setSaleReturProductData
                      )
                    }
                    className="cursor-pointer hover:bg-gray-100 text-left  px-4 py-2"
                  >
                    {product.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="mt-10 min-w-full bg-white border rounded-md border-gray-200">
              <thead className="rounded-md bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Adjusting Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Variation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              {saleReturProductData.length > 0 && (
                <tbody>
                  {saleReturProductData.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        {product.name}
                      </td>

                      <td className="px-6 py-4  text-left whitespace-nowrap text-sm ">
                        <p className="rounded-[5px] text-center p-[6px] bg-green-100 text-green-500">
                          {product.productQty || getQty(product, product.selectedVariation)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleQtyChange(index, -1)} // Decrement
                            className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <img className="w-[16px] h-[16px]" src={Decrease} alt="decrease" />
                          </button>
                          <span className="mx-2">
                            <span>{product.quantity}</span>
                          </span>
                          <button
                            onClick={() => handleQtyChange(index, 1)} // Increment
                            className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <img className="w-[16px] h-[16px] transform rotate-180" src={Decrease} alt="increase" />
                          </button>
                        </div>
                      </td>

                      {/* Product Price */}
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        {currency} {formatWithCustomCommas(product.price || getPriceRange(product, product.selectedVariation))}
                      </td>
                      
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        {product.variationValues && Object.keys(product.variationValues).length > 0 ? (
                          <select
                            value={product.selectedVariation}
                            onChange={(e) => handleVariationChange(index, e.target.value)}
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

                      {/* Product adjustment type */}
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={product.AdjustmentType} // Ensure this matches the key in your state
                          onChange={(e) => handleTypeChange(index, e.target.value)}
                          className="block w-full border py-2 border-gray-300 rounded-md shadow-sm focus:border-transparent"
                        >
                          <option value="addition">Addition</option>
                          <option value="subtraction">Subtraction</option>
                        </select>
                      </td>

                      {/* Delete Action */}
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeleteProduct(index)}
                          className="text-red-600 hover:text-red-900 p-2 rounded"
                        >
                          <i className="fas fa-trash mr-1"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          <div className="mt-4 text-right text-lg font-semibold">
            Total: {currency} {calculateTotal()}
          </div>
          <button
            onClick={() => {
              if (saleReturProductData.length === 0) {
                setError(
                  "Products list cannot be empty. Please add at least one product before updating."
                );
                return;
              }
              handleUpdateAdjustment(
                saleProduct._id,
                saleProduct.referenceId, // Corrected spelling
                calculateTotal(),
                saleProduct.warehouse,
                saleReturProductData,
                adjustmentTypes,
                selectedDate,
                setError,
                setResponseMessage,
                setProgress,
                navigate
              );
            }}
            className="mt-5 submit w-[200px] text-white rounded py-2 px-4"
          >
            Update & Save
          </button>
        </div>
        {/* Error and Response Messages */}
        <div className="mt-5">
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
  );
}

export default EditAdjustmentBody;
