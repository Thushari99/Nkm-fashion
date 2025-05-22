import axios from 'axios';
import { toast } from 'react-toastify';
import { generateBillNumber } from '../pos/utils/invoiceNumber';

export const handleProductSearch = async (e, setSearchTerm, setFilteredProducts, warehouse, saleProductWarehouse) => {
    const keyword = e.target.value;
    const resolvedWarehouse = warehouse ? warehouse : saleProductWarehouse;
    setSearchTerm(keyword);

    if (keyword.length > 0) {
        try {
            console.log('Sending request to search products...');
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchProductByName`, {
                params: {
                    name: keyword,
                    warehouse: resolvedWarehouse?._id || resolvedWarehouse,
                },
            });
            setFilteredProducts(response.data.products);
            console.log('Filtered products set:', response.data.products);
        } catch (error) {
            console.error('Error fetching product:', error);
            setFilteredProducts([]);
        }
    } else {
        setFilteredProducts([]);
        console.log('Search term is empty, cleared filtered products');
    }
};


//HANDLE SEARCH CUSTOMERS
export const handleCustomerSearch = async (e, setSearchCustomer, setFilteredCustomer) => {
    const keyword = e.target.value;
    setSearchCustomer(keyword);
    if (keyword.length > 0) {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchCustomerByName`, {
                params: { name: keyword },
            });
            setFilteredCustomer(response.data.customer); // assuming response data has a customer field
        } catch (error) {
            console.error('Error fetching customer:', error);
            setFilteredCustomer([]);
        }
    } else {
        setFilteredCustomer([]);
    }
};

//HANDLE WAREHOUSE CHANGE
export const handleWarehouseChange = (
    e,
    setWarehouse,
    existingWarehouse, // This is saleProduct.warehouse for editing
    fetchProductDataByWarehouse,
    setProductData,
    setSelectedCategoryProducts,
    setSelectedBrandProducts,
    setSearchedProductData,
    setLoading,
    warehouseList
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


//HANDLE CUSTOMER SELECT
export const handleCustomerSelect = (customer, setSelectedCustomer, setSearchCustomer, setFilteredCustomer) => {
    setSelectedCustomer(customer);
    setSearchCustomer(customer.name);
    setFilteredCustomer([]);
};

// HANDLE PRODUCT SELECTION
export const handleProductSelect = (product, setSelectedProduct, setSearchTerm, setFilteredProducts, warehouse) => {
    console.log('Product selected:', product);
    console.log('Selected warehouse:', warehouse);

    setSelectedProduct((prevProducts) => {
        let updatedProducts = [...prevProducts];

        if (product.ptype === 'Variation' && product.variationValues) {
            console.log('Product has variations:', product.variationValues);

            const existingProductWithSameVariation = prevProducts.find(
                p => p._id === product._id && p.selectedVariation === Object.keys(product.variationValues)[0]
            );
            console.log('Existing product with the same variation:', existingProductWithSameVariation);

            if (existingProductWithSameVariation) {
                alert(`The variation "${Object.keys(product.variationValues)[0]}" is already added.`);
                return prevProducts;
            }

            const newProduct = {
                ...product,
                selectedVariation: Object.keys(product.variationValues)[0],
                barcodeFormat: product.barcode,
                barcodeQty: 0,
                selectedWarehouseId: warehouse?._id || warehouse,
            };
            console.log('New product with variation:', newProduct);

            updatedProducts = [...prevProducts, newProduct];
        } else {
            console.log('Normal product selected, without variations:', product);

            const existingProduct = prevProducts.find(p => p._id === product._id);
            console.log('Existing product:', existingProduct);

            if (existingProduct) {
                alert("This product is already added.");
                return prevProducts;
            }

            const newProduct = {
                ...product,
                barcodeFormat: product.barcode,
                barcodeQty: 0,
                selectedWarehouseId: warehouse?._id || warehouse,
            };
            console.log('New product without variation:', newProduct);

            updatedProducts = [...prevProducts, newProduct];
        }

        console.log('All selected products:', updatedProducts);
        return updatedProducts;
    });

    // Clear search term and reset filtered products
    setSearchTerm('');
    setFilteredProducts([]);
    console.log('Search term cleared and filtered products reset');
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

                if (newPurchaseQty > stockQty) {
                    alert(`Purchase quantity adjusted to the available stock (${stockQty}) for the "${variation}" variation.`);
                    newPurchaseQty = stockQty;
                }

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
            const variationPrice = Number(product.variationValues[selectedVariation].productPrice);
            return !isNaN(variationPrice) ? `${variationPrice}` : 'Price not available';
        }
        // Otherwise, return the minimum price of all variations
        const prices = Object.values(product.variationValues)
            .map(variation => Number(variation.productPrice))
            .filter(price => !isNaN(price));

        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            return minPrice;
        }
    }
    const singlePrice = Number(product.productPrice);
    return !isNaN(singlePrice) && singlePrice > 0 ? `${singlePrice}` : 'Price not available';
};

export const getProductCost = (product, selectedVariation) => {
    if (product.variationValues) {
        // If a variation is selected, return the price of that variation
        if (selectedVariation && product.variationValues[selectedVariation]) {
            const variationPrice = Number(product.variationValues[selectedVariation].productCost);
            return !isNaN(variationPrice) ? `${variationPrice}` : 0;
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
    return !isNaN(singlePrice) && singlePrice > 0 ? `${singlePrice}` : 0;
};

//REMOVE PRODUCT FROM LIST
export const handleDelete = (index, selectedProduct, setSelectedProduct) => {
    // Ensure selectedProduct is an array before performing filter
    if (Array.isArray(selectedProduct)) {
        const updatedProducts = selectedProduct.filter((_, i) => i !== index); // Exclude the product at the given index
        setSelectedProduct(updatedProducts); // Update the state with the new product list
    } else {
        console.error("selectedProduct is not an array:", selectedProduct);
    }
};


// HANDLE QUANTITY CHANGING
export const handleQtyChange = (index, selectedVariation, setSelectedProduct, value) => {
    setSelectedProduct((prevProducts) =>
        prevProducts.map((product, i) => {
            if (i === index) {
                // For variation products
                if (product.variationValues && selectedVariation) {
                    const variation = product.variationValues[selectedVariation];
                    const currentQty = variation?.barcodeQty || 1; // Default value should be 1
                    const stockQty = variation ? variation.productQty : 1; // Stock quantity for the variation

                    let newQty;

                    if (typeof value === "number") {
                        // Increment/Decrement case
                        newQty = Math.max(1, currentQty + value); // Ensure quantity doesn't go below 1
                    } else {
                        // Direct input case
                        const parsedValue = parseInt(value, 10);
                        if (isNaN(parsedValue)) return product; // Ignore invalid input
                        newQty = Math.min(stockQty, Math.max(1, parsedValue)); // Clamp between 1 and stockQty
                    }

                    if (newQty > stockQty) {
                        alert(`Cannot exceed stock quantity of ${stockQty} for this variation.`);
                        return product; // Prevent changing if stock limit is exceeded
                    }

                    return {
                        ...product,
                        barcodeQty: newQty, // Update at the product level
                        variationValues: {
                            ...product.variationValues,
                            [selectedVariation]: {
                                ...variation,
                                barcodeQty: newQty, // Update at the variation level
                            },
                        },
                    };
                }

                // For single products
                else {
                    const currentQty = product.barcodeQty || 1; // Default value should be 1
                    const stockQty = product.productQty || 1; // Stock quantity for the product

                    let newQty;

                    if (typeof value === "number") {
                        // Increment/Decrement case
                        newQty = Math.max(1, currentQty + value); // Ensure quantity doesn't go below 1
                    } else {
                        // Direct input case
                        const parsedValue = parseInt(value, 10);
                        if (isNaN(parsedValue)) return product; // Ignore invalid input
                        newQty = Math.min(stockQty, Math.max(1, parsedValue)); // Clamp between 1 and stockQty
                    }

                    if (newQty > stockQty) {
                        alert(`Cannot exceed stock quantity of ${stockQty} for this product.`);
                        return product; // Prevent changing if stock limit is exceeded
                    }

                    return { ...product, barcodeQty: newQty }; // Update the single product's quantity
                }
            }
            return product; // Return unchanged product
        })
    );
};


//GET TAX
export const getTax = (product, selectedVariation) => {
    if (product.variationValues && selectedVariation && product.variationValues[selectedVariation]) {
        const variationTax = Number(product.variationValues[selectedVariation].orderTax);
        return !isNaN(variationTax) ? variationTax : 0;
    }
    return 0;
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

// CALCULATE SINGLE & VARIATION PRODUCT DISCOUNT
export const getDiscount = (product, selectedVariation) => {
    if (product.variationValues) {
        // If a variation is selected, return the discount of that variation
        if (selectedVariation && product.variationValues[selectedVariation]) {
            const variationDiscount = Number(product.variationValues[selectedVariation].discount);
            return !isNaN(variationDiscount) ? `${variationDiscount}` : 0;
        }
        // Otherwise, return the minimum discount of all variations
        const discounts = Object.values(product.variationValues)
            .map(variation => Number(variation.discount))
            .filter(discount => !isNaN(discount));
        if (discounts.length > 0) {
            const minDiscount = Math.min(...discounts);
            return minDiscount;
        }
    }
    const singleDiscount = Number(product.discount);
    console.log("Single product discount:", singleDiscount); // Added logging
    return !isNaN(singleDiscount) && singleDiscount > 0 ? `${singleDiscount}` : 0;
};


export const handleSave = async (grandTotal, profit, orderStatus, paymentStatus, paymentType, amounts, shipping, discountType, discount, tax, selectedWarehouses, selectedCustomer, selectedProduct, date, preFix, offerPercentage, setInvoiceNumber, setResponseMessage, setError, setProgress, setInvoiceData, note, cashBalance, handlePrintAndClose, shouldPrint = false ) => {

    setResponseMessage('');
    const invoiceNumber = generateBillNumber();
    setInvoiceNumber(invoiceNumber);
    const totalAmount = Number(grandTotal) || 0;
    const profitAmount = Number(profit) || 0;
    let paidAmount = Object.values(amounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const balance = totalAmount - paidAmount;

    const normalizedPaymentStatus = paymentStatus?.toLowerCase();

    // If payment status is "paid" and balance is greater than 0, prevent submission
    if (normalizedPaymentStatus === 'paid' && balance > 0) {
        alert("Payment status is 'Paid', but there's still a balance remaining. Please adjust the payment amount.");
        setProgress(false);
        return;
    }

    // If paid amount exceeds the grand total, set the grand total as the paid amount
    if (paidAmount) {
        if (paidAmount >= totalAmount) {
            paidAmount = grandTotal;
        } else {
            paidAmount = paidAmount;
        }
    }

    const numberRegex = /^[0-9]*(\.[0-9]+)?$/;

    if (!numberRegex.test(tax)) {
        toast.error('Tax must be a valid number', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }
    if (!numberRegex.test(discount)) {
        toast.error('Discount must be a valid number', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }
    if (!numberRegex.test(shipping)) {
        toast.error('Shipping must be a valid number', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }
    if (!selectedCustomer) {
        toast.error('Customer information is required', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }
    if (!date) {
        toast.error('Date is required', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }

    if (typeof date === 'string' && date.length === 10) {
        const now = new Date();
        const [year, month, day] = date.split('-');
    
        // Create a new Date with the selected date and current LOCAL time
        const fullDate = new Date(
            Number(year), Number(month) - 1, Number(day),
            now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()
        );
    
        // Adjust to local timezone by removing timezone offset
        const timezoneOffsetMs = fullDate.getTimezoneOffset() * 60 * 1000;
        const localDate = new Date(fullDate.getTime() - timezoneOffsetMs);
    
        date = localDate.toISOString();  // ISO string in local time
    }
    
    if (!paymentStatus) {
        toast.error('Payment Status is required', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }
    if (!paymentType) {
        toast.error('Payment Type is required', { autoClose: 2000 }, { className: "custom-toast" });
        setProgress(false);
        return;
    }

    const paymentTypesArray = Object.keys(paymentType)
        .filter((type) => paymentType[type] && Number(amounts[type]) > 0)
        .map((type) => ({ type, amount: Number(amounts[type]) }));

    const cashierUsername = sessionStorage.getItem('name');
    const defaultWarehouse = sessionStorage.getItem('defaultWarehouse') || 'Unknown';

    // **Define productsData FIRST**
    const productsData = selectedProduct.map(product => {
        const currentID = product._id;
        const ptype = product.ptype;
        const variationValue = product.selectedVariation;
        const price = product.price || getPriceRange(product, product.selectedVariation);
        const productCost = product.producrCost || getProductCost(product, product.selectedVariation);
        const discount = product.discount || getDiscount(product, product.selectedVariation);
        const specialDiscount = product.specialDiscount || 0;
        const quantity = product.barcodeQty || 1;
        const stockQty = product.productQty - quantity;
        const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const subtotal = ((price - discount - specialDiscount) * quantity) + ((price) * quantity * taxRate);
        const productProfit = (((price - discount - specialDiscount) * quantity) - (productCost * quantity)) || 0;
        const warehouseId = product.selectedWarehouseId || product.warehouseId || defaultWarehouse;

        return {
            currentID,
            ptype,
            variationValue: variationValue || 'No variations',
            name: product.name,
            price,
            discount,
            specialDiscount,
            quantity,
            stockQty,
            taxRate,
            subtotal,
            productProfit,
            warehouse: warehouseId,
        };
    });

    const commonSaleData = {
        date,
        customer: selectedCustomer || 'Unknown',
        warehouse: defaultWarehouse,
        tax,
        discountType: discountType || 'fixed',
        discount,
        shipping,
        paymentStatus,
        paymentType: paymentTypesArray,
        orderStatus: orderStatus || 'ordered',
        paidAmount,
        grandTotal: totalAmount,
        pureProfit: profitAmount,
        cashierUsername: cashierUsername || 'Unknown',
        offerPercentage,
        invoiceNumber,
        note,
        cashBalance
    };

    const finalSaleData = {
        ...commonSaleData,
        productsData,
    };
    try {
        let endpoint = '';
        if (window.location.pathname === '/posSystem') {
            endpoint = '/api/createSale';
            finalSaleData.saleType = 'POS';
        } else if (window.location.pathname === '/createSale') {
            endpoint = '/api/createNonPosSale';
            finalSaleData.saleType = 'Non-POS';
        } else {
            setError('Unknown sale route!');
            setProgress(false);
            return;
        }

        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}${endpoint}`, finalSaleData);
        if (response.data.status === 'success') {
            // Store the invoice data for potential printing
            setInvoiceData(response.data);
            
            // Only print if shouldPrint is true
            if (shouldPrint) {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none'; 
                document.body.appendChild(iframe);
              
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(response.data.html);
                iframeDoc.close();
              
                setTimeout(() => {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    setTimeout(() => document.body.removeChild(iframe), 1000);
                }, 500);
            }
            
            handlePrintAndClose();
            toast.success('Sale created successfully!', { 
                autoClose: 2000, 
                className: "custom-toast" 
            });
        }
    } catch (error) {
        console.error('Error creating sale:', error);
        if (error.response) {
            const errorMessage = error.response.data.message;
            if (errorMessage === "Please choose products from the default warehouse.") {
                alert(errorMessage);
            } else {
                toast.error(errorMessage || 'An error occurred on the server', { autoClose: 2000, className: "custom-toast" });
            }
        } else if (error.request) {
            toast.error('No response received from server. Please try again later.', { autoClose: 2000, className: "custom-toast" });
        } else {
            toast.error(error.message || 'An unexpected error occurred.', { autoClose: 2000, className: "custom-toast" });
        }
        setProgress(false);
    } finally {
        console.log("type of setProgress", setProgress)
        setProgress(false);
    }
};

//HANDLE UPDATE SALE
export const handleUpdateSale = async (
    id, grandTotal, profit, orderStatus, paymentStatus, paymentType, amounts, shipping,
    discountType, discount, tax, warehouse, selectedCustomer,
    productData, date, offerPercentage, setError, setResponseMessage, setProgress, navigate
) => {
    setError('')
    setResponseMessage('');
    setProgress(true)

    if (!Array.isArray(productData)) {
        console.error('Invalid productData:', productData);
        setError('Invalid sale data format. Expected an array.');
        setProgress(false);
        return;
    }

    const totalAmount = Number(grandTotal) || 0;
    const profitAmount = Number(profit) || 0
    const paidAmount = Object.values(amounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const balance = totalAmount - paidAmount;

    const normalizedPaymentStatus = paymentStatus?.toLowerCase();

    // If payment status is "paid" but balance is greater than 0, prevent update
    if (normalizedPaymentStatus === 'paid' && balance > 0) {
        alert("Payment status is 'Paid', but there's still a balance remaining. Please adjust the payment amount.");
        setProgress(false);
        return; // Prevent submission and keep the pop-up open
    }

    // Ensure payment status is updated to "paid" when paid amount equals the grand total
    const updatedPaymentStatus = paidAmount >= totalAmount ? 'paid' : paymentStatus;

    const cashierUsername = sessionStorage.getItem('cashierUsername');

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

    if (!paymentType || !Array.isArray(paymentType) || paymentType.length === 0) {
        console.error("Error: paymentType is undefined or empty", paymentType);
        return;
    }

    const formattedPaymentType = paymentType.map(({ type, amount }) => ({
        type,
        amount: Number(amount), // Ensure amount is converted to number
    })).filter(({ amount }) => amount > 0); // Keep only valid amounts

    const commonSaleData = {
        date,
        selectedCustomer,
        warehouse: warehouse || null,
        tax,
        discountType,
        discount,
        shipping,
        paymentStatus: updatedPaymentStatus,
        paymentType: formattedPaymentType,
        orderStatus,
        paidAmount,
        pureProfit: profitAmount,
        grandTotal: totalAmount,
        cashierUsername: cashierUsername ? cashierUsername : 'unknown',
        offerPercentage
    };

    // Create products data array
    const productsData = productData.map(product => {
        const currentID = product.currentID ? product.currentID : product._id;
        const ptype = product.ptype;
        const variationValue = product.variationValue ? product.variationValue : product.selectedVariation;
        const price = product.productPrice ? product.productPrice : product.price || getPriceRange(product, product.selectedVariation);
        const productCost = product.producrCost ? product.producrCost : getProductCost(product, product.selectedVariation);
        const quantity = product.quantity || 1;
        const discount = getDiscount(product, product.selectedVariation) || 0;
        const specialDiscount = product.specialDiscount || 0;
        const taxRate = product.taxRate ? product.taxRate : product.taxRate ? product.taxRate : getTax(product, product.selectedVariation) / 100;
        const subtotal = ((price - discount - specialDiscount) * quantity) + ((price) * quantity * taxRate);
        const productProfit = (((price - discount - specialDiscount) * quantity) - (productCost * quantity)) || 0;
        const warehouse = product.warehouse || null;

        return {
            currentID,
            ptype,
            variationValue: variationValue ? variationValue : 'No variations',
            name: product.name,
            price,
            productProfit,
            quantity,
            discount,
            specialDiscount,
            taxRate,
            subtotal,
            warehouse,
        };
    });

    const updatedSaleData = {
        ...commonSaleData,
        productsData,
    };

    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateSale/${id}`, updatedSaleData);
        toast.success(
            'Sale updated successfully!',
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewSale');
    } catch (error) {
        console.error('Error updating sale:', error);
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
        setProgress(false)
    }
    finally {
        setProgress(false);
    }
};

//HANDLE THE RETURN OF SALE
export const handleReturnSale = async (id, grandTotal, paidAmount, returnAmount, warehouse, customer, selectedProduct, date, note, setError, setResponseMessage, setProgress, navigate) => {
    setError('')
    setResponseMessage('')
    setProgress(true)

    // Validate that setLoading is a function before invoking it
    if (typeof setLoading === 'function') {
        setProgress(true);
    } else {
        console.warn('setLoading is not a function. Skipping setLoading invocation.');
    }

    const commonSaleData = {
        id,
        date,
        customer,
        warehouse: warehouse || null,
        grandTotal,
        paidAmount,
        returnAmount,
        note
    };

    // Create products data array
    const productsData = selectedProduct.map(product => {
        const currentID = product.currentID;
        const ptype = product.ptype;
        const variationValue = product.variationValue;
        const price = product.price;
        const quantity = product.quantity;
        const returnQty = product.returnQty ? product.returnQty : 0;
        const taxRate = product.taxRate * 100; // Assuming the rate is in percentage
        const subtotal = product.subtotal;
        const discount = product.discount;
        const warehouse = product.warehouse || null;
        const restocking = product.restocking;

        return {
            currentID,
            variationValue,
            ptype,
            name: product.name,
            price,
            quantity,
            returnQty,
            discount,
            taxRate,
            subtotal,
            warehouse,
            restocking
        };
    });

    // Combine common sale data with products data
    const finalSaleData = {
        ...commonSaleData,
        productsData,
    };
    console.log('Final sale data:', finalSaleData);
    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/returnSale`, finalSaleData);
        toast.success(
            response.data.message || 'Sale returned successfully!',
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewSaleReturns');
    } catch (error) {
        console.error('Error returning sale:', error);
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
    } finally {
        // Validate again before invoking setLoading in finally block
        if (typeof setLoading === 'function') {
            setProgress(false);
        }
        setProgress(false);
    }
};

//HANDLE UPDATE SALE RETURN
export const handleUpdateSaleReturn = async (
    id, total, paymentStatus, PaidAmount,
    warehouse, selectedCustomer,
    productData, date, note, setError, setResponseMessage, setProgress, navigate
) => {
    setError('')
    setResponseMessage('');
    setProgress(true)
    console.log('saleReturnData:', productData);

    if (!Array.isArray(productData)) {
        setError('Invalid sale return data format. Expected an array.');
        return;
    }

    const grandTotal = total;
    const totalAmount = Number(grandTotal) || 0;

    const commonSaleData = {
        date,
        selectedCustomer,
        warehouse: warehouse || null,
        paidAmount: PaidAmount,
        grandTotal: totalAmount,
        note
    };

    // Create products data array
    const productsData = productData.map(product => {
        const currentID = product.currentID;
        const ptype = product.ptype;
        const variationValue = product.variationValue;
        const price = product.price;
        const quantity = product.quantity || 1;
        const taxRate = product.taxRate
        const subtotal = product.subtotal;

        return {
            currentID,
            ptype,
            variationValue,
            name: product.name,
            price,
            quantity,
            taxRate,
            subtotal,
        };
    });

    const updatedSaleReturnData = {
        ...commonSaleData,
        productsData,
    };

    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateReturnSale/${id}`, updatedSaleReturnData);
        console.log('Response:', response.data);
        toast.success(
            response.data.message,
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewSale');
    } catch (error) {
        console.error('Error updating return sale:', error);
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
        setProgress(false)
    }
    finally {
        // setLoading(false); // Hide loading bar
    }
};
