import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import "../../styles/login.css";
import { read, utils } from "xlsx";
import PaginationDropdown from "../utill/Pagination";
import { toast } from "react-toastify";
import ConfirmationModal from "../common/deleteConfirmationDialog";
import { UserContext } from "../../context/UserContext";

function ViewSuplierBody() {
  // State variables
  const [suplierData, setSuplierData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [searchedSuplier, setSearchedSuplier] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPopup, setOpenPopup] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [error, setError] = useState("");
  const [successStatus, setSuccessStatus] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const debounceTimeout = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [permissionData, setPermissionData] = useState({});
  const { userData } = useContext(UserContext);

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


  const fetchSuplierData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/fetchSupplier`,
        {
          params: {
            sort: "-createdAt",
            "page[size]": size, // Use the selected size
            "page[number]": page,
          },
        }
      );
      setSuplierData(response.data.suppliers);
      setSearchedSuplier(response.data.suppliers);
      setTotalPages(response.data.totalPages || 0);
      setKeyword('');
    } catch (error) {
      console.error("Fetch supplier data error:", error);
      setError("No suppliers found.");
      setSuplierData([]);
      setSearchedSuplier([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all suppliers
  useEffect(() => {
    if (keyword.trim() === '') {
      // Trigger fetching all units when search bar is cleared
      fetchSuplierData();
    }
  }, [keyword, page, size, refreshKey]);


  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  // Handle delete supplier
  const handleDelete = async (_id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/api/DeleteSuplier/${_id}`
      );
      setSuplierData(suplierData.filter((supplier) => supplier._id !== _id));
      toast.success("Supplier deleted successfully!", { autoClose: 2000 });
      setRefreshKey(prevKey => prevKey + 1);
      fetchSuplierData('');
    } catch (error) {
      console.error("Delete supplier error:", error);
      toast.error("Error deleting supplier!", { autoClose: 2000 });
    }
  };

  const showConfirmationModal = (supplierId) => {
    setSupplierToDelete(supplierId); // Set the sale ID to be deleted
    setIsModalOpen(true);  // Open the confirmation modal
  };

  const searchSupplier = async (query) => {
    setLoading(true);
    setError(""); // Clear any previous error messages

    try {
      if (!query.trim()) {
        // If the query is empty, reset to all products
        setSearchedSuplier(suplierData); // Reset to the initial list
        setSuccessStatus("");
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchSupplier`, {
        params: { keyword: query }, // Send the keyword parameter
      });

      if (response.data.suppliers && response.data.suppliers.length > 0) {
        setSearchedSuplier(response.data.suppliers);
        setSuccessStatus("");
      } else {
        setSearchedSuplier([]); // Clear the table
        setError("No suppliers found for the given query."); // Set error message
      }
    } catch (error) {
      console.error("Search product error:", error);
      setSearchedSuplier([]); // Clear the table
      setError("No suppliers found for the given query.");
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (value.trim() === "") {
        setError("");
        setSuccessStatus("");
        setSearchedSuplier(suplierData); // Reset to full list
      } else {
        searchSupplier(value); // Call the search API with the entered query
      }
    }, 100); // Adjust debounce delay as needed
  };


  // Handle keydown events
  const handleKeyDown = (e) => {
    const value = e.target.value;

    // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
    if (e.key === 'Backspace' && value === '') {
      setSearchedSuplier([]);
    }
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json(worksheet);
        setExcelData(file);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle save button click in import customer
  const handleSave = async () => {
    try {
      if (excelData) {
        // Create a new FormData object
        const formData = new FormData();
        formData.append("file", excelData); // Append the file to the FormData object

        // Send the file to the backend using axios
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/api/importSuplier`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 201) {
          toast.success("Supplier imported successfully!", {
            autoClose: 2000,
            className: "custom-toast",
          });

          // Reloading new imported supplier
          const fetchSupplierData = async () => {
            setLoading(true);
            try {
              const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/fetchSupplier`
              );
              console.log("Fetched supplier data:", response.data);
              setSuplierData(response.data.suppliers);
            } catch (error) {
              console.error("Fetch supplier data error:", error);
            } finally {
              setLoading(false);
            }
          };
          fetchSupplierData();
          setOpenPopup(false);
          setExcelData(null);
          setSuccessStatus("Supplier saved successfully");

          window.location.reload();
        } else {
          console.error("Failed to save Supplier:", response.data.message);
          setError(`Failed to save Supplier: ${response.data.message}`);
        }
      } else {
        console.error("No file to save");
        setError("No file to save");
      }
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error("Server Error:", error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network Error:", error.request);
      } else {
        // Something else happened while setting up the request
        console.error("Error:", error.message);
      }
    } finally {
      setLoading(true);
    }
  };

  // Close popup and refresh data
  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  return (
    <div className="relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5">
      <div className="flex justify-between mb-4">
        <div className="relative w-full max-w-md">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center"
          >
            <input
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              name="keyword"
              type="text"
              placeholder="Search by supplier name or username..."
              className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
              value={keyword}
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
          {permissionData.import_supplier && (
          <div>
            <button
              onClick={() => setOpenPopup(true)}
              className="submit mr-2 flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
            >
              Import Supplier
            </button>
          </div>
        )}
        {permissionData.create_supplier && (
          <div>
            <Link
              to={"/createSuplier"}
              className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
            >
              Create Supplier
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
      ) : searchedSuplier.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created on
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {searchedSuplier.map((searchedSuplier) => (
                <tr key={searchedSuplier._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {searchedSuplier.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {searchedSuplier.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {searchedSuplier.mobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {new Date(searchedSuplier.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 justify-end">
                    <div className="flex items-center justify-end">
                      {permissionData.edit_supplier && (
                      <Link
                        to={`/editSuplier/${searchedSuplier._id}`}
                        className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                        style={{ background: "transparent" }}
                      >
                        <i className="fas fa-edit mr-1"></i>
                      </Link>
                      )}
                       {permissionData.delete_supplier && (
                      <button
                        onClick={() => showConfirmationModal(searchedSuplier._id)}
                        className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                        style={{ background: "transparent" }}
                      >
                        <i className="fas fa-trash mr-1"></i>
                      </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : suplierData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created on
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suplierData.map((suplier) => (
                <tr key={suplier._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {suplier.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {suplier.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {suplier.mobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-left">
                    {new Date(suplier.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-m text-gray-900 text-right justify-end">
                    <div className="flex items-center justify-end">
                    {permissionData.edit_supplier && (
                      <Link
                        to={`/editSuplier/${suplier._id}`}
                        className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                        style={{ background: "transparent" }}
                      >
                        <i className="fas fa-edit mr-1"></i>
                      </Link>
                    )}
                    {permissionData.delete_supplier && (
                      <button
                        onClick={() => showConfirmationModal(suplier._id)}
                        className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                        style={{ background: "transparent" }}
                      >
                        <i className="fas fa-trash mr-1"></i>
                      </button>
                    )}
                    </div>
                  </td>
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

      {/* Importing suplier section */}
      {openPopup && (
        <>
          <div
            className="fixed inset-0 bg-gray-900  bg-opacity-50 z-40"
            onClick={() => setOpenPopup(false)}
          ></div>
          {/* Popup Container */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 h-[450px] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Import Suplier</h2>
              <div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className=""
                />
              </div>

              <div className="mt-10">
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Username : Required
                </label>
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Name : Required
                </label>
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  NIC : Required
                </label>
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Mobile : Required
                </label>
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Country : Required
                </label>
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  City : Required
                </label>
                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                  Address : Required
                </label>
              </div>

              <div>
                <button
                  onClick={handleSave}
                  className="submit flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"
                >
                  Save
                </button>
                <button
                  onClick={handleClosePopup}
                  className="mt-20 inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px]  focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}  // Close modal
        onConfirm={() => handleDelete(supplierToDelete)}  // Confirm delete
        message="Are you sure you want to delete this supplier?"
      />

      {/* Pagination Controls - Visible only when data is loaded */}
      <div>
        {!error && suplierData.length > 0 && (
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
      <div className="mt-5">
        {/* Error and Response Messages */}
        {/* {error && <p className="text-red-500 text-center">{error}</p>} */}
        {successStatus && (
          <p className="text-color text-center">{successStatus}</p>
        )}
      </div>
    </div>
  );
}

export default ViewSuplierBody;
