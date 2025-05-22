const express = require('express');
const Suplier = require('../../models/suplierModel');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');

// Set up multer to store file in memory (without saving to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('file');

//Creating Suplier
const createSuplier = async (req, res) => {
    const { username, name, nic, companyName, mobile, country, city, address } = req.body;

    // Validate input fields
    if (!username || !name || !nic || !companyName || !mobile || !country || !city || !address) {
        return res.status(400).json({
            message: 'All fields are required. Please provide username, name, mobile, country, city, and address.',
            status: 'fail'
        });
    }

    try {
        // Check if supplier already exists by username
        const existingSuplier = await Suplier.findOne({ username });
        if (existingSuplier) {
            return res.status(400).json({ message: 'Supplier already exists', status: 'fail' });
        }

        // Check if mobile number already exists
        const existingMobileNumberChecking = await Suplier.findOne({ mobile });
        if (existingMobileNumberChecking) {
            return res.status(400).json({ message: 'Mobile Number already exists', status: 'fail' });
        }

        // Check if mobile number already exists
        const existingNICChecking = await Suplier.findOne({ nic });
        if (existingNICChecking) {
            return res.status(400).json({ message: 'NIC Number already exists', status: 'fail' });
        }
        // Validate NIC length
        const newNICRegex = /^\d{12}$/;
        const oldNICRegex = /^\d{9}[VXvx]$/;

        if (!newNICRegex.test(nic) && !oldNICRegex.test(nic)) {
            return res.status(400).json({
                message: 'NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).',
                status: 'fail'
            });
        }

        // Create new supplier
        const newSuplier = new Suplier({ username, name, companyName, nic, mobile, country, city, address });
        await newSuplier.save();

        // Respond with success message
        return res.status(201).json({ message: 'Supplier created successfully', status: 'success' });

    } catch (error) {
        console.error('Supplier not added:', error);

        // Specific error responses based on error type
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation Error: Please check your input.',
                status: 'fail',
                error: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate Error: Some unique fields already exist.',
                status: 'fail',
                error: error.message
            });
        }

        // General server error
        return res.status(500).json({
            message: 'Server error. Please try again later.',
            status: 'fail',
            error: error.message
        });
    }
};


//Import suplier
const ImportSuplier = async (req, res) => {
    try {
        // Upload the file (in memory)
        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(400).json({ message: 'Error uploading file', error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Validate file type
            const allowedMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ message: 'Invalid file type. Please upload an Excel file.' });
            }

            try {
                // Read the file content from memory buffer
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

                // Assuming the data is in the first sheet of the Excel file
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Parse data from the Excel sheet
                const suppliersData = XLSX.utils.sheet_to_json(sheet);

                // Check if the data is valid
                if (!Array.isArray(suppliersData) || suppliersData.length === 0) {
                    return res.status(400).json({ message: 'Invalid supplier data in the Excel file' });
                }

                // Transform and validate data as needed
                const transformedSuppliers = suppliersData.map(supplier => ({
                    username: supplier.username,
                    name: supplier.name,
                    companyName: supplier.companyName,
                    nic: supplier.nic,
                    mobile: supplier.mobile,
                    country: supplier.country,
                    city: supplier.city,
                    address: supplier.address,
                }));

                const validatedSuppliers = transformedSuppliers.filter(supplier =>
                    supplier.username &&
                    supplier.name &&
                    supplier.companyName &&
                    supplier.nic &&
                    supplier.mobile &&
                    supplier.country &&
                    supplier.city &&
                    supplier.address
                );

                if (validatedSuppliers.length === 0) {
                    return res.status(400).json({ message: 'No valid supplier records found' });
                }

                try {
                    // Check for duplicates in the database
                    const existingSuppliers = await Suplier.find({
                        $or: validatedSuppliers.map(supplier => ({
                            username: supplier.username,
                            mobile: supplier.mobile,
                            nic: supplier.nic,
                        })),
                    });

                    if (existingSuppliers.length > 0) {
                        return res.status(400).json({ message: 'Some suppliers already exist' });
                    }

                    // Save valid suppliers to the database
                    const newSuppliers = await Suplier.insertMany(validatedSuppliers);

                    res.status(201).json({
                        message: 'Suppliers saved successfully',
                        newSuppliers,
                    });
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    res.status(500).json({ message: 'Failed to save suppliers to the database', error: dbError.message });
                }
            } catch (fileError) {
                console.error('Error processing file:', fileError);
                res.status(400).json({ message: 'Error processing the Excel file', error: fileError.message });
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: 'Unexpected error occurred', error: error.message });
    }
};


//Update the suplier details
const UpdateSuplier = async (req, res) => {
    const { id, username, name, companyName, nic, mobile, country, city, address } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }
    if (!username || !name || !companyName || !nic || !mobile || !country || !city || !address) {
        return res.status(400).json({
            message: 'All fields are required. Please provide username, name, dob, mobile, country, city, and address.'
        });
    }
    // Validate username (must be a valid email)
    if (!username.includes('@')) {
        return res.status(400).json({
            message: 'Username must be a valid email address containing "@"',
            status: 'fail'
        });
    }

    // Validate mobile number: must start with "+94" and be exactly 12 characters long
    const mobileRegex = /^\+94\d{9}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({
            message: 'Mobile number must start with "+94" and be exactly 12 characters long.',
            status: 'fail'
        });
    }

    // Validate NIC format: new NIC (12 digits) or old NIC (9 digits + "V" or "X")
    const newNICRegex = /^\d{12}$/;
    const oldNICRegex = /^\d{9}[VXvx]$/;
    if (!newNICRegex.test(nic) && !oldNICRegex.test(nic)) {
        return res.status(400).json({
            message: 'NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).',
            status: 'fail'
        });
    }

    try {
        const suplier = await Suplier.findById(id);
        if (!suplier) {
            return res.status(404).json({ message: 'Suplier not found' });
        }
        // Check if another suplier with the same username exists, but exclude the current suplier
        const existingSuplier = await Suplier.findOne({ username, _id: { $ne: id } });
        if (existingSuplier) {
            return res.status(400).json({ message: 'Username already in use' });
        }
        // Check if the mobile number is already in use by another user
        const existingUserWithMobile = await Suplier.findOne({ mobile, _id: { $ne: suplier._id } });
        if (existingUserWithMobile) {
            return res.status(400).json({ message: 'Mobile number already exists' });
        }
        // Check if the mobile number is already in use by another user
        const existingUserWithNIC = await Suplier.findOne({ nic, _id: { $ne: suplier._id } });
        if (existingUserWithNIC) {
            return res.status(400).json({ message: 'NIC number already exists' });
        }
        // Validate NIC length
        const newNICRegex = /^\d{12}$/;
        const oldNICRegex = /^\d{9}[VXvx]$/;

        if (!newNICRegex.test(nic) && !oldNICRegex.test(nic)) {
            return res.status(400).json({
                message: 'NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).',
                status: 'fail'
            });
        }

        suplier.username = username || suplier.username;
        suplier.name = name || suplier.name;
        suplier.companyName = companyName || suplier.companyName
        suplier.nic = nic || suplier.nic;
        suplier.mobile = mobile || suplier.mobile;
        suplier.country = country || suplier.country;
        suplier.city = city || suplier.city;
        suplier.address = address || suplier.address;

        await suplier.save();
        res.json({ status: 'success', message: 'Suplier updated successfully' });
    } catch (error) {
        console.error('Error updating Supplier:', error); // General server error 
        res.status(500).json({
            message: 'Server error. Please try again later.',
            status: 'fail',
            error: error.message
        });
    }
};

//Deleting suplier
const DeleteSuplier = async (req, res) => {
    const { id } = req.params;

    try {
        const suplier = await Suplier.findByIdAndDelete(id);
        if (!suplier) {
            return res.status(404).json({ message: 'Supplier not found', status: 'fail' });
        }

        res.status(200).json({ message: 'Successfully deleted the Supplier', status: 'success' });
    } catch (error) {
        console.error('Delete Supplier error:', error);

        // General server error
        res.status(500).json({ message: 'Server error. Please try again later.', status: 'fail', error: error.message });
    }
};


// //Fetch Suplier
const fetchSupplier = async (req, res) => {
    const { keyword, id, customerName } = req.query;

    try {
        // Handle fetching all suppliers with or without pagination
        if (!keyword && !id && !customerName) {
            console.log('Received query parameters:', req.query);
            const size = parseInt(req.query?.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query?.page?.number) || 1; // Default page number is 1
            console.log(`Fetching suppliers with size: ${size} and page: ${number}`);

            const offset = (number - 1) * size; // Calculate the offset for pagination
            const sort = req.query.sort || ''; // Handle sorting if provided

            // Handle sorting order (ascending or descending)
            const sortOrder = {};
            if (sort.startsWith('-')) {
                sortOrder[sort.slice(1)] = -1; // Descending order
            } else if (sort) {
                sortOrder[sort] = 1; // Ascending order
            }

            let suppliers;
            if (req.query.page) {
                // Fetch users with pagination
                suppliers = await Suplier.find()
                    .skip(offset)
                    .limit(size)
                    .sort(sort);


            } else {
                // Fetch all suppliers without pagination
                suppliers = await Suplier.find();
            }

            if (!suppliers || suppliers.length === 0) {
                return res.status(404).json({ message: 'No suppliers found' });
            }

            const supplierData = suppliers.map(supplier => ({
                _id: supplier._id,
                username: supplier.username,
                name: supplier.name,
                companyName: supplier.companyName,
                nic: supplier.nic,
                mobile: supplier.mobile,
                country: supplier.country,
                city: supplier.city,
                address: supplier.address,
                createdAt: supplier.createdAt,
            }));

            const totalCount = await Suplier.countDocuments(); // Total number of users

            return res.status(200).json({
                suppliers: supplierData,
                totalPages: Math.ceil(totalCount / size),
                currentPage: number,
                totalSuppliers: totalCount,
            });
        }

        // Handle "Find by Keyword"
        if (keyword) {
            let query = {};
            if (!isNaN(keyword)) {
                query.mobile = Number(keyword);
            } else {
                query = {
                    $or: [
                        { username: new RegExp(keyword, 'i') },
                        { name: new RegExp(keyword, 'i') },
                        { city: new RegExp(keyword, 'i') },
                    ],
                };
            }
            const suppliers = await Suplier.find(query);
            if (!suppliers || suppliers.length === 0) {
                return res.status(404).json({ message: 'No suppliers found' });
            }
            const supplierData = suppliers.map(supplier => ({
                _id: supplier._id,
                username: supplier.username,
                name: supplier.name,
                companyName: supplier.companyName,
                nic: supplier.nic,
                mobile: supplier.mobile,
                country: supplier.country,
                city: supplier.city,
                address: supplier.address,
                createdAt: supplier.createdAt,
            }));
            return res.status(200).json(supplierData);
        }

        // Handle "Get by ID for Update"
        if (id) {
            const supplier = await Suplier.findById(id);
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            const supplierData = {
                _id: supplier._id,
                username: supplier.username,
                name: supplier.name,
                companyName: supplier.companyName,
                nic: supplier.nic,
                mobile: supplier.mobile,
                country: supplier.country,
                city: supplier.city,
                address: supplier.address,
            };
            return res.status(200).json(supplierData);
        }

        // Handle "Search by Name"
        if (customerName) {
            const suppliers = await Suplier.find({
                name: new RegExp(`^${customerName}`, 'i'),
            });
            if (!suppliers || suppliers.length === 0) {
                return res.status(404).json({ message: 'No suppliers found' });
            }
            const supplierData = suppliers.map(supplier => ({
                _id: supplier._id,
                username: supplier.username,
                name: supplier.name,
                mobile: supplier.mobile,
                city: supplier.city,
            }));
            return res.status(200).json(supplierData);
        }

        return res.status(400).json({ message: 'Invalid query parameters' });
    } catch (error) {
        console.error('Error handling supplier request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const searchSuppliers = async (req, res) => {
    const { keyword } = req.query; // Get keyword from query params

    try {
        if (!keyword) {
            return res.status(400).json({ status: "error", message: "Keyword is required for search." });
        }

        // Escape special regex characters in the keyword
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by either name or username
        const query = {
            $or: [
                { name: { $regex: new RegExp(escapedKeyword, 'i') } }, // Contains in name
                { username: { $regex: new RegExp(escapedKeyword, 'i') } }  // Contains in username
            ],
        };

        // Fetch suppliers based on the query
        const suppliers = await Suplier.find(query).limit(20);

        if (!suppliers || suppliers.length === 0) {
            return res.status(404).json({ status: "unsuccess", message: "No suppliers found." });
        }

        // Format the supplier data
        const formattedSuppliers = suppliers.map((supplier) => {
            const supplierObj = supplier.toObject();

            return {
                _id: supplierObj._id,
                name: supplierObj.name,
                username: supplierObj.username,
                mobile: supplierObj.mobile,
                city: supplierObj.city,
                createdAt: supplierObj.createdAt
                    ? supplierObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({ status: "success", suppliers: formattedSuppliers });
    } catch (error) {
        console.error("Search suppliers error:", error);
        return res.status(500).json({ status: "error", message: error.message });
    }
};


//Fetch Suplier
// const fetchSupplier = async (req, res) => {
//     const { keyword, id, customerName } = req.query;

//     try {
//         // If no query parameters are provided, return all suppliers
//         if (!keyword && !id && !customerName) {
//             const suppliers = await Suplier.find();
//             if (!suppliers || suppliers.length === 0) {
//                 return res.status(404).json({ message: 'No suppliers found' });
//             }
//             const supplierData = suppliers.map(supplier => ({
//                 _id: supplier._id,
//                 username: supplier.username,
//                 name: supplier.name,
//                 dob: supplier.dob,
//                 mobile: supplier.mobile,
//                 country: supplier.country,
//                 city: supplier.city,
//                 address: supplier.address,
//                 createdAt: supplier.createdAt,
//             }));
//             return res.status(200).json(supplierData);
//         }

//         // Handle "Find by Keyword"
//         if (keyword) {
//             let query = {};
//             if (!isNaN(keyword)) {
//                 query.mobile = Number(keyword);
//             } else {
//                 query = {
//                     $or: [
//                         { username: new RegExp(keyword, 'i') },
//                         { name: new RegExp(keyword, 'i') },
//                         { city: new RegExp(keyword, 'i') },
//                     ],
//                 };
//             }
//             const suppliers = await Suplier.find(query);
//             if (!suppliers || suppliers.length === 0) {
//                 return res.status(404).json({ message: 'No suppliers found' });
//             }
//             const supplierData = suppliers.map(supplier => ({
//                 _id: supplier._id,
//                 username: supplier.username,
//                 name: supplier.name,
//                 dob: supplier.dob,
//                 mobile: supplier.mobile,
//                 country: supplier.country,
//                 city: supplier.city,
//                 address: supplier.address,
//                 createdAt: supplier.createdAt,
//             }));
//             return res.status(200).json(supplierData);
//         }

//         // Handle "Get by ID for Update"
//         if (id) {
//             const supplier = await Suplier.findById(id);
//             if (!supplier) {
//                 return res.status(404).json({ message: 'Supplier not found' });
//             }
//             const supplierData = {
//                 _id: supplier._id,
//                 username: supplier.username,
//                 name: supplier.name,
//                 dob: supplier.dob,
//                 mobile: supplier.mobile,
//                 country: supplier.country,
//                 city: supplier.city,
//                 address: supplier.address,
//             };
//             return res.status(200).json(supplierData);
//         }
//         // Handle "Search by Name"
//         if (customerName) {
//             const suppliers = await Suplier.find({
//                 name: new RegExp(`^${customerName}`, 'i'),
//             });
//             if (!suppliers || suppliers.length === 0) {
//                 return res.status(404).json({ message: 'No suppliers found' });
//             }
//             const supplierData = suppliers.map(supplier => ({
//                 _id: supplier._id,
//                 username: supplier.username,
//                 name: supplier.name,
//                 mobile: supplier.mobile,
//                 city: supplier.city,
//             }));
//             return res.status(200).json(supplierData);
//         }

//         return res.status(400).json({ message: 'Invalid query parameters' });
//     } catch (error) {
//         console.error('Error handling supplier request:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };

module.exports = { createSuplier, DeleteSuplier, UpdateSuplier, ImportSuplier, fetchSupplier, searchSuppliers };