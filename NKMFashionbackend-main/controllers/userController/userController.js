const User = require('../../models/userModel'); // Import the User model
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sendWelcomeEmail } = require('../../middleware/mailMiddleware');
const Permissions = require('../../models/rolesPermissionModel');
const path = require('path');
const fs = require('fs');

// Addind User
const addUser = async (req, res) => {
    const { firstName, lastName, mobile, username, role } = req.body;

    if (!username.includes('@')) {
        return res.status(400).json({
            status: 'error',
            message: 'Username must be a valid email address containing "@"',
        });
    }
    // Generate a 6-digit password
    const password = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Validate input fields
        const missingFields = [];
        if (!firstName) missingFields.push('firstName');
        if (!lastName) missingFields.push('lastName');
        if (!mobile) missingFields.push('mobile');
        if (!username) missingFields.push('username');
        if (!role) missingFields.push('role');

        // If there are missing fields, return an error response
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `The following fields are required: ${missingFields.join(', ')}`,
                missingFields,
            });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'User with this username already exists',
            });
        }

        // Check if mobile number already exists
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({
                status: 'error',
                message: 'User with this mobile number already exists',
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            firstName,
            lastName,
            mobile,
            username,
            password: hashedPassword,
            role,
        });
        await newUser.save();

        // Send welcome email (ensure `sendWelcomeEmail` handles its errors)
        try {
            await sendWelcomeEmail(username, username, password);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }


        // Respond with success
        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
        });
    } catch (err) {
        console.error('Error adding user:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Server error. Please try again later.',
        });
    }
};

const updateUser = async (req, res) => {
    const { id, username, firstName, lastName, role, mobile } = req.body;

    if (username && !username.includes('@')) {
        return res.status(400).json({
            status: 'error',
            message: 'Username must be a valid email address containing "@"',
        });
    }

    if (!username.includes('@')) {
        return res.status(400).json({
            message: 'Username must be a valid email address containing "@"',
            status: 'fail'
        });
    }

    const mobileRegex = /^\+94\d{9}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({
            message: 'Mobile number must start with "+94" and be exactly 12 characters long.',
            status: 'fail'
        });
    }
    
    try {
        // Validate required fields
        let profileImage = null;
        const missingFields = [];
        if (!firstName) missingFields.push('firstName');
        if (!lastName) missingFields.push('lastName');
        if (!mobile) missingFields.push('mobile');

        // Return error for missing fields
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `The following fields are required: ${missingFields.join(', ')}`,
                missingFields,
            });
        }

        // Ensure either `id` or `username` is provided
        if (!id && !username) {
            return res.status(400).json({
                status: 'error',
                message: 'Either User ID or username is required to identify the user.',
            });
        }

        // Retrieve user by `id` or `username`
        const user = id ? await User.findById(id) : await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        // Check if the `mobile` number is already in use by another user
        const existingUserWithMobile = await User.findOne({
            mobile,
            _id: { $ne: user._id }, // Exclude the current user
        });
        if (existingUserWithMobile) {
            return res.status(400).json({
                status: 'error',
                message: 'The mobile number is already associated with another user.',
            });
        }

        // Check if the `username` is already in use by another user
        if (username && username !== user.username) {
            const existingUserWithUsername = await User.findOne({
                username,
                _id: { $ne: user._id }, // Exclude the current user
            });
            if (existingUserWithUsername) {
                return res.status(400).json({
                    status: 'error',
                    message: 'The username is already associated with another user.',
                });
            }
        }

        // Update user fields if provided
        user.username = username || user.username;
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.mobile = mobile || user.mobile;
        user.role = role || user.role;

        // Check if there's a new file upload
        if (req.file) {
            const newImagePath = path.join('uploads', 'user', req.file.filename);

            // Remove the old image if it exists
            if (user.profileImage) {
                const oldImagePath = path.resolve('uploads', 'user', path.basename(user.profileImage));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            user.profileImage = newImagePath;
        }

        // Save updated user data
        await user.save();

        // Respond with success
        res.json({
            status: 'success',
            message: 'User updated successfully',
            user: {
                id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                mobile: user.mobile,
                role: user.role,
                profileImage
            },
        });
    } catch (err) {
        console.error('Error updating user:', err);

        // Respond with server error
        res.status(500).json({
            status: 'error',
            message: 'An internal server error occurred. Please try again later.',
        });
    }
};


// Delete a user by ID
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required to delete a user',
            });
        }
        const user = await User.findByIdAndDelete(id);

        // Handle case where user does not exist
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found', });
        }

        // Delete the user's profile image if it exists
        if (user.profileImage) {
            const imagePath = path.resolve('uploads', 'user', path.basename(user.profileImage));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Delete the image file
            }
        }

        res.status(200).json({ status: 'success', message: 'User and profile image deleted successfully', });
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.name === 'CastError') { return res.status(400).json({ status: 'error', message: 'Invalid User ID format', }); }
        res.status(500).json({ status: 'error', message: 'An internal server error occurred. Please try again later.', });
    }
};


//Find User
const fetchUsers = async (req, res) => {
    const { id, username } = req.query;
    try {
        let users;

        if (id) {
            // Fetch by ID
            users = await User.findById(id);
            if (!users) {
                return res.status(404).json({ message: 'User not found' });
            }
            users = [users]; // Convert to array for uniform processing
        } else if (username) {
            // Fetch by username (case-insensitive search)
            users = await User.find({ username: new RegExp(username, 'i') });
            if (!users.length) {
                return res.status(404).json({ message: 'User not found' });
            }
        } else {
            // Fetch all users with or without pagination
            const size = parseInt(req.query.page?.size) || 10; // Default size is 10
            const number = parseInt(req.query.page?.number) || 1; // Default page number is 1

            if (req.query.page) {
                const offset = (number - 1) * size; // Calculate the offset for pagination

                // Fetch users with pagination
                users = await User.find()
                    .skip(offset)
                    .limit(size);

                const totalCount = await User.countDocuments(); // Total number of users

                if (!users.length) {
                    return res.status(404).json({ message: 'No users found' });
                }

                // Map the user data for consistency
                const usersData = await Promise.all(users.map(async user => {
                    const userObj = user.toObject();
                    const profileImage = user.profileImage
                        ? `${req.protocol}://${req.get('host')}/uploads/user/${path.basename(user.profileImage)}`
                        : null;

                    // Fetch permissions based on user role
                    const permissions = await Permissions.find({ roleName: user.role });

                    return {
                        _id: user._id,
                        username: user.username,
                        role: user.role,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        mobile: user.mobile,
                        profileImage: profileImage,
                        permissions: permissions, // Include permissions
                    };
                }));

                return res.status(200).json({
                    users: usersData,
                    totalPages: Math.ceil(totalCount / size),
                    currentPage: number,
                    totalUsers: totalCount,
                });
            } else {
                // Fetch all users without pagination
                users = await User.find();
                if (!users.length) {
                    return res.status(404).json({ message: 'No users found' });
                }
            }
        }

        const usersData = await Promise.all(users.map(async user => {
            const userObj = user.toObject();
            const profileImage = user.profileImage
                ? `${req.protocol}://${req.get('host')}/uploads/user/${path.basename(user.profileImage)}`
                : null;

            // Fetch permissions based on user role
            const permissions = await Permissions.find({ roleName: user.role });

            return {
                _id: user._id,
                username: user.username,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                mobile: user.mobile,
                profileImage: profileImage,
                permissions: permissions, // Include permissions
            };
        }));
        
        res.json(id || username ? usersData[0] : usersData);
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// const searchUsers = async (req, res) => {
//     const { keyword } = req.query; // Extract keyword from query parameters

//     try {
//         if (!keyword) {
//             return res.status(400).json({ status: "error", message: "Keyword is required for search." });
//         }

//         // Escape special regex characters in the keyword
//         const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//         // Build query to search by username, firstName, or lastName
//         const query = {
//             $or: [
//                 { username: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Contains in username
//                 { firstName: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Contains in firstName
//                 { lastName: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Contains in lastName
//             ],
//         };

//         // Fetch users based on the query
//         const users = await User.find(query).limit(20); // Limit to 20 results

//         if (!users || users.length === 0) {
//             return res.status(404).json({ status: "unsuccess", message: "No users found." });
//         }

//         // Format the user data
//         const formattedUsers = users.map((user) => {
//             const userObj = user.toObject();

//             return {
//                 _id: userObj._id,
//                 username: userObj.username,
//                 firstName: userObj.firstName,
//                 lastName: userObj.lastName,
//                 mobile: userObj.mobile,
//                 createdAt: userObj.createdAt
//                     ? userObj.createdAt.toISOString().slice(0, 10)
//                     : null,
//             };
//         });

//         return res.status(200).json({ status: "success", users: formattedUsers });
//     } catch (error) {
//         console.error("Search users error:", error);
//         return res.status(500).json({ status: "error", message: error.message });
//     }
// };

const searchUsers = async (req, res) => {
    const { keyword } = req.query; // Extract keyword from query parameters

    try {
        if (!keyword) {
            return res.status(400).json({ status: "error", message: "Keyword is required for search." });
        }

        // Escape special regex characters in the keyword
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by username, firstName, or lastName
        const query = {
            $or: [
                { username: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Contains in username
                { firstName: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Contains in firstName
                { lastName: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Contains in lastName
            ],
        };

        // Fetch users based on the query
        const users = await User.find(query).limit(20); // Limit to 20 results

        if (!users || users.length === 0) {
            return res.status(404).json({ status: "unsuccess", message: "No users found." });
        }

        // Format the user data
        const defaultProfileImage = `${req.protocol}://${req.get('host')}/uploads/users/default.jpg`; // Default image URL

        const formattedUsers = users.map((user) => {
            const userObj = user.toObject();

            const profileImageUrl = userObj.profileImage
                ? `${req.protocol}://${req.get('host')}/uploads/user/${path.basename(userObj.profileImage)}`
                : defaultProfileImage; // Use default image if profileImage is missing

            return {
                _id: userObj._id,
                username: userObj.username,
                firstName: userObj.firstName,
                lastName: userObj.lastName,
                mobile: userObj.mobile,
                profileImage: profileImageUrl, // Include profile image
                createdAt: userObj.createdAt
                    ? userObj.createdAt.toISOString().slice(0, 10)
                    : null,
            };
        });

        return res.status(200).json({ status: "success", users: formattedUsers });
    } catch (error) {
        console.error("Search users error:", error);
        return res.status(500).json({ status: "error", message: error.message });
    }
};



module.exports = { addUser, updateUser, fetchUsers, deleteUser, searchUsers };
