import axios from "axios";
import { getTax, getPriceRange } from '../sales/SaleController';
import { toast } from "react-toastify";


// HANDLE SAVE ADJUSTMENT
export const handleCreateAdjustment = async (grandTotal, warehouse, selectedProduct, date, setError, setResponseMessage, setProgress, navigate) => {
    setResponseMessage('');
    setError('');
    setProgress(true);

    if (!warehouse) {
        setError('Warehouse is required');
        setProgress(false);
        return;
    }

    if (!date) {
        setError('Date is required');
        setProgress(false);
        return;
    }

    // const referenceId = `ADJ_${Math.floor(1000 + Math.random() * 9000)}`; // Generate ID in the format ADJ_XXXX

    const commonAdjustmentData = {
        date,
        warehouse: warehouse || null,
        grandTotal,
        // refferenceId: referenceId, // Include reference ID in adjustment data
    };

    const productsData = selectedProduct.map(product => {
        const currentID = product._id;
        const ptype = product.ptype;
        const variationValue = product.selectedVariation || product.variationValues[0];
        const AdjustmentType = product.AdjustmentType? product.AdjustmentType : 'addition';
        const price = getPriceRange(product, product.selectedVariation);
        const quantity = product.barcodeQty || 1;
        const taxRate = product.oderTax ? product.oderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const subtotal = (price * quantity) + (price * quantity * taxRate);

        return {
            currentID,
            ptype,
            variationValue: variationValue || 'No variations',
            AdjustmentType,
            name: product.name,
            price,
            quantity,
            taxRate,
            subtotal,
        };
    });

    const finalAdjustmentData = {
        ...commonAdjustmentData,
        productsData,
    };

    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createAdjustment`, finalAdjustmentData);
        console.log('Response:', response.data);
        toast.success(
                        "Adjustment created successfully!",
                        { autoClose: 2000 },
                        { className: "custom-toast" }
                    );
        setTimeout(() => {
            navigate ("/viewAdjustment"); 
        }, 1000);

    } catch (error) {
        console.error('Error creating adjustment:', error);
        if (error.response) {
            console.error('Error details:', error.response.data);
            toast.error("Error creating an adjustment" ,
                            { autoClose: 2000 },
                            { className: "custom-toast" });
        } else if (error.request) {
            console.error('No response received:', error.request);
            toast.error("No response received from server. Please try again later." ,
                            { autoClose: 2000 },
                            { className: "custom-toast" });
        } else {
            console.error('Request setup error:', error.message);
            toast.error(error.message + "An unexpected error occurred." ,
                { autoClose: 2000 },
                { className: "custom-toast" });
        }
    } finally {
        setProgress(false); // Hide loading bar
    }
};


// HANDLE UPDATE ADJUSTMENT
export const handleUpdateAdjustment = async (
    id,
    refferenceId,
    grandTotal,
    warehouse,
    selectedProduct,
    adjustmentTypes,
    date,
    setError,
    setResponseMessage,
    setProgress,
    navigate
  ) => {
    setResponseMessage('');
    setError('');
    setProgress(true);
  
    if (!warehouse) {
      setError('Warehouse information is required');
      setProgress(false);
      return;
    }
  
    if (!date) {
      setError('Date is required');
      setProgress(false);
      return;
    }
  
    const commonAdjustmentData = {
      id,
      date,
      warehouse: warehouse || null,
      grandTotal,
      refferenceId, // Include reference ID in adjustment data
    };
  
    const productsData = selectedProduct.map((product) => {
      const currentID = product.currentID ? product.currentID : product._id;
      const ptype = product.ptype;
      const variationValue = product.variationValue ? product.variationValue : product.selectedVariation;
      const AdjustmentType = product.AdjustmentType
      const price = product.price
        ? product.price
        : getPriceRange(product, product.selectedVariation);
      const quantity = product.quantity;
      const taxRate = product.oderTax? product.oderTax : getTax(product, product.selectedVariation) / 100;
      const subtotal = (price * quantity) + (price * quantity * taxRate);
  
      return {
        currentID,
        ptype,
        variationValue,
        AdjustmentType, 
        name: product.name,
        price,
        quantity,
        taxRate,
        subtotal,
      };
    });
  
    const finalAdjustmentData = {
      ...commonAdjustmentData,
      productsData,
    };
  
    console.log('Updated Adjustment Data:', finalAdjustmentData);
    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateAdjustment/${id}`, finalAdjustmentData);
        console.log('Response:', response.data);
        toast.success(
            "Adjustment updated successfully!",
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        setTimeout(() => {
            navigate ("/viewAdjustment"); 
        }, 1000);
    } catch (error) {
        // Extract and set a meaningful error message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update adjustment';
        // setError(errorMessage);
        console.error('Error updated Adjustment:', errorMessage);
        toast.error("Error updating an adjustment" ,
            { autoClose: 2000 },
            { className: "custom-toast" });
    } finally {
        setProgress(false);
    }
};
