const User = require('../../models/userModel'); // Adjust the path as needed
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
const mailSettingsSchema = require('../../models/mailSettingsModel');
const user = process.env.HOST_EMAIL;
const pass = process.env.HOST_EMAIL_KEY;

const getMailSettings = async () => {
    try {
        const mailSettings = await mailSettingsSchema.findOne();
        if (!mailSettings) {
            throw new Error('Mail settings not found in the database.');
        }
        return mailSettings;
    } catch (error) {
        console.error('Error fetching mail settings:', error);
        throw error;
    }
};

// Make reset code and send email
exports.sendResetCode = async (req, res) => {
    const { encryptedUsername } = req.body;
    const UsernameDecryptedKey = process.env.USER_KEY;

    // Input validation
    if (!encryptedUsername) {
        return res.status(400).json({
            status: 'error',
            message: 'Username is required',
        });
    }

    let username;
    try {
        // Decrypt the encrypted username
        const userKey = CryptoJS.AES.decrypt(encryptedUsername, UsernameDecryptedKey);
        username = userKey.toString(CryptoJS.enc.Utf8);

        if (!username || username.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: 'Decryption failed or username is empty',
            });
        }
    } catch (decryptionError) {
        console.error('Error decrypting username:', decryptionError);
        return res.status(400).json({
            status: 'error',
            message: 'Invalid encrypted username',
        });
    }

    let transporter;

    try {
        const mailSettings = await getMailSettings();
        transporter = nodemailer.createTransport({
            host: mailSettings.mailHost,
            port: mailSettings.mailPort,
            secure: true,
            auth: {
                user: 'noreply@myposmate.lk',
                pass: 'MyP0SM@t3',
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // Verify the transporter configuration
        await transporter.verify();
    } catch (transporterError) {
        console.error('Error setting up email transporter:', transporterError);
        return res.status(500).json({
            status: 'error',
            message: 'Email service not available',
        });
    }

    try {
        const mailSettings = await getMailSettings();

        transporter = nodemailer.createTransport({
            host: mailSettings.mailHost,
            port: mailSettings.mailPort,
            secure: true,
            auth: {
                user: process.env.HOST_EMAIL,     
                pass: process.env.HOST_EMAIL_KEY  
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify the transporter
        await transporter.verify();

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 300000;

        // Email content
        const mailOptions = {
            from: `${mailSettings.mailSenderName} <${process.env.HOST_EMAIL}>`,
            to: username,
            subject: 'Your password reset code',
            text: `Your password reset code is: ${otp}`
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            status: 'success',
            otp,
            expiresAt,
            message: 'OTP sent successfully'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process request'
        });
    }
};