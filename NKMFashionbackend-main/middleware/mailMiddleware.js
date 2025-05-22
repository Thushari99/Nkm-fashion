const nodemailer = require('nodemailer');
const mailSettings = require('../models/mailSettingsModel'); // Imported module
const companySettings = require('../models/settingsModel'); // Imported module
const dotenv = require('dotenv');

const LOGIN_URL = process.env.ORIGIN_URL;
// Function to fetch mail settings from the database
const getMailSettings = async () => {
    try {
        const settings = await mailSettings.findOne(); 
        if (!settings) {
            throw new Error('Mail settings not found in the database.');
        }
        return settings;
    } catch (error) {
        console.error('Error fetching mail settings:', error);
        throw error;
    }
};

const user = process.env.HOST_EMAIL;

// Function to create a nodemailer transporter
const createTransporter = async () => {
    try {
        const settings = await getMailSettings(); // Use the renamed variable
        const transporter = nodemailer.createTransport({
            host: settings.mailHost,
            port: settings.mailPort,
            secure: true, 
            auth: {
                // user: settings.mailMailer,
                // pass: settings.password,
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_EMAIL_KEY
            },
        });

        return transporter;
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw error;
    }
};

// Function to send a welcome email
const sendWelcomeEmail = async (to, username, password) => {
    try {
        const transporter = await createTransporter(); // Create the transporter
        const settings = await getMailSettings(); // Fetch mail settings for sender name
        const companySettingsData = await companySettings.findOne();
        const companyName = companySettingsData?.companyName || '';

        const mailOptions = {
            from: `${settings.mailSenderName} <${user}>`, // Use the fetched mail settings
            to,
            subject: 'Welcome to Our Service!',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h1 style="text-align: center; color: #333;">${companyName}</h1>
                    <table style="width: 100%; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
                        <thead style="background-color: #dce3ff; color: #333;">
                            <tr>
                                <th style="padding: 20px; text-align: center; font-size: 24px;">
                                    Welcome to Our Service, <p style="font-size: 15px;">${username}!</p>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 20px;">
                                    <p>Dear ${username},</p>
                                    <p>We're excited to have you on board! Below are your account login details:</p>
                                    <ul style="list-style: none; padding: 0;">
                                        <li><strong>Username:</strong> ${username}</li>
                                        <li><strong>Password:</strong> ${password}</li>
                                    </ul>
                                    <p>
                                        To get started, click the button below:
                                    </p>
                                    <p style="text-align: center;">
                                        <a href=${LOGIN_URL} 
                                           style="display: inline-block; padding: 12px 24px; background-color: #35AF87; color: white; text-decoration: none; font-weight: bold; border-radius: 5px;">
                                           Login to Your Account
                                        </a>
                                    </p>
                                    <p>If you have any questions, feel free to reach out to us. We're here to help!</p>
                                    <p>Best Regards,<br/>The Team</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #888;">
                                    © ${new Date().getFullYear()} Our Service. All Rights Reserved.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions); // Send the email
        console.log('Welcome email sent:', info.response);
        return info; // Return the info object
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Throw the error to handle it elsewhere
    }
};

module.exports = { sendWelcomeEmail };