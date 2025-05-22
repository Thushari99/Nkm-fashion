import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleProductSelect, handleCustomerSelect, handleWarehouseChange } from '../sales/SaleController'
import { handleUpdateTransfer } from './TransferController'
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { fetchProductDataByWarehouse } from '../pos/utils/fetchByWarehose';
import Decrease from '../../img/down-arrow (1).png'

function EditTransferBody() {
    // State management
    const [warehouseData, setWarehouseData] = useState([]);
    const [warehouse, setWarehouse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCustomer, setSearchCustomer] = useState('');
    const [filteredCustomer, setFilteredCustomer] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [productBillingHandling, setSearchedProductData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState('');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [saleProduct, setSaleProduct] = useState([])
    const [saleReturProductData, setSaleReturProductData] = useState([])
    const [selectedDate, setSelectedDate] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const findSaleById = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findTransferById/${id}`);
                const fetchedProductsQty = response.data.productsData || [];
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0]
                }));
                setSaleReturProductData(initializedProductsQty);
                setSaleProduct(response.data);
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
            }
        };

        if (id) {
            findSaleById();
        }
    }, [id]);

    const fetchData = async (url, setter) => {
        setLoading(true);
        try {
            const { data } = await axios.get(url);
            setter(data);
        } catch (error) {
            console.error(`${url} fetch error:`, error);
            setter([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`, setWarehouseData);
        return () => { };
    }, []);

    const calculateTotal = () => {
        // Step 1: Sum all product subtotals including the tax for each product
        const subtotal = saleReturProductData.reduce((acc, product, index) => {
            const productQty = saleReturProductData[index]?.quantity || 1;

            const productTaxRate = saleReturProductData[index]?.taxRate / 100 || 0;
            const productSubtotal = (product.price * productQty) + (product.price * productQty * (productTaxRate * 100));
            return acc + productSubtotal;
        }, 0);

        const discountAmount = discountType === 'percentage'
            ? subtotal * (saleProduct.discount / 100)
            : saleProduct.discount || 0;

        const shipping = parseFloat(saleProduct.shipping) || 0;
        const overallTaxRate = saleProduct.tax ? parseFloat(saleProduct.tax) / 100 : 0;
        const taxAmount = subtotal * overallTaxRate;
        const total = (subtotal - discountAmount) + taxAmount + shipping;
        return total.toFixed(2);
    };

    useEffect(() => {
        if (saleProduct.date) {
            const formattedDate = new Date(saleProduct.date).toISOString().slice(0, 10);
            setSelectedDate(formattedDate);
        }
    }, [saleProduct.date]);
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleOrderStatusChange = (e) => {
        const newOrderStatus = e.target.value;
        setOrderStatus(newOrderStatus);
        setSaleProduct((prevData) => ({
            ...prevData,
            orderStatus: newOrderStatus,
        }));
    };

    const handleDiscountType = (e) => {
        const value = e.target.value;
        setDiscountType(value);
        setSaleProduct({
            ...saleProduct,
            discountType: value,
        });
    };

    const handleDiscount = (e) => {
        const value = e.target.value;

        // If the discount type is 'percentage', validate the entered value
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue) || numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }

        // Update the saleProduct state with the new discount value
        setSaleProduct({
            ...saleProduct,
            discount: value
        });
    };

    const handleTax = (e) => {
        setSaleProduct({ ...saleProduct, tax: e.target.value });
    };

    const handleShippng = (e) => {
        setSaleProduct({ ...saleProduct, shipping: e.target.value });
    };

    const handleQtyChange = (index, delta) => {
        setSaleReturProductData(prev => {
            const currentQty = prev[index]?.quantity || 1;
            let newQty = currentQty + delta;
            const stockQty = prev[index]?.warehouseFromQty || 0;

            newQty = Math.max(1, Math.min(newQty, stockQty));

            const productPrice = prev[index].price;
            const productTaxRate = prev[index].taxRate;
            const newSubtotal = (productPrice * newQty) + (productPrice * newQty * productTaxRate);

            const updatedSaleReturnData = prev.map((item, i) =>
                i === index
                    ? { ...item, quantity: newQty, subtotal: newSubtotal.toFixed(2) }
                    : item
            );
            return updatedSaleReturnData;
        });
    };

    return (
        <div className='bg-[#eff3f7] relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between items-center mt-20'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit Transfer</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewTransfer'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1"> {/* Use flex-1 to allow the field to take full width */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Warehouse From <span className='text-red-500'>*</span></label>
                                <input
                                    id="warehouse"
                                    name="warehouse"
                                    value={saleProduct.warehouseFrom}
                                    onChange={(e) => handleWarehouseChange(e, setWarehouse, fetchProductDataByWarehouse, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>

                            {/* customer */}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Warehouse To <span className='text-red-500'>*</span></label>
                                <input
                                    id="warehouse"
                                    name="warehouse"
                                    value={saleProduct.warehouseTo}
                                    onChange={(e) => handleWarehouseChange(e, setWarehouse, fetchProductDataByWarehouse, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>
                            <div>
                                {filteredCustomer.length > 0 && (
                                    <ul className="absolute left-0 z-10 mt-20 ml-[82px] w-[1213px] bg-white border border-gray-300 rounded-md shadow-lg">
                                        {filteredCustomer.map((customer) => (
                                            <li
                                                key={customer._id}
                                                onClick={() => handleCustomerSelect(customer, setSelectedCustomer, setSearchCustomer, setFilteredCustomer)}
                                                className="cursor-pointer hover:bg-gray-100 px-4 py-4"
                                            >
                                                {customer.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/*Date*/}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>
                    <div>
                        {filteredProducts.length > 0 && (
                            <ul className="absolute left-0 z-10 ml-[82px] w-[1213px] bg-white border border-gray-300 rounded-md shadow-lg">
                                {filteredProducts.map((product) => (
                                    <li
                                        key={product._id}
                                        onClick={() => handleProductSelect(product, setSelectedProduct, setSearchTerm, setFilteredProducts)}
                                        className="cursor-pointer hover:bg-gray-100 px-4 py-4"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>


                    <div className="overflow-x-auto">
                        <table className="mt-10 min-w-full bg-white border rounded-md border-gray-200">
                            <thead className="rounded-md bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                    {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>*/}
                                </tr>
                            </thead>
                            {saleReturProductData.length > 0 && (
                                <tbody>
                                    {saleReturProductData.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                                                {product.name}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-left">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.warehouseFromQty}</p>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, -1)} // Decrement
                                                        disabled={!(saleReturProductData[index]?.quantity > 1)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='decrease' />
                                                    </button>
                                                    <span className="mx-2">
                                                        {saleReturProductData[index]?.quantity || 1} {/* Display the current quantity */}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQtyChange(index, 1)} // Increment
                                                        disabled={!(saleReturProductData[index]?.quantity < product.warehouseToQty)}
                                                        className="px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='increase' />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500 text-left">
                                                Rs {product.price}
                                            </td>

                                            {/* Product Tax */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500 text-left">
                                                {product.taxRate * 100} %  {/* Show a default if no tax is available */}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-500 text-left">
                                                Rs {product.subtotal}
                                            </td>

                                            {/* Delete Action */}
                                            {/*}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleDelete(index, selectedProduct, setSelectedProduct)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            </td>
                                            */}
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>

                    <div className="">
                        {/* DISCOUNT, SHIPPING AND TAX INPUT */}
                        <div className="grid grid-cols-4 gap-4 mb-4 mt-60">
                            <div className="relative">
                                <select
                                    onChange={handleDiscountType}
                                    value={saleProduct.discountType}
                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option value=''>Discount type</option>
                                    <option value='fixed'>Fixed</option>
                                    <option value='percentage'>Percentage</option>
                                </select>
                            </div>
                            <div className='relative'>
                                <input
                                    onChange={handleDiscount}
                                    value={saleProduct.discount}
                                    type="text"
                                    placeholder="Discount"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                                    {discountType === 'Percentage' ? '%' : 'Rs'}
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    onChange={handleTax}
                                    value={saleProduct.tax}
                                    type="text"
                                    placeholder="Tax"
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                                    %
                                </span>
                            </div>
                            <div className='relative'>
                                <input
                                    onChange={handleShippng}
                                    value={saleProduct.shipping}
                                    type="text"
                                    placeholder="Shipping"
                                    className='block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm' />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                                    Rs
                                </span>
                            </div>
                        </div>

                        {/* Order, Payment Status, and Payment Type Selects */}
                        <div>
                            <div className="grid grid-cols-3 gap-4 mt-10">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status: <span className='text-red-500'>*</span></label>
                                    <select
                                        value={saleProduct.orderStatus}
                                        onChange={handleOrderStatusChange}
                                        className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                    >
                                        <option value="">Select Order Status</option>
                                        <option value="ordered">Ordered</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-right text-lg font-semibold">
                        Total: Rs {calculateTotal()}
                    </div>
                    <button
                        onClick={() => {
                            handleUpdateTransfer(
                                id,
                                calculateTotal(),
                                saleProduct.orderStatus,
                                saleProduct.discountType,
                                saleProduct.discount,
                                saleProduct.tax,
                                saleProduct.shipping,
                                saleProduct.warehouseFrom,
                                saleProduct.warehouseTo,
                                selectedDate,
                                calculateTotal().taxRate,
                                saleReturProductData,
                                setResponseMessage,
                                setError,
                                navigate
                            );
                        }}
                        className="mt-5 submit w-[200px] text-white rounded py-2 px-4"
                    >
                        Update & Save
                    </button>


                    {/* Error and Response Messages */}
                    {error && (
                        <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                            {error}
                        </p>
                    )}
                    {responseMessage && (
                        <p className="text-green-600 px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                            {responseMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
export default EditTransferBody;
