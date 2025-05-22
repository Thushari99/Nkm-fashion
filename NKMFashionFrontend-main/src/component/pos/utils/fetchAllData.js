import axios from 'axios';

export const fetchAllData = async (setProductData, setSelectedCategoryProducts, setSelectedBrandProducts,setSearchedProductData, setLoading, setError) => {
    setSelectedBrandProducts([]);
    setSearchedProductData([]);
    setLoading(true);
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getProduct`);
        if (response.data && response.data.products && Array.isArray(response.data.products)) {
            setProductData(response.data.products);
            setSelectedCategoryProducts(response.data.products)
            setSelectedBrandProducts(response.data.products)
        } else {
            console.error('Unexpected response format:', response.data);
            setProductData([]);
        }
    } catch (error) {
        setError('Failed to load products. Please try again later.')
        console.error('Fetch product data error:', error);
        setProductData([]);
    } finally {
        setLoading(false);
    }
};
 