
export const fetchProductData = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/findAllProduct`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (err) {
        throw new Error(err.message);
    }
};
