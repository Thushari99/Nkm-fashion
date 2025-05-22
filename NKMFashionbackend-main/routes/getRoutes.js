const express = require('express');
const router = express.Router();
const Sale = require('../models/saleModel')
const Purchase = require('../models/purchaseModel')


const {authenticateToken} = require('../middleware/authMiddleware');
const adminController = require('../controllers/userController/adminController');
const adjustmentController = require('../controllers/adjustmentController/adjustmentController');
const currencyController = require('../controllers/currencyController/currencyController');
const customersController = require('../controllers/customerController/customerController');
const expensesController = require('../controllers/expensesController/expensesController');
const expensesCatController = require('../controllers/expensesController/expensesCatController');
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
const {changePassword} = require('../controllers/userController/changePasswordController');
const warehouseController = require('../controllers/wherehouseController/warehouseController');
const upload = require('../middleware/multerMiddleware')
const productController = require('../controllers/productController/productController');
const baseUnitController = require('../controllers/productController/baseUnitController');
const brandsController = require('../controllers/productController/brandController');
const categoryController= require('../controllers/productController/categoryController');
const unitController = require('../controllers/productController/unitController');
const productVariationController = require('../controllers/productController/variationController');
const barcodeController = require('../controllers/productController/barcodeController');
const cashController = require('../controllers/posController/cashController');
const saleReturnSendToSupplier = require('../controllers/saleReturnController/saleReturnSendToSupplier');
const staffRefreshmentsController  = require('../controllers/staffRefreshmentsController/staffRefreshmentsController');
const OffersController = require('../controllers/OffersController/OffersController');

//Making routes for customers
router.get('/initialDataFetching', authenticateToken, adminController.getInitialData);

router.get('/findOneProduct', posController.findProductByKeyword);

router.get('/viewAllHeldProducts', posController.viewAllHeldProducts);

router.get('/findAdjustmentById/:id',adjustmentController.findAdjustmentByIdForUpdate);

router.get('/getActiveCashRegister', cashController.getCashRegister)

router.get('/getCustomerForUpdate/:id' ,customersController.getCustomerForUpdate);

router.get('/searchCustomerByName', customersController.searchCustomerByName);

router.get('/getAllExpenses', expensesController.getAllExpenses);

router.get('/findExpensesByCategory', expensesController.getExpensesByCategory);

router.get('/findExpensesById/:id' , expensesController.findExpensesById);

//expense routes category
router.get('/viewExpenses', expensesCatController.getAllExpensesCat);
router.get('/findExpensesCatByName',expensesCatController.findExpensesCatByName);
router.get('/findExpensesById',expensesCatController.findExpensesById);

router.get('/viewPurchaseReturns' , purchaseReturnController.fetchAllPurchaseReturns);
// router.get('/findPurchaseReturnBySuplierName' , purchaseReturnController.findPurchasReturnBySuplier);
router.get('/findPurchaseReturnById/:id', purchaseReturnController.findPurchaseReturnById);

router.get('/findPurchaseById/:id', purchaseController.findPurchaseById);

router.get('/findQuatationById/:id', quatationController.findQuatationById);

//sale routes
router.get('/getReportData/:warehouse',reportController.getReportData);
router.get('/getTodayReportData/:warehouse', reportController.getTodayReportData);
router.get('/getLastWeekReportData/:warehouse', reportController.getLastWeekReportData);
router.get('/getLastMonthReportData/:warehouse', reportController.getLastMonthReportData);
router.get('/getLastYearReportData/:warehouse', reportController.getLastYearReportData);
router.get('/getFilteredReportData', reportController.getFillteredReportData );


//Making routes for suplier reports 
router.get('/allSuplierReport', suplierReportController.allSuplierReport);
router.get('/allSuplierReportById/:name' , suplierReportController.allSuplierReportById);
router.get('/findReportBySuplier', suplierReportController.findReportBySuplier);

router.get('/returnProductLostReport' ,saleReturnController.getTotalReturnAmount);
router.get('/returnProductLostReport/today', saleReturnController.getTodayReturnAmount);
router.get('/returnProductLostReport/lastweek', saleReturnController.getLastWeekReturnAmount);
router.get('/returnProductLostReport/lastmonth', saleReturnController.getLastMonthReturnAmount);
router.get('/returnProductLostReport/lastyear', saleReturnController.getLastYearReturnAmount);

router.get('/fetchTodaySales/today', saleController.fetchTodaySales);
router.get('/fetchLastWeekSales/lastweek', saleController.fetchLastWeekSales);
router.get('/fetchLastMonthSales/lastmonth', saleController.fetchLastMonthSales);
router.get('/fetchLastYearSales/lastyear', saleController.fetchLastYearSales);

//Making routes for stoke reports
router.get('/findStokeReport/:warehouse', stokeReportController.findAllStoke);
router.get('/findStokeReportByCode', stokeReportController.findStokeReportByCode);
router.get('/findProductDetailsById/:id',stokeReportController.findProductDetailsById);

//Making routes for register reports
router.get('/findRegisterData',registerReportController.getAllRegistry);

router.get('/generateHoldReferenceNo', posController.generateReferenceNo);

//Making routes for permissions
router.get('/getJobRoles',permissionsController.FetchingPermissions);
router.get('/findRole', permissionsController.FindRole);
router.get('/findRoleForUpdate/:id', permissionsController.findRoleForUpdate);
router.put('/updatePermissions', permissionsController.updatePermissions);

 router.get('/findSaleReturnById/:id' ,saleReturnController.findSaleReturnById);


//Making routes for sales
// router.get('/viewSale', saleController.getSales);
// router.get('/findSalaByNameOrId',saleController.findSalaByNameOrId)
router.get('/getPaymentOfSaleById/:saleId', saleController.fetchPaymentBySaleId);
router.get('/findSaleById/:id' ,saleController.findSaleById);

router.get('/printInvoice/:saleId', saleController.printInvoice);

router.get('/getPaymentOfPurchaseById/:purchaseId', purchaseController.fetchPaymentByPurchaseId);


//Making routes for settings
router.get('/getSettings', settingsController.getSettings);
router.get('/getMailSettings', mailsettingsController.getMailSettings);
router.get('/getReceiptSettings', receiptettingsController.getReceiptSettings);
router.get('/getRefixSettings', prefixSettingsController.getRefixSettings);

//Making routes for transfer
router.get('/viewTransfer' , transferController.getTransfer);
router.get('/findTransferById', transferController.findTransferById);
router.get('/findTransferById/:id',transferController.findTransferByIdForUpdate);


//Making routes for users
router.get('/dashboard', authenticateToken, loginController.getDashboardData);

router.get('/searchProductByName', barcodeController.searchProductByName);

router.get('/findAllProduct', productController.findAllProducts);

router.get('/findproductByCode', productController.findProductById);

router.get('/findProductByName', productController.searchProductByName);

router.get('/findProductForUpdate/:id', productController.findProductForUpdate);

router.get('/getBaseUnitForUpdate/:id', baseUnitController.getBaseUnitForUpdate);

router.get('/allBaseUnit', baseUnitController.findAllBaseUnits);

router.get('/getBrandForUpdate/:id', brandsController.getBrandsForUpdate); 

router.get('/findBrand', brandsController.findAllProductBrands);

router.get('/getCategoryForUpdate/:id', categoryController.getCategoryForUpdate);

router.get('/findCategory', categoryController.findAllCategories);

router.get('/getUnitForUpdate/:id', unitController.getUnitForUpdate);

router.get('/findAllUnit', unitController.findAllProductUnit);

router.get('/getVariationForUpdate/:id', productVariationController.getVariationForUpdate);

router.get('/findAllVariations', productVariationController.findAllProductVariations);

router.get('/getAdminPasswordForDiscount' , posController.getAdminPasswordForDiscount);

router.get('/fetchOffers', OffersController.fetchOffers);

router.get('/searchOffers', OffersController.searchOffers);

router.get('/findOfferById/:id', OffersController.offerFindById);

//updated routes
router.get('/fetchAdjustments', adjustmentController.fetchAdjustments);

router.get('/fetchCurrency', currencyController.fetchCurrencies);

router.get('/fetchCustomer', customersController.fetchCustomers);

router.get('/getExpensesCategory', expensesCatController.getExpensesCategory);

router.get('/getExpenses', expensesController.getExpenses);

router.get('/getRole', permissionsController.getRole);
 
router.get('/getQuatation',quatationController.getQuatation);

router.get('/zreading', posController.getAllZReadingDetails);

router.get('/getZreadingByDate', posController.getAllZReadingByDate);

router.get('/getCustomerReport',customerReportController.getCustomerReport);

//router.get('/getSuplierReport',suplierReportController.getSupplierReport);

router.get('/fetchSupplier', suplierController.fetchSupplier);

router.get('/fetchWarehouses', warehouseController.fetchWarehouses);

router.get('/fetchBaseUnits', baseUnitController.fetchBaseUnits);

router.get('/getProduct', posController.findProducts);

router.get('/fetchBrands', brandsController.fetchBrands);

router.get('/fetchCategories', categoryController.fetchCategories);

router.get('/fetchUnits', unitController.fetchUnits);

router.get('/fetchVariations', productVariationController.fetchVariations);

router.get('/fetchPurchase', purchaseController.fetchPurchases);

router.get('/fetchPurchaseReturns', purchaseReturnController.fetchPurchaseReturns);

router.get('/fetchSales', saleController.fetchSales);

router.get('/fetchSaleReturns', saleReturnController.fetchSaleReturns);   

router.get('/fetchTransferDetails', transferController.fetchTransferDetails);

router.get('/fetchUsers', userController.fetchUsers);

router.get('/fetchReturnsProdutData/:supplier', saleReturnSendToSupplier.fetchSaleReturnProducts);

//THIS ROUTE ADDED TEMPORY FOR POS

router.get('/findAllProductsForPos', posController.findAllProductsForPos);

router.get('/fetchStaffRefreshments', staffRefreshmentsController.getStaffRefreshmentRecords);

//Making routes for cutomer reports 
router.get('/allCustomerReport', reportController.allCustomerReport)
router.get('/allCustomerReportById/:name' ,reportController.allCustomerReportById)
router.get('/findReportByCustomer', reportController.findReportByCustomer)
router.get('/searchBaseunit', baseUnitController.searchBaseunits)
router.get('/searchUnit', unitController.searchUnits)
router.get('/searchProduct', productController.searchProducts)
router.get('/searchVariation', productVariationController.searchVariations)
router.get('/searchBrand', brandsController.searchBrands)
router.get('/searchCategory', categoryController.searchCategories)
router.get('/searchCustomer', customersController.searchCustomers)
router.get('/searchUser', userController.searchUsers)
router.get('/searchSupplier', suplierController.searchSuppliers)
router.get('/searchWarehouse', warehouseController.searchWarehouse)
router.get('/searchTransfer', transferController.searchTransfers)
router.get('/searchSale', saleController.searchSale)
router.get('/searchSaleReturn', saleReturnController.searchSaleReturns)
router.get('/searchPurchase', purchaseController.searchPurchase)
router.get('/searchPurchaseReturn', purchaseReturnController.searchPurchaseReturns)
router.get('/searchQuotation', quatationController.searchQuotation)
router.get('/searchCurrency', currencyController.searchCurrency)
router.get('/searchExpense', expensesController.searchExpense)
router.get('/searchExpenseCategory', expensesCatController.searchExpenseCategory)
router.get('/searchAdjustment', adjustmentController.searchAdjustment)

// Define the endpoint to fetch sales data by month
router.get('/sales/monthly', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const sales = await Sale.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    totalSales: { $sum: "$grandTotal" },
                    pureProfit: { $sum: "$pureProfit"},
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    month: "$_id",
                    totalSales: 1,
                    pureProfit: 1,
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { month: 1 }
            }
        ]);

        res.json(sales);
    } catch (error) {
        console.error('Error fetching monthly sales data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/sales/weekly', async (req, res) => {
    try {
        const sales = await Sale.aggregate([
            {
                $group: {
                    _id: { $isoWeek: "$date" },
                    totalSales: { $sum: "$grandTotal" },
                    pureProfit: { $sum: "$pureProfit"},
                    count: { $sum: 1 },
                    startDate: { $min: "$date" }
                }
            },
            {
                $project: {
                    week: "$_id",
                    totalSales: 1,
                    pureProfit: 1,
                    count: 1,
                    startDate: 1,
                    _id: 0
                }
            },
            {
                $sort: { week: 1 }
            }
        ]);

        res.json(sales);
    } catch (error) {
        console.error('Error fetching weekly sales data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/sales/daily', async (req, res) => {
    try {
        const sales = await Sale.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalSales: { $sum: "$grandTotal" },
                    pureProfit: { $sum: "$pureProfit"},
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id",
                    totalSales: 1,
                    pureProfit: 1,
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { date: 1 }
            }
        ]);

        res.json(sales);
    } catch (error) {
        console.error('Error fetching daily sales data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/purchases/monthly', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const purchases = await Purchase.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    totalPurchases: { $sum: "$grandTotal" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    month: "$_id",
                    totalPurchases: 1,
                    count: 1,
                    _id: 0,
                    label: { $concat: [{ $toString: "$_id" }, " ", { $toString: currentYear }] }
                }
            },
            {
                $sort: { month: 1 }
            }
        ]);

        res.json(purchases);
    } catch (error) {
        console.error('Error fetching monthly purchase data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/purchases/weekly', async (req, res) => {
    try {
        const purchases = await Purchase.aggregate([
            {
                $group: {
                    _id: { $isoWeek: "$date" },
                    totalPurchases: { $sum: "$grandTotal" },
                    count: { $sum: 1 },
                    startDate: { $min: "$date" }
                }
            },
            {
                $project: {
                    week: "$_id",
                    totalPurchases: 1,
                    count: 1,
                    startDate: 1,
                    _id: 0
                }
            },
            {
                $sort: { week: 1 }
            }
        ]);

        res.json(purchases);
    } catch (error) {
        console.error('Error fetching weekly purchase data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/purchases/daily', async (req, res) => {
    try {
        const purchases = await Purchase.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalPurchases: { $sum: "$grandTotal" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id",
                    totalPurchases: 1,
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { date: 1 }
            }
        ]);

        res.json(purchases);
    } catch (error) {
        console.error('Error fetching daily purchase data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports=router;

