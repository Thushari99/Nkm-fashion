import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';
import ProductIcon from "../../img/product icon.jpg";
import { handleExportPdf } from '../utill/ExportingPDF';

const QuantityAlertTable = ({ combinedProductData, loading, error,}) => {
    const { currency } = useCurrency();

     // Get price range for a product
     const getPriceRange = (product) => {
        if (product.variationValues) {
            const prices = Object.values(product.variationValues)
                .map(variation => Number(variation.productPrice))
                .filter(price => !isNaN(price));
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`;
            }
        }
        const singlePrice = Number(product.productPrice);
        return !isNaN(singlePrice) && singlePrice > 0 ? `${singlePrice}` : 'Price not available';
    };

    // Calculate total quantity for a product
    const getQty = (product) => {
        if (product.ptype === 'Variation' && product.variationValues) {
            const qty = Object.values(product.variationValues)
                .map(variation => Number(variation.productQty))
                .filter(qty => !isNaN(qty));
            return qty.length > 0 ? qty.reduce((total, current) => total + current, 0) : 0;
        } else {
            const singleProductQty = Number(product.productQty);
            return !isNaN(singleProductQty) && singleProductQty > 0 ? singleProductQty : 0;
        }
    };

    // Determine if a product is low in stock
    const isLowStock = (product) => {
        const stockQty = getQty(product);
        const stockAlert = Number(product.stockAlert);
        return !isNaN(stockAlert) && stockQty < stockAlert;
    };

    // Filter and sort products with low stock
    const lowStockProducts = combinedProductData
        .filter((product) => isLowStock(product))
        .sort((a, b) => getQty(a) - getQty(b)); 
        

    return (
        <>
            {loading ? (
                <Box sx={{ width: '100%', position: 'absolute', top: '0', left: '0', margin: '0', padding: '0' }}>
                    <LinearProgress />
                </Box>
            ) : lowStockProducts.length > 0 ? (
                <div className="overflow-x-auto p-2">
                    <table className="min-w-full bg-white ">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Alert</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lowStockProducts.map((p, index) => {
                                const stockQty = p.productQty || getQty(p);
                                return (
                                    <tr key={`${p._id}-${index}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img
                                                src={p.image ? p.image : ProductIcon}
                                                alt={p.name}
                                                className="w-10 h-10 object-cover rounded-full"
                                            />
                                        </td>
                                        <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.name}</td>
                                        <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.code}</td>
                                        <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">{p.brand}</td>
                                        <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">
                                            {currency} {formatWithCustomCommas(getPriceRange(p))}
                                        </td>
                                        <td className="px-7 py-5 text-left flex whitespace-nowrap text-m text-gray-900">
                                            <p className="mr-2 rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">
                                                {stockQty}
                                            </p>
                                            <p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">
                                                {p.saleUnit}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900 text-right">
                                            <p className="mr-2 rounded-[5px] text-center p-[6px] bg-green-100 text-blue-500">
                                                {p.stockAlert}
                                            </p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-700 mt-5">No products with low stock</p>
            )}
            {error && <p className="text-green-500 mt-5 text-center">{error}</p>}
        </>
    );
};

export default QuantityAlertTable;
