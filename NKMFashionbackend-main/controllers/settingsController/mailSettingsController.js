const mailSettingsSchema = require('../../models/mailSettingsModel')
const CryptoJS = require('crypto-js');

// Create new settings
const createOrUpdateMailSettings = async (req, res) => {
    const settingsData = req.body;

    // Validate input data
    const requiredFields = ['mailMailer', 'mailHost', 'mailPort', 'mailSenderName', 'username'];
    const missingFields = requiredFields.filter(field => !settingsData[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    try {
        const secretKey = process.env.DECRYPTION_SECRET_PASSKEY;
        const bytes = CryptoJS.AES.decrypt(settingsData.password, secretKey);
        const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
        settingsData.password = decryptedPassword;

        const updatedSettings = await mailSettingsSchema.findOneAndUpdate({}, settingsData, {
            new: true,
            upsert: true // Create if doesn't exist
        });

        res.status(201).json({
            status: 'success',
            message: 'Settings saved successfully!',
            data: updatedSettings
        });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while saving settings.',
            error: error.message
        });
    }
};

//Get setting
const getMailSettings = async (req, res) => {
    try {
        const settings = await mailSettingsSchema.findOne(); 
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports ={createOrUpdateMailSettings,getMailSettings}