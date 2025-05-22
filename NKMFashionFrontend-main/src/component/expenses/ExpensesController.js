import axios from "axios";
import { toast } from "react-toastify";

// Handle form submission to create a new expenses category
export const handleFormSubmit = async (e, setLoading, expensesName, setExpensesName, setResponse, setError,navigate, setPopupVisible, setExCategoryData) => {
    e.preventDefault();

    const expensesData = { expensesName };
    setLoading(true); // Start loading indicator

    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createExpensesCategory`, expensesData);
        console.log(response.data.message);

        // Clear form fields and display success message
        setExpensesName('');
        // setResponse('Expenses category created successfully.');
        toast.success(
            "Expenses category created successfully",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        
        // ✅ Close Popup
        setPopupVisible(false);
        // ✅ Clear Input
        setExpensesName('');
        // ✅ Refresh the list
        return true;
        console.log('Expenses created successfully:', response.data.message);
    } catch (error) {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (error.response) {
            toast.error(
                errorMessage = error.response.data?.message || "Failed to create expenses category. Please try again.",
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
            // errorMessage = error.response.data?.message || "Failed to create expenses category. Please try again.";
            
        } else if (error.request) {
            // Request was made but no response received
            toast.error(
                "No response from the server. Please check your internet connection and try again.",
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } else {
            // Something else happened while setting up the request
            console.error('Error', error.message);
        }

        console.error('Error creating expenses category:', errorMessage);
        return false;
    } finally {
        setLoading(false); // Stop loading indicator
    }
};


// Fetch all expenses categories-
export const fetchExpensesCatData = async (
    setExCategoryData,
    setLoading,
    setError,
    size,
    page,
    setTotalPages
) => {
    setLoading(true); // Start loading indicator

    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getExpensesCategory`, {
            params: {
                'page[size]': size,
                'page[number]': page,
            },
        });

        const { data, totalPages } = response.data;
        setExCategoryData(data);   // Set category data
        setTotalPages(totalPages || 0); // Set total pages (default to 0 if not provided)
        setError(''); // Clear any previous error messages
        console.log('Fetched expenses categories:', data);
    } catch (error) {
        console.error('Error fetching expenses categories:', error); // Log error to console
    } finally {
        setLoading(false); // Stop loading indicator
    }
};


// Fetch an expense by ID for editing
export const fetchExpensesById = async (id, setEditExpensesName, setSelectedExpensesCatId, setIsPopUpEdit) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findExpensesById`, {
            params: { id }
        });
        const expenses = response.data.data;
        console.log(expenses)
        setEditExpensesName(expenses.expensesName);
        setSelectedExpensesCatId(id);
        setIsPopUpEdit(true); // Open the popup for editing
        console.log('Fetched expense for editing:', expenses);
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to fetch expense.try again.";
        console.error('Error fetching expense by ID:', errorMessage);
    }
};

// Update an expense category
export const updateExpenses = async (e, selectedExpensesCatId, editExpensesName, setEditExpensesName, setResponse, setIsPopUpEdit, setError,navigate, setExCategoryData, setLoading) => {
    e.preventDefault();

    const updatedExpensesData = { editExpensesName };
    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateExpensesCategory/${selectedExpensesCatId}`, updatedExpensesData);
        console.log('expenses updated successfully:', response.data.message);

        setEditExpensesName('');
        toast.success(
            "Expenses category updated successfully",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
    
        // ✅ Close Popup
        setIsPopUpEdit(false);
        // ✅ Clear Input
        setEditExpensesName('');
        // ✅ Refresh the list
        return true;
        console.log('Expense updated successfully:', response.data.message);
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Error updating expense category.";
  
        toast.error(
            errorMessage,
            { autoClose: 2000, className: "custom-toast" }
                );
  
        console.error('Error updating expense:', error);
        return false;
    }
};

// Search for expenses by name
export const handleSubmit = async (inputValue, setLoading, setSearchedCurrencyByName) => {
    setLoading(true);

    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findCurruncyByName`, {
            params: { currencyName: inputValue } // Use the passed keyword
        });

        const data = response.data?.data || [];
        setSearchedCurrencyByName(data);
        console.log('Searched expenses:', data);
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to find expenses by name.try again.";
        console.error('Error searching for expenses:', errorMessage);
        setSearchedCurrencyByName([]);
    } finally {
        setLoading(false);
    }
};
