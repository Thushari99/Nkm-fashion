const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const productUploadDir = path.resolve(__dirname, '../uploads/product');
const logoUploadDir = path.resolve(__dirname, '../uploads/logos');

if (!fs.existsSync(productUploadDir)) {
    fs.mkdirSync(productUploadDir, { recursive: true });
}

if (!fs.existsSync(logoUploadDir)) {
    fs.mkdirSync(logoUploadDir, { recursive: true });
}

// Multer storage for product images
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productUploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

// Multer storage for company logos
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, logoUploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `logo_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadProduct = multer({ storage: productStorage });
const uploadLogo = multer({ storage: logoStorage });

module.exports = { uploadProduct, uploadLogo };
