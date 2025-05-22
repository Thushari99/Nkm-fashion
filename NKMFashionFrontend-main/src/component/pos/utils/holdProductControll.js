// fetchHeldProducts.js
import axios from 'axios';

export const getHeldProducts = async (setHeldProducts) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/viewAllHeldProducts`);
        setHeldProducts(response.data.data);
    } catch (error) {
        console.error('Error fetching held products:', error);
    }
};

export const handleDeleteHoldProduct = async (id, heldProducts, setHeldProducts) => {
    try {
        const deleteResponse = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteHeldProduct/${id}`);
        
        // Confirm successful deletion
        if (deleteResponse.status !== 200) {
            throw new Error(`Failed to delete the product with ID ${id}. Status code: ${deleteResponse.status}`);
        }

        const updatedHeldProducts = heldProducts.filter(product => product._id !== id);
        setHeldProducts(updatedHeldProducts); // Update the state immediately

        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/viewAllHeldProducts`);
        setHeldProducts(response.data.data);
    } catch (error) {
        console.error('Error deleting held product:', error);

        if (error.response) {
            // Server responded with a status other than 2xx
            console.error('Error details:', error.response.data);
            alert(`Error: ${error.response.data.message || 'An error occurred while deleting the product.'}`);
        } else if (error.request) {
            // Request made but no response received
            console.error('No response received:', error.request);
            alert('No response received from the server. Please check your internet connection and try again.');
        } else {
            // Something else caused the error
            console.error('Error details:', error.message);
            alert(`An error occurred: ${error.message}`);
        }
    }
};

