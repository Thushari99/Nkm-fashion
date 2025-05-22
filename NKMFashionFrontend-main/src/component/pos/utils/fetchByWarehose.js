import axios from 'axios';

export const fetchProductDataByWarehouse = async (
    warehouse,
    setProductData,
    setSelectedCategoryProducts,
    setSelectedBrandProducts,
    setSearchedProductData,
    setLoading
) => {
    if (!warehouse) {
        console.warn("No warehouse selected, skipping API call.");
        return; // Prevent fetching all products
    }
    
    setLoading(true);
    setSelectedBrandProducts([]);
    setSearchedProductData([]);
    try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getProduct`, {
            params: { warehouse },
        });
        if (response.data && Array.isArray(response.data.products)) {
            setSelectedCategoryProducts(response.data.products);
        } else {
            console.error('Unexpected response format:', response.data);
            setSelectedCategoryProducts([]);
        }
    } catch (error) {
        console.error('Error fetching category products:', error);
        setSelectedCategoryProducts([])
    } finally {
        setLoading(false);
    }
    
};
