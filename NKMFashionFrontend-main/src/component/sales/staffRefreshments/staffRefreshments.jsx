import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Dialog, DialogActions, DialogContent, DialogTitle, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField } from '@mui/material';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { useCurrency } from '../../../context/CurrencyContext';
import { Link } from 'react-router-dom';
import '../../../styles/login.css';
import moment from 'moment';

const StaffRefreshments = () => {
    const [modalOpen, setModalOpen] = useState(false); // For viewing the details
    const [editModalOpen, setEditModalOpen] = useState(false); // For editing the details
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [editedRecord, setEditedRecord] = useState(null); // For edited details
    const { currency } = useCurrency();
    
    useEffect(() => {
        fetchStaffRefreshmentRecords();
    }, []);

    const fetchStaffRefreshmentRecords = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/fetchStaffRefreshments`);
            const data = await response.json();
            if (response.ok) {
                setRecords(data.records);
            } else {
                console.error('Error fetching records:', data.error);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setKeyword(e.target.value);
    };

    const handleViewClick = (record) => {
        setSelectedRecord(record);
        setModalOpen(true);
    };

    const handleEditClick = (record) => {
        setEditedRecord(record);
        setEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedRecord(null);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditedRecord(null);
    };

    const handleEditChange = (e, index, field) => {
        const newProductsData = [...editedRecord.productsData];
        newProductsData[index][field] = e.target.value;
    
        // Recalculate the total cost and product-wise costs
        const newTotalAmount = newProductsData.reduce((total, product) => {
            const productCost = (product.issuedQty - product.returnQty) * product.productCost;
            return total + productCost;
        }, 0);
    
        setEditedRecord({
            ...editedRecord,
            productsData: newProductsData,
            totalAmount: newTotalAmount,
        });
    };
    

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        // Prepare the data to send to the backend
        const updatedRecordData = {
            totalAmount: editedRecord.totalAmount,
            warehouse: editedRecord.warehouse,
            products: editedRecord.productsData.map(product => ({
                currentId: product.currentId,
                stockQty: product.stockQty,
                variation: product.variation,
                issuedQty: product.issuedQty,
                returnQty: product.returnQty,
                productCost: product.productCost,
                // Add the missing fields (assuming you have them in your data)
                warehouseId: product.warehouseId, // Add warehouseId field
                totalCost: product.totalCost,     // Add totalCost field
                name: product.name                // Add name field
            })),
            date: moment(editedRecord.date).format('YYYY-MM-DD'),
        };
   
        // Debug log: Log the data that will be sent to the backend
        console.log('Updated Record Data to be sent to the backend:', updatedRecordData);
        
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/updateStaffRefreshment/${editedRecord._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedRecordData),
            });
            
            // Debug log: Check the response status
            console.log('Response Status:', response.status);
            
            if (response.ok) {
                const updatedRecord = await response.json();
                
                // Debug log: Log the updated record data returned from the backend
                console.log('Updated Record Response:', updatedRecord);
                
                setRecords(records.map(record => record._id === updatedRecord._id ? updatedRecord : record));
                setEditModalOpen(false);
            } else {
                // Debug log: Log error when response is not ok
                console.error('Error updating record:', response);
            }
        } catch (error) {
            // Debug log: Log the error in case of an exception
            console.error('Error updating record:', error);
        }
    };
   
    

    return (
        <div className='relative bg-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className='relative w-full max-w-md'>
                    <form onSubmit={(e) => e.preventDefault()} className='flex items-center'>
                        <input
                            onChange={handleInputChange}
                            name='keyword'
                            type='text'
                            placeholder='Search by reference ID...'
                            className='searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent'
                            value={keyword}
                        />
                    </form>
                </div>
                <div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className='submit rounded-md px-2 py-2 text-sm font-semibold text-white shadow-sm w-60 text-center bg-blue-600 hover:bg-blue-700'
                    >
                        New
                    </button>
                </div>
            </div>

            <div>
                {loading ? (
                    <Box sx={{ width: '100%', position: 'absolute', top: '0', left: '0' }}>
                        <LinearProgress />
                    </Box>
                ) : (
                    <table className='overflow-x-auto min-w-full bg-white border mb-20 border-gray-200'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Date</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Products</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Total Amount</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                            {records.map((record) => (
                                <tr key={record._id}>
                                    <td className='px-6 py-4 text-left text-m text-gray-900'>
                                        {new Date(record.date).toLocaleDateString()}
                                    </td>
                                    <td className='px-6 py-4 text-left text-m text-gray-900'>
                                        {record.productsData.map(p => p.name).join(', ')}
                                    </td>
                                    <td className='px-4 py-2 text-left text-m text-gray-900'>
                                        <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>
                                            {currency} {formatWithCustomCommas(record.totalAmount)}
                                        </p>
                                    </td>
                                    <td className='px-6 py-4 text-left text-m text-gray-900'>
                                        <div className='flex items-center'>
                                            <button
                                                onClick={() => handleViewClick(record)}
                                                className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                                                style={{ background: "transparent" }}
                                            >
                                                <i className="fas fa-eye mr-1"></i>
                                            </button>

                                            <button
                                                onClick={() => handleEditClick(record)}
                                                className='text-blue-500 hover:text-blue-700 font-bold py-1 px-2'
                                            >
                                                <i className='fas fa-edit'></i>
                                            </button>
                                            <button className='text-red-500 hover:text-red-700 font-bold py-1 px-2'>
                                                <i className='fas fa-trash'></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for displaying detailed information */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle className="submit text-white">Staff Refreshment Details</DialogTitle>
                <DialogContent className="bg-gray-100">
                    {selectedRecord ? (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 mt-4">Date: {new Date(selectedRecord.date).toLocaleDateString()}</h3>

                            <div className="mb-4">
                                <h4 className="font-bold text-green-800 mb-2">Products and Quantities:</h4>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="font-bold">Product Name</TableCell>
                                                <TableCell className="font-bold">Issued Quantity</TableCell>
                                                <TableCell className="font-bold">Return Quantity</TableCell>
                                                <TableCell className="font-bold">Product Cost</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedRecord.productsData.map((product, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{product.name}</TableCell>
                                                    <TableCell>{product.issuedQty}</TableCell>
                                                    <TableCell>{product.returnQty}</TableCell>
                                                    <TableCell>{currency} {formatWithCustomCommas(product.productCost)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </div>

                            <h4 className="font-medium mt-4">Total Amount:</h4>
                            <p className="text-xl font-semibold text-green-600">{currency} {formatWithCustomCommas(selectedRecord.totalAmount)}</p>
                        </div>
                    ) : (
                        <p>Loading details...</p>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary" className="bg-blue-600 text-white hover:bg-blue-700">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
                <DialogTitle className="submit text-white">Edit Staff Refreshment</DialogTitle>
                <DialogContent className="bg-gray-100">
                    {editedRecord ? (
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Product Name</TableCell>
                                                <TableCell>Stock Quantity</TableCell>
                                                <TableCell>Issued Quantity</TableCell>
                                                <TableCell>Return Quantity</TableCell>
                                                <TableCell>Product Cost</TableCell>
                                                <TableCell>Product Wise Cost</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {editedRecord.productsData.map((product, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{product.name}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            value={product.stockQty}
                                                            readOnly
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            value={product.issuedQty}
                                                            onChange={(e) => handleEditChange(e, index, 'issuedQty')}
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            value={product.returnQty}
                                                            onChange={(e) => handleEditChange(e, index, 'returnQty')}
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>{currency} {formatWithCustomCommas(product.productCost)}</TableCell>
                                                    <TableCell>
                                                        {currency} {formatWithCustomCommas((product.issuedQty - product.returnQty) * product.productCost)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </div>
                            <div className="mb-4">
                                <TextField
                                    label="Total Amount"
                                    type="number"
                                    fullWidth
                                    value={editedRecord.totalAmount}
                                    disabled
                                />
                            </div>
                            <DialogActions>
                                <Button type="submit" color="primary" className="bg-blue-600 text-white hover:bg-blue-700">
                                    Save Changes
                                </Button>
                                <Button onClick={handleCloseEditModal} color="secondary">
                                    Cancel
                                </Button>
                            </DialogActions>
                        </form>
                    ) : (
                        <p>Loading edit form...</p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffRefreshments;
