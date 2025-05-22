import { toast } from 'react-toastify';
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import ReactToPrint from "react-to-print";
import Decrease from "../../../../src/img/down-arrow (1).png";

import { useCurrency } from "../../../context/CurrencyContext";
import formatWithCustomCommas from "../../utill/NumberFormate";
import JsBarcodeComponent from "./JsBarcode";
import "./barcodeStyles.css";

function CreateBarcodeBody() {
  const [warehouse, setWarehouse] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [generatedBarcodeValue, setGeneratedBarcodeValue] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stickerWidth, setStickerWidth] = useState(50);
  const [stickerHeight, setStickerHeight] = useState(25);
  const [barcodesPerRow, setBarcodesPerRow] = useState(2);
  const [pageSize, setPageSize] = useState("");
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const { currency } = useCurrency();
  const [companyName, setCompanyName] = useState('');
  const totalBarcodes = generatedBarcodeValue?.length || 0;

  // Fetch warehouse data
  const fetchData = async (url, setData, transformData) => {
    try {
      const response = await axios.get(url);
      const data = transformData ? transformData(response.data) : response.data;
      setData(data);
    } catch (error) {
      console.error(`Fetch data error from ${url}:`, error);
      setData([]);
      toast.error("Failed to fetch warehouse data. Please try again later.", { autoClose: 2000, className: "custom-toast" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData(
      `${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`,
      setWarehouseData,
      (data) => data.warehouses || []
    );
  }, []);

  // Calculate price range for products with variations
  const getPriceRange = (product, selectedVariation) => {
    if (product.variationValues) {
      // If a variation is selected, return the price of that variation
      if (selectedVariation && product.variationValues[selectedVariation]) {
        const variationPrice = Number(
          product.variationValues[selectedVariation].productPrice
        );
        return !isNaN(variationPrice)
          ? `${variationPrice}`
          : "Price not available";
      }
      // Otherwise, return the minimum price of all variations
      const prices = Object.values(product.variationValues)
        .map((variation) => Number(variation.productPrice))
        .filter((price) => !isNaN(price));

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return minPrice;
      }
    }
    const singlePrice = Number(product.productPrice);
    return !isNaN(singlePrice) && singlePrice > 0
      ? `${singlePrice}`
      : "Price not available";
  };

  // Handle product search
  const handleProductSearch = async (e) => {
    const keyword = e.target.value;
    const term = e.target.value;
    setSearchTerm(term);
    if (!warehouse) {
      toast.error("Please select a warehouse first.", { autoClose: 2000, className: "custom-toast" });
      return;
    }

    setSearchTerm(keyword);
    if (keyword.length > 0) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/searchProductByName`,
          {
            params: {
              name: keyword,
              warehouse: warehouse,
            },
          }
        );
        setFilteredProducts(response.data.products);
      } catch (error) {
        console.error("Error fetching product:", error);
        setFilteredProducts([]);
        toast.error("Failed to fetch products. Please try again.", { autoClose: 2000, className: "custom-toast" });
      }
    } else {
      setFilteredProducts([]);
    }
  };

  //Handle Removeing product from table
  const handleDelete = (productId, selectedVariation) => {
    setSelectedProduct((prevProducts) =>
      prevProducts.filter(
        (product) =>
          product._id !== productId ||
          product.selectedVariation !== selectedVariation
      )
    );
    toast.success('Product Deleted successfully!', { autoClose: 2000, className: "custom-toast" });
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    if (product.ptype === "Variation" && product.variationValues) {
      // Add each variation as a separate row in the table
      const variations = Object.keys(product.variationValues).map(
        (variationKey) => ({
          ...product,
          selectedVariation: variationKey, // Set the current variation
          barcodeFormat: product.barcode,
          barcodeQty: 0, // Default barcode quantity for each variation
        })
      );

      setSelectedProduct((prevProducts) => [...prevProducts, ...variations]); // Add all variations as separate rows
    } else {
      // Handle normal product without variations
      setSelectedProduct((prevProducts) => [
        ...prevProducts,
        {
          ...product,
          barcodeFormat: product.barcode,
          barcodeQty: 0, // Default barcode quantity for the product
        },
      ]);
    }

    setSearchTerm(""); // Clear search term
    setFilteredProducts([]); // Clear filtered products
  };

  // Generate barcodes based on the specified barcode quantity (barcodeQty)
  const generateBarcode = () => {
    try {
      const barcodes = selectedProduct.flatMap((product) => {
        const productCode = product.code || product._id;
        const productName = product.name;
        const qty = product.barcodeQty || 0;
        const barcodeValue = `${productCode}`;
        const productPrice = getPriceRange(product, product.selectedVariation);
        return Array.from({ length: qty }, () => ({
          productId: product._id,
          barcode: productCode,
          barcodeFormat: product.barcodeFormat,
          productName: showProductName ? productName : "",
          productPrice: getPriceRange(product, product.selectedVariation),
          companyName: showCompanyName ? companyName : "",
          price: showPrice ? productPrice : "",
        }));
      });
      setGeneratedBarcodeValue(barcodes);
    } catch (error) {
      console.error("Error generating barcodes:", error);
      toast.success("Failed to generate barcodes. Please try again.", { autoClose: 2000, className: "custom-toast" });;
    }
  };
  useEffect(() => {
    generateBarcode();
  }, [selectedProduct]);

  const handleBarcodeQtyChange = (productId, selectedVariation, value) => {
    setSelectedProduct((prevProducts) =>
      prevProducts.map((product) => {
        if (
          product._id === productId &&
          product.selectedVariation === selectedVariation
        ) {
          const currentQty = product.barcodeQty || 0;
          let newQty;
          if (typeof value === "number") {
            newQty = currentQty + value;
          } else {
            const parsedValue = parseInt(value, 10);
            newQty = isNaN(parsedValue) ? 0 : parsedValue;
          }

          return { ...product, barcodeQty: Math.max(0, newQty) };
        }
        return product;
      })
    );
  };

  const componentRef = useRef();
  const handleSubmit = (event) => {
    event.preventDefault();
    generateBarcode();
  };

  const handleBarcodesPerRowChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 4) {
      setBarcodesPerRow(value);
    } else if (e.target.value === "") {
      setBarcodesPerRow("");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
        if (isMounted) {
          setCompanyName(data.companyName || '');
          if (data.defaultWarehouse) {
            sessionStorage.setItem('defaultWarehouse', data.defaultWarehouse);
          }
          else {
            console.warn("[DEBUG] No logo received in API response!");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("[DEBUG] Error fetching settings:", error);
        }
      }
    };
    fetchSettings(); return () => { isMounted = false; };
  }, []);

  //Handle clear
  const HandleClear = () => {
    setWarehouse("");
    setSearchTerm("");
    setSelectedProduct([]);
    setGeneratedBarcodeValue([]);
    setShowCompanyName(false);
    setShowProductName(false);
    setShowPrice(false);
    setPageSize("");
  };

  return (
    <div className="background-white relative left-[18%] w-[82%] min-h-[100vh]  p-5">
      <div className="flex justify-between items-center mt-20 ">
        <h2 className="text-lightgray-300 text-2xl">Create Barcode</h2>
        <Link
          className="px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white"
          to={"/dashboard"}
        >
          Back
        </Link>
      </div>
      <div className="bg-white mt-[20px] w-full overflow-x-auto rounded-2xl pb-20 px-8 shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-16">
            <div className="flex-1">
              {/* Warehouse */}
              <div className="mt-5">
                <label className="block text-sm text-left  font-medium leading-6 text-gray-900">
                  Warehouse
                </label>
                <div className="mt-2">
                  <select
                    required
                    name="warehouse"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="block w-[350px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
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
              {/* Product search */}
              <div className="mt-5">
                <label className="block text-left  text-sm text-left  font-medium leading-6 text-gray-900">
                  Product name
                </label>
                <div className="relative flex items-center w-[350px]">
                  <input
                    name="keyword"
                    type="text"
                    value={searchTerm}
                    disabled={!warehouse} // Disable if no warehouse is selected
                    className={`block w-[350px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm ${!warehouse ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    onChange={handleProductSearch}
                    placeholder={searchTerm ? "" : "        Search..."}
                  />
                  {!searchTerm && (
                    <button
                      type="submit"
                      className="absolute left-3 inset-y-0 flex items-center text-gray-400"
                    >
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
                  )}
                  {filteredProducts.length > 0 && (
                    <ul className="absolute top-12 left-0 z-10 w-[350px] bg-white border border-gray-300 rounded-md shadow-lg">
                      {filteredProducts.map((product) => (
                        <li
                          key={product._id}
                          onClick={() => handleProductSelect(product)}
                          className="cursor-pointer hover:bg-gray-100 px-4 text-left py-2"
                        >
                          {product.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {/* Display product details */}
              {loading ? (
                <Box
                  sx={{
                    width: "100%",
                    position: "absolute",
                    top: "0",
                    left: "0",
                  }}
                >
                  <LinearProgress />
                </Box>
              ) : (
                <div className="overflow-x-auto">
                  {selectedProduct.length > 0 && (
                    <table className="mt-10 min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Barcode Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Barcode amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.map((product, index) => (
                          <tr
                            key={`${product._id}-${product.selectedVariation || ""
                              }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                              {product.name}{" "}
                              {product.selectedVariation &&
                                `(${product.selectedVariation})`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                              <select
                                value={product.barcodeFormat || ""}
                                onChange={(e) => {
                                  const newBarcodeFormat = e.target.value;
                                  setSelectedProduct((prevProducts) =>
                                    prevProducts.map((p, i) =>
                                      i === index
                                        ? {
                                          ...p,
                                          barcodeFormat: newBarcodeFormat,
                                        }
                                        : p
                                    )
                                  );
                                }}
                                className="block w-[150px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                              >
                                <option value="">Select a pattern</option>
                                <option value="code128">Code 128</option>
                                <option value="code39">Code 39</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                              {product.code}
                            </td>

                            {/* Barcode quantity with increase/decrease buttons */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500">
                              <div className="flex items-center">
                                {/* Decrement Button */}
                                <button
                                  onClick={() =>
                                    handleBarcodeQtyChange(
                                      product._id,
                                      product.selectedVariation,
                                      -1
                                    )
                                  }
                                  className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  <img
                                    className="w-[18px] h-[18px] "
                                    src={Decrease}
                                    alt="decrease"
                                  />
                                </button>

                                {/* Input Field */}
                                <input
                                  type="number"
                                  value={product.barcodeQty || 0}
                                  onChange={(e) =>
                                    handleBarcodeQtyChange(
                                      product._id,
                                      product.selectedVariation,
                                      e.target.value
                                    )
                                  }
                                  className="mx-2 w-16 py-[7px] text-center border rounded"
                                  min="0"
                                />

                                {/* Increment Button */}
                                <button
                                  onClick={() =>
                                    handleBarcodeQtyChange(
                                      product._id,
                                      product.selectedVariation,
                                      1
                                    )
                                  }
                                  className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  <img
                                    className="w-[18px] h-[18px] transform rotate-180"
                                    src={Decrease}
                                    alt="increase"
                                  />
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                              {currency}{" "}
                              {formatWithCustomCommas(
                                product.ptype === "Variation" &&
                                  product.selectedVariation
                                  ? getPriceRange(
                                    product.variationValues[
                                    product.selectedVariation
                                    ]
                                  )
                                  : getPriceRange(product)
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                              <button
                                onClick={() =>
                                  handleDelete(
                                    product._id,
                                    product.selectedVariation
                                  )
                                }
                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2 text-lg ml-5"
                                style={{ background: "transparent" }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              <hr className="mt-10" />
              {/* Page size */}
              <div className="flex flex-wrap gap-x-6">
                {/* Sticker width input */}
                <div className="mt-10 flex-1 min-w-[300px]">
                  <label className="block text text-left -sm font-medium leading-6 text-gray-900">
                    Sticker Width (mm)
                  </label>
                  <input
                    type="number"
                    value={stickerWidth}
                    onChange={(e) => setStickerWidth(parseInt(e.target.value))}
                    placeholder="Sticker Width (mm)"
                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                  />
                </div>

                {/* Sticker height input */}
                <div className="mt-10 flex-1 min-w-[300px]">
                  <label className="block text-sm text-left  font-medium leading-6 text-gray-900">
                    Sticker Height (mm)
                  </label>
                  <input
                    type="number"
                    value={stickerHeight}
                    onChange={(e) => setStickerHeight(parseInt(e.target.value))}
                    placeholder="Sticker Height (mm)"
                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                  />
                </div>

                {/* Barcodes per row input */}
                <div className="mt-10 flex-1 min-w-[300px]">
                  <label htmlFor="barcodesPerRow">Barcodes Per Row</label>
                  <input
                    type="number"
                    id="barcodesPerRow"
                    value={barcodesPerRow}
                    onChange={handleBarcodesPerRowChange}
                    onBlur={(e) => {
                      // On blur, if the value is empty or invalid, reset to the minimum value (1)
                      const value = parseInt(e.target.value, 10);
                      if (isNaN(value) || value < 1 || value > 4) {
                        setBarcodesPerRow(1);
                      }
                    }}
                    min="1"
                    max="4"
                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>
              {/* Checkbox options */}
              <div
                className="mt-10 
                            flex space-x-10"
              >
                {/* <div>
                  <label className="block text-sm text-left  font-medium leading-6 text-gray-900">
                    Show Company Name
                  </label>
                  <input
                    type="checkbox"
                    className="h-6 w-6 mt-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => setShowCompanyName(e.target.checked)}
                    defaultChecked={true}
                  />
                </div> */}
                <div>
                  <label className="block text-sm text-left  font-medium leading-6 text-gray-900">
                    Show Product Name
                  </label>
                  <input
                    type="checkbox"
                    className="h-6 w-6  mt-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => setShowProductName(e.target.checked)}
                    defaultChecked={true}
                  />
                </div>
                <div>
                  <label className="block text-sm text-left  font-medium leading-6 text-gray-900">
                    Show Price
                  </label>
                  <input
                    type="checkbox"
                    className="h-6 w-6  mt-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => setShowPrice(e.target.checked)}
                    defaultChecked={true}
                  />
                </div>
              </div>
              {/* BUTTON SECTION*/}
              <div className="container mx-auto text-left">
                <div className="mt-10 flex justify-start">
                  {/* Generating button*/}
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="button-bg-color  button-bg-color:hover text-white  py-2 px-4 rounded transition duration-300"
                  >
                    Preview
                  </button>

                  {/* Printing button*/}
                  <ReactToPrint
                    trigger={() => (
                      <button className="bg-blue-500  ml-2 text-white  py-2 px-6 rounded hover:bg-blue-700 transition duration-300">
                        Print
                      </button>
                    )}
                    content={() => componentRef.current}
                  />

                  {/*Clear button*/}
                  <button
                    type="button"
                    onClick={HandleClear}
                    className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px]  focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {/* Display generated barcode */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                //   className="mt-10"
                className="mt-10"
              >
                <div
                  id="printableArea"
                  ref={componentRef}
                  style={{
                    "--sticker-width": `${stickerWidth}mm`, // CSS variable for width
                    "--sticker-height": `${stickerHeight}mm`, // CSS variable for height
                    "--sticker-gap": `0mm`, // CSS variable for height
                    "--barcodesPerRow": `${barcodesPerRow}`,
                  }}
                >
                  {generatedBarcodeValue
                    .slice(0, totalBarcodes)
                    .map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="barcode-sticker"
                      >
                        <p className="company-name">{companyName}</p>
                        <div className="barcode-container">
                          <JsBarcodeComponent
                            value={item.barcode}
                            format={item.barcodeFormat}
                            width={1.5}
                            height={24}
                            displayValue={true}
                            fontSize={11}
                            //fontOptions="bold"
                            font="Arial"
                          />
                        </div>
                        {item.productName && (
                          <p className="product-name">{item.productName}</p>
                        )}
                        {item.price && (
                          <p className="price">Rs: {item.price}.00</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBarcodeBody;