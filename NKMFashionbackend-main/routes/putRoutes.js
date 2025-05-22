const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');

const {authenticateToken} = require('../middleware/authMiddleware');
const adminController = require('../controllers/userController/adminController');
const adjustmentController = require('../controllers/adjustmentController/adjustmentController');
const currencyController = require('../controllers/currencyController/currencyController');
const customersController = require('../controllers/customerController/customerController');
const expensesController = require('../controllers/expensesController/expensesController');
const expensesControllerCategory = require('../controllers/expensesController/expensesCatController');
const purchaseReturnController = require('../controllers/purchaseController/purchaseReturnController');
const reportController = require('../controllers/reportController/reportController');
const customerReportController = require('../controllers/reportController/customerReportController');
const suplierReportController = require('../controllers/reportController/suplierReportController');
const stokeReportController = require('../controllers/reportController/stokeReportController');
const registerReportController = require('../controllers/reportController/registerReportController');
const purchaseController = require('../controllers/purchaseController/purchaseController');
const quatationController = require('../controllers/quatationController/quatationController');
const saleController = require('../controllers/saleController/saleController');
const saleReturnController = require('../controllers/saleReturnController/saleReturnController');
const permissionsController = require('../controllers/permissionsController/permissionsController');
const posController = require('../controllers/posController/posController');
const settingsController = require('../controllers/settingsController/settingsController');
const mailsettingsController = require('../controllers/settingsController/mailSettingsController');
const receiptettingsController = require('../controllers/settingsController/receiptSettingsController');
const prefixSettingsController = require('../controllers/settingsController/prefixSettingsController');
const suplierController = require('../controllers/suplierController/suplierController');
const transferController = require('../controllers/transferController/transferController');
const userController = require('../controllers/userController/userController');
const loginController = require('../controllers/userController/loginController'); 
const {sendResetCode} = require('../controllers/userController/forgetPasswordcontroller');
const changePasswordController = require('../controllers/userController/changePasswordController');
const warehouseController = require('../controllers/wherehouseController/warehouseController');
const productControll = require('../controllers/productController/productController');
const baseUnitControll = require('../controllers/productController/baseUnitController');
const brandsControll = require('../controllers/productController/brandController');
const categoryController= require('../controllers/productController/categoryController');
const unitControll = require('../controllers/productController/unitController');
const productVariationController = require('../controllers/productController/variationController');
const staffRefreshmentsController  = require('../controllers/staffRefreshmentsController/staffRefreshmentsController');
const OffersController = require('../controllers/OffersController/OffersController');


//MULTER MIDDLEWARE
const baseUploadDir = path.resolve(__dirname, '../uploads');

// Ensure the base uploads folder exists
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine subfolder based on route
        let subFolder;
        if (req.originalUrl.includes('/updateProduct/')) {
            subFolder = 'product';
        } else if (req.originalUrl.includes('/updateBrand/')) {
            subFolder = 'brand';
        } else if (req.originalUrl.includes('/updateCategory/')) {
            subFolder = 'category';
        } 
        else if (req.originalUrl.includes('/updateUser')) {
            subFolder = 'user';
        }else {
            subFolder = 'others'; // Fallback if no matching route 
        }

        // Create the specific folder if it doesn't exist
        const uploadDir = path.join(baseUploadDir, subFolder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir); // Save files in the specific folder
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`); // Unique filename
    }
});

// Initialize multer
const upload = multer({ storage });



router.put('/updateProductQty', posController.updateProductQuantities);

router.put('/updateAdjustment/:id' , adjustmentController.updateAdjustment);

router.put('/updateCurrency/:id', currencyController.updateCurrency);

router.put('/editCustomerProfileByAdmin' , customersController.UpdateCustomer);

router.put('/updateExpenses/:id', expensesController.updateExpenses);

router.put('/updateExpensesCategory/:id', expensesControllerCategory.updateExpensesCategory);

router.put('/updatePurchaseReturn/:id' ,purchaseReturnController.updatePurchaseReturn);

router.put('/updatePuchase/:id' ,purchaseController.updatePurchase);

router.put('/updateQuatation/:id',quatationController.updateQuatation);

router.put('/updatePermissions', permissionsController.updatePermissions);

router.put('/updateReturnSale/:id',saleReturnController.updateReturnSale);

router.put('/updateSale/:id' , saleController.updateSale);

router.put('/editSuplierProfileByAdmin' , suplierController.UpdateSuplier);

router.put('/updateTransfer/:id' , transferController.updateTransfer);

router.put('/changepassword/:id', changePasswordController.changePassword);

router.put('/editWarehouseByAdmin' , warehouseController.UpdateWarehouse);

router.put('/updateProduct/:id', upload.single('image'), productControll.updateProduct);

router.put('/updateBaseUnit', baseUnitControll.updateBaseUnit);

router.put('/updateBrand/:id', upload.single('logo'), brandsControll.updateProductBrands); 

router.put('/updateCategory/:id', upload.single('logo'), categoryController.updateCategory);

router.put('/updateUnit/:id', unitControll.updateProductUnit);

router.put('/updateProductVariation/:id',productVariationController.updateProductVariation);

router.put('/updateUser', upload.single('profileImage'), userController.updateUser);

router.put('/updateStaffRefreshment/:id', staffRefreshmentsController.editStaffRefreshmentRecord);

router.put('/editOffer/:id', OffersController.updateOffer);



module.exports = router;













