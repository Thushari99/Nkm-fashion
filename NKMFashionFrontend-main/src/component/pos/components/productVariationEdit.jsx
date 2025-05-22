import React, { useState } from 'react';
import popSound from '../../../../src/audio/b.mp3';
import { useCurrency } from '../../../context/CurrencyContext';

const ProductVariationModal = ({ selectedProduct, setSelectVariation, productBillingHandling, setProductBillingHandling, setProductKeyword, inputRef }) => {
    const [selectedVariation, setSelectedVariation] = useState('');
    const { currency } = useCurrency();

    const playSound = () => {
        const audio = new Audio(popSound);
        audio.play().catch(error => {
            console.error('Audio play failed:', error);
        });
    };

    // Prevent rendering if selectedProduct or its variationValues are missing
    if (!selectedProduct || !selectedProduct.variationValues || typeof selectedProduct.variationValues !== 'object') {
        console.error("Invalid selectedProduct:", selectedProduct);
        return null;
    }

    const handleAddToCart = () => {
        if (!selectedProduct || !selectedVariation) {
            alert('Please select a variation.');
            return;
        }

        const variationDetails = selectedProduct.variationValues[selectedVariation];

        if (!variationDetails) {
            alert('Invalid variation selection.');
            return;
        }

        const isProductVariationAlreadyInCart = productBillingHandling.some(
            (p) => p.name === selectedProduct.name && p.selectedVariation === selectedVariation
        );

        if (isProductVariationAlreadyInCart) {
            alert('This variation is already in the cart.');
            return;
        }

        playSound();

        setProductBillingHandling((prev) => {
            const updatedBilling = prev.filter((p) => !(p.name === selectedProduct.name && p.ptype === 'Base'));

            const newEntry = {
                ...selectedProduct,
                price: variationDetails.productPrice,
                qty: 1,
                stokeQty: variationDetails.productQty,
                code: variationDetails.code,
                orderTax: variationDetails.orderTax,
                productCost: variationDetails.productCost,
                stockAlert: variationDetails.stockAlert,
                ptype: 'Variation',
                selectedVariation, // Include selectedVariation here
            };

            updatedBilling.push(newEntry);
            return updatedBilling;
        });

        setSelectVariation(false);
        setProductKeyword('');
        if (inputRef?.current) inputRef.current.focus();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {selectedProduct && (
                <div className="bg-white w-[600px] h-[700px] p-6 rounded-md shadow-lg z-50">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">
                        Select Variation for {selectedProduct.name}
                    </h2>
                    <p>
                        <strong className="px-2 py-2 text-m text-gray-800">Variation Type:</strong> {selectedProduct.variation}
                    </p>
                    <div className="mb-6">
                        <label htmlFor="variationSelect" className="px-2 py-2 text-m text-gray-800 block text-md font-semibold mb-2">
                            Select {selectedProduct.variation}:
                        </label>
                        <select
                            id="variationSelect"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={selectedVariation || ""}
                            onChange={(e) => setSelectedVariation(e.target.value)}
                        >
                            <option value="" disabled>Select {selectedProduct.variation}</option>
                            {Object.entries(selectedProduct.variationValues)
                                .filter(([_, variationData]) => variationData.productQty > 0)
                                .map(([variationName], index) => (
                                    <option key={index} value={variationName}>
                                        {variationName}
                                    </option>
                                ))}
                        </select>
                    </div>
                    {selectedVariation && selectedProduct.variationValues[selectedVariation] && (
                        <div className="mb-6">
                            <h3 className="text-md font-semibold px-2 py-2 text-m text-gray-800">
                                Selected {selectedProduct.variation} Details:
                            </h3>
                            <ul className="ml-4">
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Price:</strong>{currency} {' '} {selectedProduct.variationValues[selectedVariation].productPrice}</li>
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Quantity:</strong> {selectedProduct.variationValues[selectedVariation].productQty} available</li>
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Code:</strong> {selectedProduct.variationValues[selectedVariation].code}</li>
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Order Tax:</strong> {selectedProduct.variationValues[selectedVariation].orderTax}</li>
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Discount:</strong> {selectedProduct.variationValues[selectedVariation].discount}</li>
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Product Cost:</strong>{currency} {' '} {selectedProduct.variationValues[selectedVariation].productCost}</li>
                                <li className="px-2 py-2 text-m text-gray-800"><strong>Stock Alert:</strong> {selectedProduct.variationValues[selectedVariation].stockAlert}</li>
                            </ul>
                        </div>
                    )}
                    <div className='mt-10'>
                        <button
                            className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                            onClick={() => {
                                setSelectVariation(false);
                                setSelectedVariation(''); // Reset selected variation when closing
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 button-bg-color  text-white rounded-md"
                            onClick={handleAddToCart}
                        >
                            Add To Cart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductVariationModal;
