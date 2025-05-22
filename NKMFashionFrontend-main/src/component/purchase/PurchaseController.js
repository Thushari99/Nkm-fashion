import axios from 'axios';
import { toast } from 'react-toastify';

//HANDLE SEARCH PRODUCT
export const handleProductSearch = async (e, setSearchTerm, setFilteredProducts, warehouse) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);
    if (keyword.length > 0) {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchProductByName`, {
                params: {
                    name: keyword,
                    warehouse: warehouse,
                },
            });
            setFilteredProducts(response.data.products);
            if (response.data && Array.isArray(response.data.products)) {
                setFilteredProducts(response.data.products);
            } else {
                console.error('Unexpected response format:', response.data);
                setFilteredProducts([]);
            }
        } catch (error) {
            setFilteredProducts([]);
        }
    }
};

// HANDLE SEARCH SUPPLIER
export const handleSuplierSearch = async (e, setSearchSuplier, setFilteredSuplier) => {
    const keyword = e.target.value;
    setSearchSuplier(keyword);
    if (keyword.length > 0) {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchSupplier`, {
                params: { keyword }
            });
            setFilteredSuplier(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setFilteredSuplier([]);
        }
    } else {
        setFilteredSuplier([]);
    }
};

//HANDLE WAREHOUSE CHANGE
export const handleWarehouseChange = (e, setWarehouse, fetchProductDataByWarehouse, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading) => {
    const selectedWarehouse = e.target.value;
    setWarehouse(selectedWarehouse);
    if (selectedWarehouse) {
        fetchProductDataByWarehouse(
            selectedWarehouse,
            setProductData,
            setSelectedCategoryProducts,
            setSelectedBrandProducts,
            setSearchedProductData,
            setLoading
        );
    } else {
        setProductData([]);
    }
};

//HANDLE CUSTOMER SELECT
export const handleSuplierSelect = (suplier, setSelectedSuplier, setSearchSuplier, setFilteredSuplier) => {
    setSelectedSuplier(suplier);
    setSearchSuplier(suplier.name);
    setFilteredSuplier([]);
}

// HANDLE PRODUCT SELECTION
export const handleProductSelect = (product, setSelectedProduct, setSearchTerm, setFilteredProducts) => {
    if (product.ptype === 'Variation' && product.variationValues) {
        // Set the product with a variation
        setSelectedProduct((prevProducts) => {
            const existingProductWithSameVariation = prevProducts.find(
                p => p._id === product._id && p.selectedVariation === Object.keys(product.variationValues)[0]
            );
            if (existingProductWithSameVariation) {
                // If product with the same variation already exists, return the previous state
                alert(`The variation "${Object.keys(product.variationValues)[0]}" is already added.`);
                return prevProducts;
            }
            return [
                ...prevProducts,
                {
                    ...product,
                    selectedVariation: Object.keys(product.variationValues)[0],
                    barcodeFormat: product.barcode,
                    barcodeQty: 0,
                },
            ];
        });
    } else {
        // Handle normal product without variations
        setSelectedProduct((prevProducts) => {
            const existingProduct = prevProducts.find(p => p._id === product._id);
            if (existingProduct) {
                alert("This product is already added.");
                return prevProducts;
            }
            return [
                ...prevProducts,
                {
                    ...product,
                    barcodeFormat: product.barcode,
                    barcodeQty: 0,
                },
            ];
        });
    }
    setSearchTerm('');
    setFilteredProducts([]);
};

//HANDLE VARIATION CHANGE
export const handleVariationChange = (index, variation, setSelectedProduct) => {
    setSelectedProduct((prevProducts) =>
        prevProducts.map((product, i) => {
            if (i === index) { // Use index to find the correct product instance
                const productWithSameVariation = prevProducts.find(
                    (p, j) => j !== index && p._id === product._id && p.selectedVariation === variation
                );

                if (productWithSameVariation) {
                    alert(`The variation "${variation}" is already added.`);
                    return product;
                }

                const stockQty = product.variationValues[variation]?.productQty || 0;
                let newPurchaseQty = product.barcodeQty || 1;

                return {
                    ...product,
                    selectedVariation: variation,
                    barcodeQty: newPurchaseQty
                };
            }
            return product;
        })
    );
};


// CALCULATE SINGLE & VARIATION PRODUCT QTY
export const getQty = (product, selectedVariation) => {
    // If the product has variations
    if (product.variationValues && selectedVariation) {
        const variationQty = Number(product.variationValues[selectedVariation]?.productQty);
        console.log("qty check ", variationQty)
        return !isNaN(variationQty) && variationQty > 0 ? variationQty : 0;
    }
    const singleProductQty = Number(product.productQty);
    console.log("qty check ", singleProductQty)
    return !isNaN(singleProductQty) && singleProductQty > 0 ? singleProductQty : 0;
};


// CALCULATE SINGLE & VARIATION PRODUCT PRICE
export const getPriceRange = (product, selectedVariation) => {
    if (product.variationValues) {
        // If a variation is selected, return the price of that variation
        if (selectedVariation && product.variationValues[selectedVariation]) {
            const variationPrice = Number(product.variationValues[selectedVariation].productCost);
            return !isNaN(variationPrice) ? `${variationPrice}` : 'Price not available';
        }
        // Otherwise, return the minimum price of all variations
        const prices = Object.values(product.variationValues)
            .map(variation => Number(variation.productCost))
            .filter(price => !isNaN(price));

        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            return minPrice;
        }
    }
    const singlePrice = Number(product.productCost);
    return !isNaN(singlePrice) && singlePrice > 0 ? `${singlePrice}` : 'Price not available';
};

//GET TAX
export const getTax = (product, selectedVariation) => {
    if (product.variationValues && selectedVariation && product.variationValues[selectedVariation]) {
        const variationTax = Number(product.variationValues[selectedVariation].orderTax);
        return !isNaN(variationTax) ? variationTax : 0;
    }
    return 0;
};

//REMOVE PRODUCT FROM LIST
export const handleDelete = (index, selectedProduct, setSelectedProduct) => {
    const updatedProducts = selectedProduct.filter((_, i) => i !== index); // Exclude the product at the given index
    setSelectedProduct(updatedProducts); // Update the state with the new product list
};


// HANDLE QUANTITY CHANGING
export const handleQtyChange = (index, selectedVariation, setSelectedProduct, change, isInputChange = false) => {
    setSelectedProduct((prevProducts) => {
        return prevProducts.map((product, i) => {
            if (i === index) { // Find the product at the current index
                console.log(`Updating product at index ${index}`);

                // For variation products
                if (product.variationValues && selectedVariation) {
                    const variation = product.variationValues[selectedVariation];
                    const currentQty = variation?.barcodeQty || 1; // Default value should be 1

                    console.log(`Selected Variation: ${selectedVariation}`);
                    console.log(`Current Quantity (before update): ${currentQty}`);

                    // Determine the new quantity
                    let updatedQty;
                    if (isInputChange) {
                        // If it's an input change, update directly with the value
                        updatedQty = Math.max(1, Math.min(change, variation.productQty)); // Ensure it's within stock limits
                    } else {
                        // Increment or decrement
                        updatedQty = Math.max(1, currentQty + change); // Ensure it doesn't go below 1
                    }

                    console.log(`Updated Quantity (after change): ${updatedQty}`);
                    return {
                        ...product,
                        barcodeQty: updatedQty, // Update the product's barcodeQty
                        variationValues: {
                            ...product.variationValues,
                            [selectedVariation]: {
                                ...variation,
                                barcodeQty: updatedQty // Update at the variation level
                            }
                        }
                    };
                }
                // For single products
                else {
                    const currentQty = product.barcodeQty || 1; // Default value should be 1

                    console.log(`Current Quantity (before update): ${currentQty}`);

                    // Determine the new quantity
                    let updatedQty;
                    if (isInputChange) {
                        // If it's an input change, update directly with the value
                        updatedQty = Math.max(1, Math.min(change, product.productQty)); // Ensure it's within stock limits
                    } else {
                        // Increment or decrement
                        updatedQty = Math.max(1, currentQty + change); // Ensure it doesn't go below 1
                    }

                    console.log(`Updated Quantity (after change): ${updatedQty}`);
                    return { ...product, barcodeQty: updatedQty }; // Update at the product level
                }
            }
            return product; // Return unchanged product
        });
    });
};


//HANDLE DISCOUNT TYPE
export const handleDiscount = (e, discountType, setDiscount) => {
    if (!discountType) {
        alert('Please select a discount type first.');
        return;
    }
    const value = e.target.value;
    if (discountType === 'percentage') {
        const numericValue = parseFloat(value);
        if (numericValue < 1 || numericValue > 100) {
            alert('Please enter a percentage value between 1 and 100.');
            return;
        }
    }
    setDiscount(value);
};


//HANDLE PREVIEW
export const handlePreview = (selectedProduct, grandTotal, paymentStatus, paymentType, orderStatus, discountType, discount, shipping, setSavedProducts) => {
    if (!selectedProduct || selectedProduct.length === 0) {
        console.error('No selected products to preview.');
        return;
    }
    const productsToSave = selectedProduct.map(product => {
        const price = getPriceRange(product, product.selectedVariation);
        const quantity = product.barcodeQty || 1;
        const taxRate = product.oderTax ? product.oderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const subtotal = (price * quantity) + (price * quantity * taxRate);

        return {
            name: product.name,
            quantity,
            price,
            subtotal,
            selectedVariation: product.selectedVariation,
            tax: taxRate * 100,
            discount,
            shipping,
            grandTotal: Number(grandTotal) || 0,
            pStatus: paymentStatus,
            pType: paymentType,
            productStatus: orderStatus
        };
    });
    setSavedProducts(productsToSave);
};


//HANDLE SAVE PRODUCT
export const handleSave = async (grandTotal, orderStatus, paymentStatus, paymentType, shipping, discountType, discount, tax, warehouse, selectedSuplier, selectedProduct, invoiceNumber, date, setError, setResponseMessage, setProgress,navigate) => {
    setError('')
    setResponseMessage('');
    setProgress(true)

    const numberRegex = /^[0-9]*(\.[0-9]+)?$/; // Regex for numeric values (integer or float)
    if (!numberRegex.test(tax)) {
        setError('Tax must be a valid number');
        setProgress(false)
        return;
    }
    if (!numberRegex.test(discount)) {
        setError('Discount must be a valid number');
        setProgress(false)
        return;
    }
    if (!numberRegex.test(shipping)) {
        setError('Shipping must be a valid number');
        setProgress(false)
        return;
    }
    if (!selectedSuplier || !selectedSuplier.name) {
        setError('Supplier information is required');
        setProgress(false)
        return;
    }
    if (!date) {
        setError('Date is required');
        setProgress(false)
        return;
    }
    if (!paymentStatus) {
        setError('Payment Status is required');
        setProgress(false)
        return;
    }
    if (!warehouse) {
        setError('Warehouse is required');
        setProgress(false)
        return;
    }

    const totalAmount = Number(grandTotal) || 0;
    const paidAmount = paymentStatus.toLowerCase() === 'paid' ? grandTotal : 0.00;

    const commonPurchaseData = {
        // refferenceId: referenceId,
        invoiceNumber,
        date,
        supplier: selectedSuplier.name,
        warehouse: warehouse ? warehouse : 'Unknown',
        tax,
        discountType: discountType ? discountType : 'fixed',
        discount,
        shipping,
        paymentStatus,
        paymentType: paymentType ? paymentType : 'cash',
        orderStatus: orderStatus ? orderStatus : 'ordered',
        paidAmount,
        grandTotal: totalAmount,
    };

    // Create products data array
    const productsData = selectedProduct.map(product => {
        const currentID = product._id;
        const ptype = product.ptype;
        const variationValue = product.selectedVariation;
        const price = getPriceRange(product, product.selectedVariation);
        const quantity = product.barcodeQty || 1;
        const taxRate = product.oderTax ? product.oderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const subtotal = (price * quantity) + (price * quantity * taxRate);

        return {
            currentID,
            ptype,
            variationValue: variationValue ? variationValue : 'No variations',
            name: product.name,
            price,
            quantity,
            taxRate,
            subtotal,
        };
    });

    // Combine common sale data with products data
    const finalPurchaseData = {
        ...commonPurchaseData,
        productsData,
    };

    try {
        console.log('purchase data ', finalPurchaseData)
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createPurchase`, finalPurchaseData);
        console.log('Response:', response.data);
         toast.success(
            response.data.message || 'Purchase created successfully!',
                     { autoClose: 2000 },
                     { className: "custom-toast" }
                   );
        // await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate('/viewPurchase', { state: { refresh: true } });
    } catch (error) {
        console.error('Error creating Purchase:', error);
        if (error.response) {
            console.error('Error details:', error.response.data);
            toast.error(
               'An error occurred on the server',
                         { autoClose: 2000 },
                         { className: "custom-toast" }
                       );
        } else if (error.request) {
            console.error('No response received:', error.request);
            toast.error(
                'No response received from server. Please try again later.',
                          { autoClose: 2000 },
                          { className: "custom-toast" }
                        );
        } else {
            console.error('Request setup error:', error.message);
            toast.error(
                error.message || 'An unexpected error occurred.',
                          { autoClose: 2000 },
                          { className: "custom-toast" }
                        );
        }
    }
    finally {
        setProgress(false); // Hide loading bar
    }
};

//HANDLE THE RETURN OF PURCHASE
export const handleReturnPurchase = async (grandTotal, paidAmount, note, warehouse, supplier, selectedProduct, date, _id, setError, setResponseMessage, setProgress, navigate) => {
    setProgress(true)

    if (!note) {
        toast.error('Reason is Required',{ autoClose: 2000 },{ className: "custom-toast" });
        setProgress(false)
        return;
    }
    const commonPurchaseData = {
        // refferenceId: referenceId,
        date,
        supplier,
        warehouse: warehouse || 'Unknown',
        grandTotal,
        paidAmount,
        note
    };
    // Create products data array
    const productsData = selectedProduct.map(product => {
        const currentID = product.currentID;
        const variationValue = product.variationValue;
        const price = product.price;
        const ptype = product.ptype;
        const quantity = product.quantity;
        const taxRate = product.taxRate * 100;
        const subtotal = product.subtotal;

        return {
            currentID,
            variationValue,
            name: product.name,
            price,
            ptype,
            quantity,
            taxRate,
            subtotal,
        };
    });

    // Combine common sale data with products data
    const finalPurchaseData = {
        ...commonPurchaseData,
        productsData,
        _id,
    };

    console.log('purchase return data ', finalPurchaseData)

    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/returnPurchase`, finalPurchaseData);
        console.log('Response:', response.data);
        setError('');
        toast.success(
            response.data.message || 'Purchase returned successfully!',
                     { autoClose: 2000 },
                     { className: "custom-toast" }
                   );
        navigate('/viewPurchaseReturns', { state: { refresh: true } });
    } catch (error) {
        console.error('Error creating sale:', error);
        toast.error(
            error.response?.data?.message || 'Failed to return Purchase',
                     { autoClose: 2000 },
                     { className: "custom-toast" }
                   );
        setError('');
    }
    finally {
        setProgress(false); // Hide loading bar
    }

}

export const handleReturnPurchaseToSupplier = async (
    grandTotal, paidAmount, supplier, date, note, selectedProduct, warehouse, setError, setResponseMessage, setProgress, navigate
) => {
    setProgress(true);

    // Ensure selectedProduct is an array
    if (!Array.isArray(selectedProduct)) {
        setError('Selected product data is invalid.');
        setProgress(false);
        return;
    }

    const commonPurchaseData = {
        note,
        date,
        supplier,
        grandTotal,
        paidAmount,
        warehouse
    };

    const productsData = selectedProduct.map(product => {
        const {warehouse= '', variationValue = '', productCost = 0, returnQty = 0, subtotal = 0, name = 'Unknown', currentID = '', taxRate = 0, ptype = '' } = product;
        return {
            warehouse,
            currentID,
            taxRate,
            ptype,
            variationValue: variationValue || 'No variations',
            name,
            price: productCost,
            quantity: returnQty,
            subtotal,
        };
    });

    const finalPurchaseData = {
        ...commonPurchaseData,
        productsData,
    };

    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/returnPurchaseToSupplier`, finalPurchaseData);
        console.log('Response:', response.data);
        setError('');
        toast.success(
            response.data.message || 'Purchase returned successfully!',
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewPurchaseReturns', { state: { refresh: true } });
    } catch (error) {
        console.error('Error creating sale:', error);
        toast.error(
            error.response?.data?.message || 'Failed to return Purchase',
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        setResponseMessage('');
    } finally {
        setProgress(false); // Hide loading bar
    }
};


//HANDLE UPDATE PURCHASE RETURN
export const handleUpdatePurchaseReturn = async (
    id, grandTotal, paidAmount,  warehouse, supplier,
    productData, date, note, setError, setResponseMessage, setProgress, navigate
) => {
    setResponseMessage('');
    setError('');
    setProgress(true);

    // Validate each field and set error if any required field is missing or invalid
    if (!Array.isArray(productData)) {
        setError('Invalid purchase return data format. Expected an array.');
        setProgress(false);
        return;
    }

    const totalAmount = Number(grandTotal) || 0;
    const commonSaleData = {
        date,
        supplier,
        warehouse: warehouse || null,
        paidAmount,
        grandTotal: totalAmount,
        note
    };

    // Create products data array
    const productsData = productData.map(product => {
        const currentID = product.currentID;
        const variationValue = product.variationValue;
        const price = product.price;
        const ptype = product.ptype;
        const quantity = product.quantity || 1;
        const taxRate = product.taxRate;
        const subtotal = product.subtotal;

        return {
            currentID,
            variationValue,
            name: product.name,
            price,
            ptype,
            quantity,
            taxRate,
            subtotal,
        };
    });

    const updatedPurchaseReturnData = {
        ...commonSaleData,
        productsData,
    };

    console.log('Updated PURCHASE Return Data:', updatedPurchaseReturnData);
    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updatePurchaseReturn/${id}`, updatedPurchaseReturnData);
        console.log('Response:', response.data);
        toast.success(
            response.data.message,
                     { autoClose: 2000 },
                     { className: "custom-toast" }
                   );
            navigate ('/viewPurchaseReturns');
    } catch (error) {
        console.error('Error updating purchase return:', error);
        if (error.response) {
            console.error('Error details:', error.response.data);
            // Check for specific backend error messages
            if (error.response.data.errors) {
                const messages = error.response.data.errors.map(err => err.msg).join(', ');
                toast.error(
                    messages || 'An error occurred on the server',
                             { autoClose: 2000 },
                             { className: "custom-toast" }
                           );
            } else {
                toast.error(
                    error.response.data.message || 'An error occurred on the server',
                             { autoClose: 2000 },
                             { className: "custom-toast" }
                           );
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
            toast.error(
                'No response received from server. Please try again later.',
                         { autoClose: 2000 },
                         { className: "custom-toast" }
                       );
        } else {
            console.error('Request setup error:', error.message);
            toast.error(
                error.message || 'An unexpected error occurred.',
                         { autoClose: 2000 },
                         { className: "custom-toast" }
                       );
        }
    } finally {
        setProgress(false); // Hide loading bar
    }
};

//HANDLE UPDATE PURCHASE 
export const handleUpdatePurchase = async (
    id, grandTotal, orderStatus, paymentStatus, paidAmount, paymentType, shipping,
    discountType, discount, tax, warehouse, selectedSuplier, invoiceNumber,
    productData, date, setError, setResponseMessage, setProgress, navigate
) => {
    setResponseMessage('')
    setError('')
    setProgress(true)

    if (!Array.isArray(productData)) {
        setError('Invalid sale return data format. Expected an array.');
        setProgress(false)
        return;
    }
    const numberRegex = /^[0-9]*(\.[0-9]+)?$/; // Regex for numeric values (integer or float)
    if (!numberRegex.test(tax)) {
        setError('Tax must be a valid number');
        setProgress(false)
        return;
    }
    if (!numberRegex.test(discount)) {
        setError('Discount must be a valid number');
        setProgress(false)
        return;
    }
    if (!numberRegex.test(shipping)) {
        setError('Shipping must be a valid number');
        setProgress(false)
        return;
    }
    if (!date) {
        setError('Date is required');
        setProgress(false)
        return;
    }
    if (!paymentStatus) {
        setError('Payment Status is required');
        setProgress(false)
        return;
    }
    if (!warehouse) {
        setError('Warehouse is required');
        setProgress(false)
        return;
    }
    if (!paymentType) {
        setError('Payment is required');
        setProgress(false)
        return;
    }

    const totalAmount = Number(grandTotal) || 0;
    const PaidAmount = paymentStatus?.toLowerCase() === 'paid' ? totalAmount : 0;
    const commonSaleData = {
        date,
        selectedSuplier,
        warehouse: warehouse ? warehouse : 'Unknown',
        invoiceNumber: invoiceNumber ? invoiceNumber : '',
        tax,
        discountType: discountType ? discountType : 'fixed',
        discount,
        shipping,
        paymentStatus,
        paymentType: paymentType ? paymentType : 'cash',
        orderStatus: orderStatus ? orderStatus : 'ordered',
        paidAmount: PaidAmount,
        grandTotal: totalAmount,
    };

    // Create products data array
    const productsData = productData.map((product, index) => {
        const currentID = product.currentID;
        const variationValue = product.variationValue;
        const ptype = product.ptype;
        const price = product.price;
        const quantity = product.quantity || 1;
        const taxRate = product.taxRate
        const subtotal = product.subtotal;

        // Debugging: Log product quantity and other details
        console.log(`Product ${index + 1}: Quantity = ${quantity}, Name = ${product.name}, Price = ${price}, Subtotal = ${subtotal}`);

        return {
            currentID,
            variationValue: variationValue ? variationValue : 'No variations',
            ptype,
            name: product.name,
            price,
            quantity,
            taxRate,
            subtotal,
        };
    });

    const updatedSaleData = {
        ...commonSaleData,
        productsData,
    };

    try {
        console.log(updatedSaleData)
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updatePuchase/${id}`, updatedSaleData);
        toast.success(
            response.data.message || 'Purchase created successfully!',
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewPurchase');
    } catch (error) {
        console.error('Error updating Purchase:', error);
        if (error.response) {
            console.error('Error details:', error.response.data);
            toast.error(
                error.response.data.message || 'An error occurred on the server',
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } else if (error.request) {
            console.error('No response received:', error.request);
            toast.error(
                'No response received from server. Please try again later.',
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } else {
            console.error('Request setup error:', error.message);
            toast.error(
                error.message || 'An unexpected error occurred.',
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        }
    }
    finally {
        setProgress(false); // Hide loading bar
    }
};

//HANDLE WAREHOUSE CHANGE
export const handleWarehouseChangeProduct = (
    e,
    setWarehouse,
    existingWarehouse, // This is saleProduct.warehouse for editing
    fetchProductDataByWarehouse,
    setProductData,
    setSelectedCategoryProducts,
    setSelectedBrandProducts,
    setSearchedProductData,
    setLoading,
    warehouseList // Add warehouse list containing warehouse names and IDs
) => {
    const selectedWarehouseId = e ? e.target.value : existingWarehouse;
    
    setWarehouse(selectedWarehouseId);

    fetchProductDataByWarehouse(
        selectedWarehouseId,
        setProductData,
        setSelectedCategoryProducts,
        setSelectedBrandProducts,
        setSearchedProductData,
        setLoading
    );
};

