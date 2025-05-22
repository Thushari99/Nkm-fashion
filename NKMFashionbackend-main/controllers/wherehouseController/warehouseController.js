const express = require('express');
const Warehouse = require('../../models/warehouseModel');

// Creating Warehouse
const createWarehouse = async (req, res) => {
    const { username, name, zip, mobile, country, city, address, location, manager} = req.body;
    const lowercaseName = name?.toLowerCase();
    const lowercaseUsername = username?.toLowerCase();

    // Check for missing fields
    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!name) missingFields.push('name');
    if (!zip) missingFields.push('zip');
    if (!mobile) missingFields.push('mobile');
    if (!country) missingFields.push('country');
    if (!city) missingFields.push('city');
    if (!address) missingFields.push('address');
    if (!location) missingFields.push('location');
    if (!manager) missingFields.push('manager');

    // If there are missing fields, respond with an error
    if (missingFields.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `${missingFields.join(', ')} is required`,
            missingFields,
        });
    }
    try {
        // Check if username exists (case-insensitive)
        const existingWarehouse = await Warehouse.findOne({
            username: { $regex: `^${lowercaseUsername}$`, $options: 'i' },
        });
        if (existingWarehouse) {
            return res.status(400).json({ message: 'Warehouse with this email already exists' });
        }

        // Check if the warehouse name exists (case-insensitive)
        const existingWarehouseByName = await Warehouse.findOne({
            name: { $regex: `^${lowercaseName}$`, $options: 'i' },
        });
        if (existingWarehouseByName) {
            return res.status(400).json({ message: 'Warehouse name already exists' });
        }

        // Check if the mobile number exists
        const existingWarehouseByMobile = await Warehouse.findOne({ mobile });
        if (existingWarehouseByMobile) {
            return res.status(400).json({ message: 'Mobile number is already in use' });
        }

        // Save the new warehouse
        const newWarehouse = new Warehouse({
            username: lowercaseUsername,
            name: lowercaseName,
            zip,
            mobile,
            country,
            city,
            address,
            location,
            manager
        });
        await newWarehouse.save();
        return res.status(201).json({ message: 'Warehouse created successfully' });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate key error: Please ensure unique username, name, or mobile number' });
        }
        console.error('Warehouse not added', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const UpdateWarehouse = async (req, res) => {
    const { id, username, name, zip, mobile, country, city, address, location, manager} = req.body;

    // Validate required fields
    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }

    // Collect missing fields (except optional ones)
    const missingFields = [];
    if (username === undefined) missingFields.push('username');
    if (name === undefined) missingFields.push('name');
    if (zip === undefined) missingFields.push('zip');
    if (mobile === undefined) missingFields.push('mobile');
    if (country === undefined) missingFields.push('country');
    if (city === undefined) missingFields.push('city');
    if (address === undefined) missingFields.push('address');
    if (location === undefined) missingFields.push('location');
    if (manager === undefined) missingFields.push('manager');

    if (missingFields.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `${missingFields.join(', ')} is required`,
            missingFields,
        });
    }

    try {
        // Check if the warehouse exists by ID
        const warehouse = await Warehouse.findById(id);
        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        // Convert username and name to lowercase for consistency
        const lowercaseUsername = username?.toLowerCase();
        const lowercaseName = name?.toLowerCase();

        // Check if another warehouse with the same username exists (excluding current warehouse)
        const existingWarehouseByUsername = await Warehouse.findOne({
            username: { $regex: `^${lowercaseUsername}$`, $options: 'i' },
            _id: { $ne: id },
        });
        if (existingWarehouseByUsername) {
            return res.status(400).json({ message: 'Username is already in use' });
        }

        // Check if another warehouse with the same mobile number exists (excluding current warehouse)
        if (mobile) {
            const existingWarehouseByMobile = await Warehouse.findOne({
                mobile,
                _id: { $ne: id },
            });
            if (existingWarehouseByMobile) {
                return res.status(400).json({ message: 'Mobile number is already in use' });
            }
        }

        // Check if another warehouse with the same name exists (case-insensitive, excluding current warehouse)
        const existingWarehouseByName = await Warehouse.findOne({
            name: { $regex: `^${lowercaseName}$`, $options: 'i' },
            _id: { $ne: id },
        });
        if (existingWarehouseByName) {
            return res.status(400).json({ message: 'Warehouse name is already in use' });
        }

        // Update warehouse details
        warehouse.username = lowercaseUsername || warehouse.username;
        warehouse.name = lowercaseName || warehouse.name;
        warehouse.zip = zip || warehouse.zip;
        warehouse.mobile = mobile || warehouse.mobile;
        warehouse.country = country || warehouse.country;
        warehouse.city = city || warehouse.city;
        warehouse.address = address || warehouse.address;
        warehouse.location = location || warehouse.location;
        warehouse.manager = manager || warehouse.manager;

        await warehouse.save();
        res.status(200).json({ status: 'success', message: 'Warehouse updated successfully' });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateKey = Object.keys(error.keyValue)[0]; // Get the field causing the error
            return res.status(400).json({
                message: `Duplicate key error: ${duplicateKey} '${error.keyValue[duplicateKey]}' already exists. Please use a unique value.`,
            });
        }
        console.error('Error updating warehouse:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


//Deleting warehouse
const DeleteWarehouse = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }
    try {
        const warehouse = await Warehouse.findByIdAndDelete(id);
        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' })
        }
        res.status(200).json({ message: 'Succesfully deleted the Warehouse' })
    } catch (error) {
        console.error('Delete Warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


//newly added combined function
const fetchWarehouses = async (req, res) => {
    const { keyword, id } = req.query;
    try {
        // Handle fetching all warehouses with or without pagination
        if (!keyword && !id) {
            const size = parseInt(req.query?.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query?.page?.number) || 1; // Default page number is 1

            const offset = (number - 1) * size; // Calculate the offset for pagination
            const sort = req.query.sort || ''; // Handle sorting if provided

            // Handle sorting order (ascending or descending)
            const sortOrder = {};
            if (sort.startsWith('-')) {
                sortOrder[sort.slice(1)] = -1; // Descending order
            } else if (sort) {
                sortOrder[sort] = 1; // Ascending order
            }

            let warehouses;
            if (req.query.page) {
                // Fetch warehouses with pagination
                warehouses = await Warehouse.find()
                    .skip(offset)
                    .limit(size)
                    .sort(sortOrder);
            } else {
                // Fetch all warehouses without pagination
                warehouses = await Warehouse.find();
            }

            if (!warehouses || warehouses.length === 0) {
                return res.status(404).json({ message: 'No warehouses found' });
            }

            const warehouseData = warehouses.map(warehouse => ({
                _id: warehouse._id,
                username: warehouse.username,
                name: warehouse.name,
                zip: warehouse.zip,
                mobile: warehouse.mobile,
                country: warehouse.country,
                city: warehouse.city,
                address: warehouse.address,
                createdAt: warehouse.createdAt,
                location: warehouse.location,
                manager: warehouse.manager,
            }));

            const totalCount = await Warehouse.countDocuments(); // Total number of warehouses

            return res.status(200).json({
                warehouses: warehouseData,
                totalPages: Math.ceil(totalCount / size),
                currentPage: number,
                totalWarehouses: totalCount,
            });
        }

        // Fetch warehouse by ID
        if (id) {
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ message: 'Warehouse not found' });
            }
            const warehouseData = {
                _id: warehouse._id,
                username: warehouse.username,
                name: warehouse.name,
                zip: warehouse.zip,
                mobile: warehouse.mobile,
                country: warehouse.country,
                city: warehouse.city,
                address: warehouse.address,
                createdAt: warehouse.createdAt,
                location: warehouse.location,
                manager: warehouse.manager,
            };
            return res.status(200).json(warehouseData);
        }

        // Search warehouse by keyword
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
            const warehouses = await Warehouse.find(query);
            if (!warehouses || warehouses.length === 0) {
                return res.status(404).json({ message: 'No warehouses found' });
            }
            const warehouseData = warehouses.map(warehouse => ({
                _id: warehouse._id,
                username: warehouse.username,
                name: warehouse.name,
                zip: warehouse.zip,
                mobile: warehouse.mobile,
                country: warehouse.country,
                city: warehouse.city,
                address: warehouse.address,
                createdAt: warehouse.createdAt,
                location: warehouse.location,
                manager: warehouse.manager,
            }));
            return res.status(200).json(warehouseData);
        }

        // Invalid query parameters
        return res.status(400).json({ message: 'Invalid query parameters' });
    } catch (error) {
        console.error('Warehouse fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const searchWarehouse = async (req, res) => {
    const { keyword } = req.query; // Get keyword from query params

    try {
        if (!keyword) {
            return res.status(400).json({ status: "error", message: "Keyword is required for search." });
        }

        // Escape special regex characters in the keyword
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by either username, city or name
        const query = {
            $or: [
                { name: { $regex: new RegExp(escapedKeyword, 'i') } }, // Contains in name
                { username: { $regex: new RegExp(escapedKeyword, 'i') } }, // Contains in username
                { city: { $regex: new RegExp(escapedKeyword, 'i') } }  // Contains in city
            ],
        };

        // Fetch warehouses based on the query
        const warehouses = await Warehouse.find(query).limit(20);

        if (!warehouses || warehouses.length === 0) {
            return res.status(404).json({ status: "unsuccess", message: "No warehouses found." });
        }

        // Format the warehouse data
        const formattedWarehouses = warehouses.map((warehouse) => {
            const warehouseObj = warehouse.toObject();

            return {
                _id: warehouseObj._id,
                name: warehouseObj.name,
                username: warehouseObj.username,
                mobile: warehouseObj.mobile,
                city: warehouseObj.city,
                country: warehouseObj.country,
                address: warehouseObj.address,
                location: warehouseObj.location,
                manager: warehouseObj.manager,
                createdAt: warehouseObj.createdAt
                    ? warehouseObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({ status: "success", warehouses: formattedWarehouses });
    } catch (error) {
        console.error("Search warehouses error:", error);
        return res.status(500).json({ status: "error", message: error.message });
    }
};


module.exports = { createWarehouse, DeleteWarehouse, UpdateWarehouse, fetchWarehouses, searchWarehouse };