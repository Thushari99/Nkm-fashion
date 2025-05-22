import axios from "axios";
import { getTax, getPriceRange } from '../../component/sales/SaleController';
import { toast } from "react-toastify";

//HANDLE SAVE ADJUSTMENT
export const handleCreateTransfer = async (grandTotal, warehouseFrom, warehouseTo, selectedProduct, date, discountType, discount, shipping, tax, orderStatus, setResponseMessage, setError, navigate) => {
    if (!warehouseFrom || !warehouseTo) {
        alert('Warehouse information is required');
        return;
    }
    if (!date) {
        alert('Date is required');
        return;
    }
    if (!selectedProduct || selectedProduct.length === 0) {
        setResponseMessage('At least one product is required');
        return;
    }


    const commonAdjustmentData = {
        date,
        warehouseFrom,
        warehouseTo,
        grandTotal,
        discountType,
        discount,
        shipping,
        tax,
        orderStatus,
    };

    // Create products data array
    const productsData = selectedProduct.map(product => {
        const currentID = product._id;
        const ptype = product.ptype;
        const variationValue = product.selectedVariation || product.variationValues[0];
        const price = getPriceRange(product, product.selectedVariation);
        const quantity = product.barcodeQty || 1;
        const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const subtotal = (price * quantity) + (price * quantity * taxRate);
        const warehouse = product.warehouseId || null;

        return {
            currentID,
            ptype,
            variationValue,
            name: product.name,
            price,
            quantity,
            taxRate,
            subtotal,
            warehouse,
        };
    }).filter(product => product); // Filter out any invalid products

    // Ensure there are valid products
    if (productsData.length === 0) {
        setResponseMessage('No valid products found');
        return;
    }
    // Combine common sale data with products data
    const finalTransferData = {
        ...commonAdjustmentData,
        productsData,
    };

    console.log('Final transfer Data:', finalTransferData);

    //Uncomment and adjust the URL as needed for actual API requests
    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createTransfer`, finalTransferData);
        console.log('Response:', response.data);
        toast.success(
            "Transfer created successfully!",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewTransfer');
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create Transfer';
        toast.error(
            errorMessage,
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        console.error('Error creating Transfer:', errorMessage);
    }
};

//HANDLE UPDATE THE TRANSFER
export const handleUpdateTransfer = async (
    id, grandTotal, orderStatus, discountType, discount, tax, shipping, warehouseFrom, warehouseTo, date, taxRate, productData, setResponseMessage, setError, navigate) => {
    console.log('saleReturnData:', productData);
    // Validate required fields
    if (!orderStatus || !warehouseFrom || !warehouseTo || !date) {
        setError('Please fill in all required fields.');
        return;
    }

    // Validate productData
    if (!productData || productData.length === 0) {
        setError('At least one product is required.');
        return;
    }
    const commonTransferData = {
        date,
        warehouseFrom,
        warehouseTo,
        tax,
        discountType,
        discount,
        shipping,
        orderStatus,
        grandTotal

    };

    // Prepare products data array with validation
    const productsData = productData.map(product => {
        if (!product.currentID || !product.price || !product.quantity) {
            setError('Product data is incomplete or invalid.');
            return null; // Skip invalid product
        }

        const currentID = product.currentID;
        const ptype = product.ptype;
        const variationValue = product.variationValue;
        const AdjustmentType = 'addition';
        const price = product.price;
        const quantity = product.quantity;
        const taxRate = product.taxRate;
        const subtotal = (price * quantity) + (price * quantity * taxRate);
        const warehouse = warehouseFrom || null;

        return {
            currentID,
            ptype,
            AdjustmentType,
            variationValue,
            name: product.name,
            price,
            quantity,
            taxRate,
            subtotal,
            warehouse,
        };
    }).filter(Boolean); // Filter out invalid products

    // Ensure productsData is not empty
    if (productsData.length === 0) {
        setError('No valid products found.');
        return;
    }

    // Prepare final data for update
    const updatedTransferData = {
        ...commonTransferData,
        productsData,
    };

    console.log('Updated transfer Data:', updatedTransferData);

    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateTransfer/${id}`, updatedTransferData);
        console.log('Response:', response.data);

        // Handle successful response
        toast.success(
            "Transfer updated successfully!",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewTransfer');
    } catch (error) {
        console.error('Error updating transfer:', error);

        // Handle error response
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update transfer';
        toast.success(
            errorMessage,
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
    }
};


