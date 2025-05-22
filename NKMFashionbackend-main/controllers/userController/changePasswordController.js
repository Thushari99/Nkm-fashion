const User = require('../../models/userModel');
const CryptoJS = require('crypto-js');
const bcrypt = require('bcrypt');

// Changing password
exports.changePassword = async (req, res, next) => {
    const { id } = req.params;
    const { password: encryptedPassword } = req.body;

    console.log('id:', id);
    console.log('password:', encryptedPassword);

    // Validate input
    if (!encryptedPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Password is required',
        });
    }

    let decryptedPassword;
    try {
        // Attempt to decrypt the password
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, 'zxcvb');
        decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedPassword || decryptedPassword.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: 'Decryption failed or password is empty',
            });
        }
    } catch (decryptionError) {
        console.error('Error during decryption:', decryptionError);
        return res.status(400).json({
            status: 'error',
            message: 'Invalid encrypted password format',
        });
    }

    try {
        // Hash the decrypted password with bcrypt
        const hashedPassword = await bcrypt.hash(decryptedPassword, 10); // Salt rounds = 10

        // Update the user's password in the database
        const user = await User.findOneAndUpdate(
            { username: id },
            { password: hashedPassword },
            { new: true } // Return the updated user
        );

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        // Successfully updated password
        return res.status(200).json({
            status: 'success',
            message: 'Password updated successfully',
        });
    } catch (dbError) {
        console.error('Error updating password:', dbError);

        // Pass error to global error handling middleware
        next(dbError);
    }
};