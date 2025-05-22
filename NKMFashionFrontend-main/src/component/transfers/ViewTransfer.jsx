import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import "../../styles/role.css";
import { usePDF } from "react-to-pdf";
import PaginationDropdown from "../utill/Pagination";
import { toast } from "react-toastify";
import ConfirmationModal from "../common/deleteConfirmationDialog";
import { UserContext } from "../../context/UserContext";
import { useCurrency } from '../../context/CurrencyContext';

function ViewTransferBody() {
  // State variables
  const [transferData, setTransferData] = useState([]);
  const [referenceId, setReferenceId] = useState("");
  const [searchedTransferData, setSearchTransferData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPopupId, setOpenPopupId] = useState(null);
  const popupRef = useRef(null);
  const [openViewSale, setOpenViewSale] = useState(null);
  const [filteredSaleData, setFilteredSaleData] = useState(transferData);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);
  const [successStatus, setSuccessStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState(null);
  const debounceTimeout = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [permissionData, setPermissionData] = useState({});
  const { userData } = useContext(UserContext);
  const { currency } = useCurrency();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyMobile, setCompanyMobile] = useState('');
  const [address, setAddress] = useState('');
  const { toPDF, targetRef } = usePDF({
    filename: `${transferData.customer || "invoice"}.pdf`,
  });
  //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
  const combinedProductData =
    Array.isArray(searchedTransferData) && searchedTransferData.length > 0
      ? searchedTransferData
      : Array.isArray(transferData) && transferData.length > 0
        ? transferData
        : [];

  useEffect(() => {
    if (userData?.permissions) {
      console.log("UserData received in useEffect:", userData);

      setPermissionData(extractPermissions(userData.permissions));
    }
  }, [userData]);

  const extractPermissions = (permissions) => {
    let extractedPermissions = {};

    Object.keys(permissions).forEach((category) => {
      Object.keys(permissions[category]).forEach((subPermission) => {
        extractedPermissions[subPermission] = permissions[category][subPermission];
      });
    });

    return extractedPermissions;
  };


  const fetchSaleData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/fetchTransferDetails`,
        {
          params: {
            sort: "-createdAt",
            "page[size]": size, // Use the selected size
            "page[number]": page,
          },
        }
      );
      setTransferData(response.data.transfers);
      setSearchTransferData(response.data.transfers);
      setTotalPages(response.data.totalPages || 0);
      setReferenceId('');
      if (response.data.transfers.length === 0) {
        setError("No transfers found.");
      }
    } catch (error) {
      console.error("Fetch transfer data error:", error);
      setError("No transfers found.");
      setTransferData([]);
      setSearchTransferData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all customers
  useEffect(() => {
    if (referenceId.trim() === '') {
      // Trigger fetching all units when search bar is cleared
      fetchSaleData();
    }
  }, [referenceId, page, size, refreshKey]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  // Handle delete customer
  const handleDelete = async (_id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/api/deleteTransfer/${_id}`
      );
      setTransferData(transferData.filter((sale) => sale._id !== _id));
      toast.success("Transfer deleted successfully!", { autoClose: 2000 });
      setRefreshKey(prevKey => prevKey + 1);
      fetchSaleData();
    } catch (error) {
      console.error("Delete sale error:", error);
      toast.error("Error deleting transfer!", { autoClose: 2000 });
    }
  };

  const showConfirmationModal = (transferId) => {
    setTransferToDelete(transferId); // Set the sale ID to be deleted
    setIsModalOpen(true);  // Open the confirmation modal
  };

  const searchTransfer = async (query) => {
    setLoading(true);
    setError(""); // Clear any previous error messages

    try {
      if (!query.trim()) {
        // If the query is empty, reset to all products
        setSearchTransferData(transferData); // Reset to the initial list
        setSuccessStatus("");
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchTransfer`, {
        params: { referenceId: query }, // Send the keyword parameter
      });
      if (response.data.transfers && response.data.transfers.length > 0) {
        setSearchTransferData(response.data.transfers);
        setSuccessStatus("");
      } else {
        setSearchTransferData([]); // Clear the table
        setError("No transfers found for the given query."); // Set error message
      }
    } catch (error) {
      console.error("Search product error:", error);
      setSearchTransferData([]); // Clear the table
      setError("No transfers found for the given query.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setReferenceId(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (value.trim() === "") {
        setError("");
        setSuccessStatus("");
        setSearchTransferData(transferData); // Reset to full list
      } else {
        searchTransfer(value); // Call the search API with the entered query
      }
    }, 100); // Adjust debounce delay as needed
  };


  // Handle keydown events
  const handleKeyDown = (e) => {
    const value = e.target.value;

    // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
    if (e.key === 'Backspace' && value === '') {
      setSearchTransferData([]);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setOpenPopupId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupRef]);

  const handleSaleViewPopUp = async (saleId) => {
    setOpenPopupId(null);
    setOpenViewSale(openViewSale === saleId ? null : saleId);
    if (openViewSale !== saleId) {
      const sale = transferData.find((sale) => sale._id === saleId);
      const customerName = sale.customer;

      try {
        if (customerName !== "") {
          const response = await axios.get(
            `${process.env.REACT_APP_BASE_URL}/api/searchCustomerByName?name=${customerName}`
          );
          setFilteredSaleData(response.data.customer);
          console.log(response.data);
        } else {
          setFilteredSaleData(transferData);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
        if (isMounted) {
          setEmail(data.email || '');
          setCompanyName(data.companyName || '');
          setCompanyMobile(data.companyMobile || '');
          setAddress(data.address || '');
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

  return (
    <div className="relative bg-[#F9FAFB] absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5">
      <div className="flex justify-between mb-4">
        <div className="relative w-full max-w-md">
          <form
            className="flex items-center"
            onSubmit={(e) => e.preventDefault()}>
            <input
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              name="keyword"
              type="text"
              placeholder="Search by reference ID..."
              className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
              value={referenceId}
            />
            <button
              type="submit"
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"
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
          </form>
        </div>
        <div className="flex items-center">
          {permissionData.create_transfer && (
            <div>
              <Link
                to={"/createTransfer"}
                className="submit rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[200px] text-center"
              >
                Create Transfer
              </Link>
            </div>
          )}
        </div>
      </div>

      {loading ? (
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
      ) : error ? (
        <div className=" ">
          {error && (
            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
              {error}
            </p>
          )}
        </div>
      ) : combinedProductData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refference Id
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse From
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse To
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grand total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {combinedProductData.map((transfer) => (
                <tr key={transfer._id}>
                  <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                    <p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">
                      {transfer.refferenceId}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                    {transfer.warehouseFrom}
                  </td>
                  <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                    {transfer.warehouseTo}
                  </td>
                  <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                    Rs {transfer.grandTotal}
                  </td>
                  <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                    <p className="rounded-[5px] text-center p-[6px] bg-green-100 text-green-500">
                      {transfer.orderStatus}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                    {new Date(transfer.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right">
                    <div className="text-right flex justify-end ">
                      {permissionData.view_transfer_popup && (
                        <button
                          onClick={() => handleSaleViewPopUp(transfer._id)}
                          className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 flex items-center "
                        >
                          <i className="fas fa-eye mr-1"></i>
                        </button>
                      )}
                      {permissionData.edit_transfer && (
                        <Link
                          to={`/editTransfer/${transfer._id}`}
                          className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                          style={{ background: "transparent" }}
                        >
                          <i className="fas fa-edit mr-1"></i>
                        </Link>
                      )}
                      {permissionData.delete_transfer && (
                        <button
                          onClick={() => showConfirmationModal(transfer._id)}
                          className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                          style={{ background: "transparent" }}
                        >
                          <i className="fas fa-trash mr-1"></i>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* View Sale popup */}
                  {openViewSale === transfer._id && (
                    <div
                      ref={popupRef}
                      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
                    >
                      <div className="bg-white w-[1300px] max-h-[90vh] overflow-auto p-8 pt-8 rounded-md shadow-lg mt-40 mb-10">
                        <div
                          ref={targetRef}
                          className="w-[1250px] p-10 bg-white"
                          style={{
                            margin: "0 auto",
                            padding: "15px",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Header */}
                          <div className="mb-6 flex justify-between items-center border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-700">
                              Transfer Details for {transfer.customer}
                            </h2>
                          </div>

                          {/* Sale Info Section */}
                          <div className="grid grid-cols-3 gap-8 text-gray-700">
                            {/* Company Info */}
                            <div className="border-r pr-8">
                              <h3 className="text-lg p-[8px] bg-gray-100 font-semibold mb-2 text-gray-700 text-left">
                                <i className="fas fa-building mr-2 text-gray-600"></i>
                                Company Info
                              </h3>
                              <p className="m-2 text-left"><i className="fas fa-building mr-2 text-gray-400 text-left"></i><span className="font-medium">Company:</span> {companyName}</p>
                              <p className="m-2 text-left"><i className="fas fa-envelope mr-2 text-gray-400 text-left"></i><span className="font-medium">Email:</span> {email}</p>
                              <p className="m-2 text-left"><i className="fas fa-phone mr-2 text-gray-400 text-left"></i><span className="font-medium">Phone:</span> {companyMobile}</p>
                              <p className="m-2 text-left"><i className="fas fa-map-marker-alt mr-2 text-gray-400 text-left"></i><span className="font-medium ">Address:</span> {address}</p>
                            </div>

                            {/* Invoice Info <span className="font-medium m-2">Orser status:</span>*/}
                            <div>
                              <h3 className="text-left text-lg font-semibold p-[8px] bg-gray-100 mb-2 text-gray-700">
                                <i className="fas fa-file-invoice mr-2 text-gray-600"></i>
                                Invoice Info
                              </h3>
                              <p className="mt-2 text-left">
                                <span className="font-medium m-2 mt-4">
                                  <i className="fas fa-warehouse mr-1 text-gray-400"></i>
                                  Warehouse From:
                                </span>
                                {transfer.warehouseFrom}
                              </p>
                              <p className="mt-2 text-left">
                                <span className="font-medium m-2 mt-4">
                                  <i className="fas fa-warehouse mr-1 text-gray-400"></i>
                                  Warehouse To:
                                </span>
                                {transfer.warehouseTo}
                              </p>
                            </div>
                          </div>

                          {/* Product data */}
                          <div className="mt-10">
                            <table className=" mt-2 min-w-full bg-white border border-gray-300">
                              <thead>
                                <tr>
                                  {/* <th className="text-gray-900 py-2 px-4 border-b text-left bg-gray-100 ">Product ID</th> */}
                                  <th className="text-gray-700 py-2 text-left px-4 border-b bg-gray-100 ">
                                    Product name
                                  </th>
                                  <th className="text-gray-700 py-2 text-left  px-4 border-b bg-gray-100 ">
                                    Product price
                                  </th>
                                  <th className="text-gray-700 py-2 text-left px-4 border-b bg-gray-100 ">
                                    qty
                                  </th>
                                  <th className="text-gray-700 py-2 px-4 text-left border-b  bg-gray-100 ">
                                    Sub total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {transfer.productsData.map((product) => (
                                  <tr
                                    key={product._id}
                                    className="text-gray-700"
                                  >
                                    {/* <td className="py-2 px-4 border-b">{product.currentID}</td> */}
                                    <td className="py-2 px-4 text-left border-b">
                                      {product.name}
                                    </td>
                                    <td className="py-2 px-4 text-left border-b">
                                      {currency} {product.price}
                                    </td>
                                    <td className="py-2 px-4 text-left border-b">
                                      {product.quantity}
                                    </td>
                                    <td className="py-2 px-4 text-left border-b">
                                      {currency} {product.subtotal}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Additional data */}
                          <div className="mt-10">
                            <table className=" mt-10 min-w-[400px] bg-white border border-gray-300">
                              <tbody>
                                <tr>
                                  <td className="py-2 px-4 border-b">Total</td>
                                  <td className="py-2 px-4 border-b">
                                    Rs {transfer.grandTotal}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {/* Footer */}
                        <div className="mt-8 flex justify-end">
                          {openViewSale === transfer._id && (
                            <button
                              onClick={() => toPDF()}
                              className="submit px-6 py-3 mr-2 text-white rounded-md shadow-md -600 transition"
                            >
                              <i className="fas fa-file-pdf mr-2 text-white"></i>
                              Download PDF
                            </button>
                          )}
                          <button
                            onClick={() => setOpenViewSale(null)}
                            className="px-6 py-3 bg-gray-500 text-white  rounded-md shadow-md hover:bg-gray-600 transition"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
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

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}  // Close modal
        onConfirm={() => handleDelete(transferToDelete)}  // Confirm delete
        message="Are you sure you want to delete this transfer?"
      />

      {/* Pagination Controls - Visible only when data is loaded */}
      <div>
        {combinedProductData.length > 0 && (
          <PaginationDropdown
            size={size}
            setSize={setSize}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            handlePrevPage={handlePrevPage}
            handleNextPage={handleNextPage}
          />
        )}
      </div>
    </div>
  );
}

export default ViewTransferBody;
