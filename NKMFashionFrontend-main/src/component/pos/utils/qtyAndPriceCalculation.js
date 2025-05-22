
export const getPriceRange = (product) => {
    if (product.warehouse && typeof product.warehouse === 'object') {
        const prices = Object.values(product.warehouse)
            .flatMap((warehouse) =>
                warehouse.variationValues
                    ? Object.values(warehouse.variationValues).map(v => Number(v.productPrice))
                    : [Number(warehouse.productPrice)] // Handle single product case
            )
            .filter(price => !isNaN(price) && price > 0);

        return prices.length > 0 ? Math.min(...prices) : 'Price not available';
    }

    return 'Price not available';
};

export const getProductCost = (product) => {
    if (product.warehouse && typeof product.warehouse === 'object') {
        const productCosts = Object.values(product.warehouse)
            .flatMap((warehouse) =>
                warehouse.variationValues
                    ? Object.values(warehouse.variationValues).map(v => Number(v.productCost))
                    : [Number(warehouse.productCost)] // Handle single product case
            )
            .filter(productCost => !isNaN(productCost) && productCost > 0);

        return productCosts.length > 0 ? Math.min(...productCosts) : 0;
    }

    const singleproductCost = Number(product.productCost);
    console.log(singleproductCost)
    return !isNaN(singleproductCost) && singleproductCost > 0 ? singleproductCost : 0;
};

export const getQty = (product) => {
    if (product.warehouse && typeof product.warehouse === 'object') {
        const quantities = Object.values(product.warehouse)
            .flatMap((warehouse) =>
                warehouse.variationValues
                    ? Object.values(warehouse.variationValues).map(v => Number(v.productQty))
                    : [Number(warehouse.productQty)] 
            )
            .filter(qty => !isNaN(qty));

        return quantities.length > 0 ? quantities.reduce((total, current) => total + current, 0) : 0;
    }

    return 0;
};

// CALCULATE SINGLE & VARIATION PRODUCT TAX
export const getTax = (product) => {
    if (product.warehouse && typeof product.warehouse === 'object') {
        const taxes = Object.values(product.warehouse)
            .flatMap((warehouse) =>
                warehouse.variationValues
                    ? Object.values(warehouse.variationValues).map(v => Number(v.orderTax))
                    : [Number(warehouse.orderTax)] 
            )
            .filter(orderTax => !isNaN(orderTax) && orderTax > 0);
        return taxes.length > 0 ? Math.min(...taxes) : 0;
    }
    const singleTax = Number(product.orderTax);
    console.log(singleTax)
    return !isNaN(singleTax) && singleTax  > 0 ? singleTax  : 0;
};


// CALCULATE SINGLE & VARIATION PRODUCT DISCOUNT
export const getDiscount = (product) => {
    if (product.warehouse && typeof product.warehouse === 'object') {
        const discounts = Object.values(product.warehouse)
            .flatMap((warehouse) =>
                warehouse.variationValues
                    ? Object.values(warehouse.variationValues).map(v => Number(v.discount))
                    : [Number(warehouse.discount)] // Handle single product case
            )
            .filter(discount => !isNaN(discount) && discount > 0);

        return discounts.length > 0 ? Math.min(...discounts) : 0;
    }

    const singleDiscount = Number(product.discount);
    console.log(singleDiscount)
    return !isNaN(singleDiscount) && singleDiscount > 0 ? singleDiscount : 0;
};