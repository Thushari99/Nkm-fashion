import axios from "axios";

export const fetchBrandData = async (brandId, setSelectedBrandProducts, setSelectedCategoryProducts,setSearchedProductData, setLoading) => {
    setLoading(true);
    setSelectedCategoryProducts([]);
    setSearchedProductData([]);
    const brand = brandId;
    try {
        console.log(`Fetching brand data for brandId: ${brand}`);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getProduct`, {
            params: { brand }
        });
        if (response.data && response.data.products && Array.isArray(response.data.products)) {
            //console.log('Brand data received:', response.data.products);
            setSelectedBrandProducts(response.data.products);
        } else {
            console.error('Unexpected response format:', response.data);
            setSelectedBrandProducts([]);
        }
    } catch (error) {
        console.error('Error fetching brand products:', error);
        setSelectedBrandProducts([]);
    } finally {
        setLoading(false);
    }
};
