const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');
const { uploadLogo } = require('../middleware/multerMiddleware'); //

const adminController = require('../controllers/userController/adminController');
const adjustmentController = require('../controllers/adjustmentController/adjustmentController');
const currencyController = require('../controllers/currencyController/currencyController');
const customersController = require('../controllers/customerController/customerController');
const expensesController = require('../controllers/expensesController/expensesController');
const expensesCategoryController = require('../controllers/expensesController/expensesCatController');
const purchaseReturnController = require('../controllers/purchaseController/purchaseReturnController');
const sendPurchaseReturnToSupplier = require('../controllers/saleReturnController/saleReturnSendToSupplier');
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
const warehouseController = require('../controllers/wherehouseController/warehouseController');
const productControll = require('../controllers/productController/productController');
const baseUnitControll = require('../controllers/productController/baseUnitController');
const brandsControll = require('../controllers/productController/brandController');
const categoryController= require('../controllers/productController/categoryController');
const unitControll = require('../controllers/productController/unitController');
const productVariationController = require('../controllers/productController/variationController');
const cashController = require('../controllers/posController/cashController');
const bakerySaleController = require('../controllers/bakerySaleController/bakerySaleController');
const {verifyPermission} = require('../middleware/roleAuthMiddleware');
const OffersController = require('../controllers/OffersController/OffersController')
const staffRefreshmentsController = require('../controllers/staffRefreshmentsController/staffRefreshmentsController');


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
        if (req.originalUrl.includes('/createProduct')) {
            subFolder = 'product';
        } else if (req.originalUrl.includes('/createBrand')) {
            subFolder = 'brand';
        } else if (req.originalUrl.includes('/createCategory')) {
            subFolder = 'category';
        } else {
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


router.post('/cashHandIn', cashController.cashHandIn);

router.post('/holdProducts',posController.holdProducts);

router.post('/getingHoldProductsQty', posController.getProductsByIds);

//Making routes for customers 
router.post('/createAdjustment', adjustmentController.createAdjustment);

router.post('/initialRunning', adminController.initialRunning);

router.post('/createCurrency', currencyController.createCurrency);

router.post('/createCustomer', customersController.createCustomer);

router.post('/walkInCustomer', customersController.walkInCustomer);

router.post('/importCustomers', customersController.ImportCustomer);

router.post('/createExpenses', expensesController.createExpenses);

router.post('/createExpensesCategory', expensesCategoryController.createExpensesCategory);

router.post('/returnPurchase', purchaseReturnController.returnPurchase);

router.post('/returnPurchaseToSupplier', sendPurchaseReturnToSupplier.sendPurchaseReturnToSupplier);

router.post('/createPurchase', purchaseController.createPurchase);

router.post('/createQuatation',quatationController.createQuatation);

router.post('/createPermissions', permissionsController.createPermissions);

router.post('/returnSale',saleReturnController.returnSale);

router.post('/createOffer', OffersController.CreateOffer);

router.post('/getDiscountAccess', posController.getAdminPasswordForDiscount);

//POS SALE
router.post('/createSale',saleController.createSale);

//END OF THE DAY BACKERY SALE
router.post('/createLastSale', bakerySaleController.createBackerySale);

router.post('/createNonPosSale',saleController.createNonPosSale);

router.post('/payingForSale', saleController.payingForSale);

router.post('/payingForPurchase', purchaseController.payingForPurchase);

router.post('/createOrUpdateSettings',uploadLogo.single("logo"), settingsController.createOrUpdateSettings);

router.post('/createOrUpdateMailSettings', mailsettingsController.createOrUpdateMailSettings);

router.post('/createOrUpdateReceiptSettings', receiptettingsController.createOrUpdateReceiptSettings);

router.post('/createOrUpdatePrefixSettings', prefixSettingsController.createOrUpdatePrefixSettings);

router.post('/importSuplier', suplierController.ImportSuplier);

router.post('/createSuplier', suplierController.createSuplier);

router.post('/createTransfer', transferController.createTransfer);

router.post('/addUser', userController.addUser);

router.post('/createWherehouse', warehouseController.createWarehouse);

router.post('/login', loginController.loginUser);

router.post('/forgetpassword',sendResetCode );

router.post('/createProduct', upload.single('image'), productControll.createProduct);

router.post('/createBaseUnit',baseUnitControll.createBaseUnit);

router.post('/findBaseUnit', baseUnitControll.findBaseUnit);

router.post('/createBrand', upload.single('logo'), brandsControll.createProductBrands);

router.post('/findOneBrand', brandsControll.findBrand); 

router.post('/createCategory',upload.single('logo'), categoryController.createCategory);

router.post('/findOneCategory', categoryController.findCategory);

router.post('/createUnit', unitControll.createProductUnit);

router.post('/findUnit', unitControll.findUnit);

router.post('/createVariation', productVariationController.createProductVariation);

router.post('/findVariation', productVariationController.findVariation);

router.post('/createStaffRefreshments', staffRefreshmentsController.createStaffRefreshment);

router.post('/saveZreadingBill', posController.saveZReading);


module.exports = router;
