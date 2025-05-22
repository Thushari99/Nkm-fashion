import axios from "axios";
import { toast } from "react-toastify";

// Handle form submission to create a new currency
export const handleFormSubmit = async (
    e,
    setLoading,
    currencyName,
    currencyCode,
    currencySymbole,
    setCurrencyName,
    setCurrencyCode,
    setCurrencySymbole,
    setcurrenciCreatingResponse,
    setError,
    navigate,
    setIsPopupOpen,
    setRefreshKey
) => {
    e.preventDefault();
    setError('')
    const currencyData = {
        currencyName,
        currencyCode,
        currencySymbole,
    };

    try {
        const response = await axios.post(
            `${process.env.REACT_APP_BASE_URL}/api/createCurrency`,
            currencyData
        );

        // Clear form fields
        setCurrencyName('');
        setCurrencyCode('');
        setCurrencySymbole('');
        // setcurrenciCreatingResponse('Currency created successfully.'); // Store success message as string
        toast.success(
            "Currency created successfully!",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        
         // Close popup and refresh table
         setIsPopupOpen(false);
         setRefreshKey(prev => prev + 1);
        
    } catch (error) {
        const errorMessage =
            error.response?.data?.message ||
            'Failed to create currency. Please try again later.';
        console.error('Error creating currency:', errorMessage);

        // Call setError if provided
        if (typeof setError === 'function') {
            toast.error(errorMessage ,
                { autoClose: 2000 },
                { className: "custom-toast" });
        }
        setcurrenciCreatingResponse(errorMessage); // Store error message as string
    } finally {
        setLoading(false);
    }
};

// Function to fetch all currencies
export const fetchSaleData = async (setCurrencyData, setLoading, setError) => {
    setLoading(true);
    setError(null); // Reset error state
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCurrency`);
        setCurrencyData(response.data.data);
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || 'Failed to fetch currencies. Please try again.';
        console.error('Error fetching currencies:', errorMessage);
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};

// Handle delete purchase
export const handleDelete = async (_id, currencyData, setCurrencyData, setResponse, setRefreshKey) => {
    try {
        const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteCurrency/${_id}`);

        // Check if the deletion was successful
        if (response.status === 'success') {
            setCurrencyData(currencyData.filter(currency => currency._id !== _id));
            toast.success('Currency deleted successfully!', { autoClose: 2000, className: "custom-toast" });
            setRefreshKey(prevKey => prevKey + 1);
        } else {
            throw new Error('Unexpected response status'); // Force the catch block
        }
    } catch (error) {
        const errorMessage =
        error.response?.data?.message || 'Failed to delete currency. Please try again.';
        console.error('Error deleting currency:', errorMessage);
        toast.error(errorMessage , { autoClose: 2000 });
        if (setResponse) {
            setResponse({ type: 'error', message: errorMessage });
        }
    }
};

export const fetchCurrencyById = async (id, setEditCurrencyName, setEditCurrencyCode, setEditCurrencySymbole, setSelectedCurrencyId, setIsPopUpEdit, setError, setResponse) => {
    setError(null)
    setResponse('')
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCurrency`, {
            params: { id }
        });
        const currency = response.data.data;
        setEditCurrencyName(currency.currencyName);
        setEditCurrencyCode(currency.currencyCode);
        setEditCurrencySymbole(currency.currencySymbole);
        setSelectedCurrencyId(id);
        setIsPopUpEdit(true); // Open popup for editing
    } catch (error) {
        console.error('Error fetching currency by ID:', error);
    }
};

export const updateCurrency = async (e, selectedCurrencyId, editcurrencyName, editcurrencyCode, editcurrencySymbole, setEditCurrencyName, setEditCurrencyCode, setEditCurrencySymbole, setResponse, setError, setIsPopupOpen, navigate, setRefreshKey, setSelectedCurrencyId, setIsPopUpEdit) => {
    e.preventDefault();
    const updatedCurrencyData = {
        editcurrencyName,
        editcurrencyCode,
        editcurrencySymbole,
    };

    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateCurrency/${selectedCurrencyId}`, updatedCurrencyData);

        // Clear the form and close the popup
        setEditCurrencyName('');
        setEditCurrencyCode('');
        setEditCurrencySymbole('');
        // setResponse('Currency updated successfully.');
        toast.success(
            "Currency updated successfully!",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        // Close popup, clear form, reset selection
        setIsPopUpEdit(false);
        setSelectedCurrencyId(null);
        setEditCurrencyName('');
        setEditCurrencyCode('');
        setEditCurrencySymbole('');
        setRefreshKey(prev => prev + 1);

        // Fetch updated data
        //fetchSaleData();
    } catch (error) {
        // const errorMessage =
        //     error.response?.data?.message || 'Failed to update currency. Please try again.';
        console.error('Error updating currency:', error);
        toast.error(
            "Error updating currency",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
    }
};

//Find currency by name
export const handleSubmit = async (inputValue, setLoading, setSearchedCurrencyByName) => { // Accept the keyword as a parameter
    setLoading(true);
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findCurruncyByName`, {
            params: { currencyName: inputValue } // Use the passed keyword
        });

        console.log(response.data); // Log the response data to check its structure

        // Check if the response.data is an array or has a property that holds the array
        if (Array.isArray(response.data)) {
            setSearchedCurrencyByName(response.data.data);
        } else if (response.data && response.data.data) {
            setSearchedCurrencyByName(response.data.data); // Adjust based on your actual response structure
        } else {
            setSearchedCurrencyByName([]); // Fallback to an empty array if data is unexpected
        }
    } catch (error) {
        console.error('Find customer error:', error);
        setSearchedCurrencyByName([]); // Clear the search results on error
    } finally {
        setLoading(false);
    }
};