import axios from 'axios';
import { debounce } from 'lodash';
import { fetchAllData } from './fetchAllData';
export const handleFindProductBySearch = (e, setProductKeyword, handleProductSubmit) => {
    const keyword = e.target.value;
    setProductKeyword(keyword);
    handleProductSubmit(keyword);
};

export const determineSearchTypeOfProduct = (keyword) => {
    if (/^[A-Za-z0-9\-]+$/.test(keyword)) {
        return 'code';
    }
    return 'name';
};

export const handleProductSubmit = async (Productkeyword, setLoading, setSearchedProductData) => {
    setLoading(true);
    try {
        const searchType = determineSearchTypeOfProduct(Productkeyword);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findproductByCode`, {
            params: { keyword: Productkeyword, searchType }
        });

        if (response.data && response.data.product) {
            console.log('Product found:', response.data.product); // Log product data on success
            setSearchedProductData([response.data.product]);
        } else {
            console.log('No product found for the given keyword'); // Log if no product is found
            setSearchedProductData([]);
        }
    } catch (error) {
        console.error('Find product error:', error); // Log the error if request fails
        setSearchedProductData([]);
    } finally {
        setLoading(false);
        console.log('Search completed. Loading state:', setLoading); // Log when search is complete and loading state
    }
};
