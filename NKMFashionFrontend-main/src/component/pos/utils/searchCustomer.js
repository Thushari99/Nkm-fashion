import axios from 'axios';

// Handle search input change
export const handleFindUser = (e, setKeyword) => {
    setKeyword(e.target.value);
};

// Determine search type based on the keyword
const determineSearchType = (keyword) => {
    if (/^\d+$/.test(keyword)) { // If the keyword is numeric
        return 'mobile';
    } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(keyword)) { // If the keyword looks like an email
        return 'username';
    } else {
        return 'name'; // Default to name if nothing else fits
    }
};

// Handle search form submission
export const handleSubmit = async (e,setLoading,setSearchedCustomer,keyword) => {
    e.preventDefault();
    console.log(keyword)
    // setLoading(true);
    // try {
    //     const searchType = determineSearchType(keyword);
    //     const response = await axios.get('http://localhost:5000/api/fetchCustomer', {
    //         params: { keyword, searchType }
    //     });
    //     setSearchedCustomer(response.data.length > 0 ? response.data[0] : null);
    // } catch (error) {
    //     console.error('Find customer error:', error);
    // } finally {
    //     setLoading(false);
    // }
};
