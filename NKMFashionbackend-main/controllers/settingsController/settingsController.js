const multer = require('multer'); // ✅ Import multer
const Settings = require('../../models/settingsModel');
const path = require('path');
const { uploadLogo } = require('../../middleware/multerMiddleware'); // ✅ Correct import

// Create or update settings
const createOrUpdateSettings = async (req, res) => {
    try {
        console.log("Uploaded File:", req.file);
        console.log("Form Data:", req.body);

        // Get the existing settings
        const existingSettings = await Settings.findOne();

        // Handle logo file
        let logo = req.file ? path.join("uploads", "logos", req.file.filename) : existingSettings?.logo;

        // Merge the existing settings with the new data
        const settingsData = { ...req.body, logo };

        // Update settings in the database
        const updatedSettings = await Settings.findOneAndUpdate({}, settingsData, {
            new: true,
            upsert: true
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



// Get settings
const getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        // Generate full URL for the logo
        const baseUrl = `${req.protocol}://${req.get('host')}`; 
        if (settings.logo) {
            settings.logo = `${baseUrl}/${settings.logo.replace(/\\/g, "/")}`; 
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = { createOrUpdateSettings, getSettings, uploadLogo };
