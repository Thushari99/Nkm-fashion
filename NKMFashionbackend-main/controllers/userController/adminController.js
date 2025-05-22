const User = require('../../models/userModel'); // Import the User model
const Permissions = require('../../models/rolesPermissionModel');
const Wherehouse = require('../../models/warehouseModel');
const {verifyPermission} = require('../../middleware/roleAuthMiddleware');
require('dotenv').config();
const bcrypt = require('bcrypt');


// Initial running (Create Admin User & Assign Role Permissions)
const initialRunning = async (req, res) => {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const role = process.env.ADMIN_ROLE;
    const firstName = process.env.ADMIN_FNAME;
    const mobile = process.env.ADMIN_MOBILE;
    
    try {
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin user
        const newUser = new User({
            username,
            firstName,
            password: hashedPassword,
            role,
            mobile,
        });
        await newUser.save();

        // Check if the role already exists
        const existingRole = await Permissions.findOne({ roleName: role });
        if (existingRole) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        // Load permissions from .env and convert them to Map structure
        const roleData = JSON.parse(process.env.ROLE_DATA);
        const formattedPermissions = {};

        for (const [key, value] of Object.entries(roleData)) {
            if (Array.isArray(value)) {
                formattedPermissions[key] = value.reduce((acc, feature) => {
                    acc[feature] = true;
                    return acc;
                }, {});
            } else {
                formattedPermissions[key] = true;
            }
        }

        // Add warehouse permissions under managePOS for the admin
        if (!formattedPermissions.managePOS) {
            formattedPermissions.managePOS = {};
        }
        
        // Assuming you have a list of warehouse IDs available or can retrieve them
        const warehouses = await Wherehouse.find();  // Get all warehouses from the database (or use a predefined list)
        
        // Add all warehouse permissions with access = true
        warehouses.forEach(warehouse => {
            formattedPermissions.managePOS.warehouses = formattedPermissions.managePOS.warehouses || {};
            formattedPermissions.managePOS.warehouses[warehouse._id] = {
                warehouseId: warehouse._id,
                warehouseName: warehouse.name,
                access: true,
                "create_sale_from_pos": true,
            };
        });

        // Create new role with formatted permissions
        const newPermissions = new Permissions({
            roleName: role,
            permissions: formattedPermissions,
        });

        await newPermissions.save();

        return res.status(201).json({
            message: 'Admin created successfully, and permissions added',
            data: newUser,
        });

    } catch (err) {
        console.error('Error in initial setup:', err);
        return res.status(500).json({ message: 'Server error during user creation' });
    }
};


// Fetch dashboard data (Get user info & permissions)
const getInitialData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch role permissions
        const permissions = await verifyPermission(user);

        return res.json({
            permissions,
            username: user.username,
            role: user.role,
        });
    } catch (error) {
        console.error('Error fetching profile data:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

//Initial running
// const initialRunning = async (req, res) => {
//     const username = process.env.ADMIN_USERNAME;
//     const password = process.env.ADMIN_PASSWORD;
//     const role = process.env.ADMIN_ROLE;
//     const firstName = process.env.ADMIN_FNAME;
//     const roleData = JSON.parse(process.env.ROLE_DATA);
//     const mobile = process.env.ADMIN_MOBILE;

//     try {
//         // Proceed with user creation and permissions setup
//         if (!username || !password) {
//             return res.status(400).json({ message: 'Username and password are required' });
//         }

//         // Check if user already exists
//         const existingUser = await User.findOne({ username });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create new user
//         const newUser = new User({
//             username,
//             firstName,
//             password: hashedPassword,
//             role,
//             mobile,
//         });
//         await newUser.save();
//         // Now create the permissions only after user creation
//         const roleName = role;
//         const newUserRole = await Permissions.findOne({ roleName });
//         if (newUserRole) {
//             return res.status(400).json({ status: 'error', message: 'Role already exists' });
//         }

//         try {
//             const newPermissions = new Permissions({
//                 roleName,
//                 ...roleData,
//             });
//             await newPermissions.save();
//         } catch (error) {
//             console.error('Error creating permissions:', error);
//             return res.status(500).json({ message: 'Server error while creating permissions', error });
//         }

//         // Finally, respond with success after both user and permissions are created
//         return res.status(201).json({
//             message: 'Admin created successfully, and permissions added',
//             data: newUser,
//         });

//     } catch (err) {
//         console.error('Error in user creation process:', err);
//         return res.status(500).json({ message: 'Server error during user creation' });
//     }
// };


// //Fetch dashboard data
// const getInitialData = async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const user = await User.findById(userId).select('-password');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         // Convert Mongoose document to plain JavaScript object
//         const userObj = user.toObject();

//         // Fetch the user's role and corresponding permissions
//         const permissions = await verifyPermission(user);

//         //Sending the Response for frontend
//         res.json({
//             ...permissions,
//             username: user.username,
//             role: user.role,
//         });
//     } catch (error) {
//         console.error('Error fetching profile data:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };
module.exports = { initialRunning, getInitialData };
