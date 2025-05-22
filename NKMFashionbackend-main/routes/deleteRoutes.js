const express = require('express');
const router = express.Router();


const adjustmentController = require('../controllers/adjustmentController/adjustmentController');
const currencyController = require('../controllers/currencyController/currencyController');
const customersController = require('../controllers/customerController/customerController');
const expensesController = require('../controllers/expensesController/expensesController');
const expensesCatController = require('../controllers/expensesController/expensesCatController');
const purchaseReturnController = require('../controllers/purchaseController/purchaseReturnController');
const purchaseController = require('../controllers/purchaseController/purchaseController');
const quatationController = require('../controllers/quatationController/quatationController');
const saleController = require('../controllers/saleController/saleController');
const saleReturnController = require('../controllers/saleReturnController/saleReturnController');
const permissionsController = require('../controllers/permissionsController/permissionsController');
const posController = require('../controllers/posController/posController');
const settingsController = require('../controllers/settingsController/settingsController');
const suplierController = require('../controllers/suplierController/suplierController');
const transferController = require('../controllers/transferController/transferController');
const userController = require('../controllers/userController/userController');
const loginController = require('../controllers/userController/loginController'); 
const {sendResetCode} = require('../controllers/userController/forgetPasswordcontroller');
const {changePassword} = require('../controllers/userController/changePasswordController');
const warehouseController = require('../controllers/wherehouseController/warehouseController');
const productController = require('../controllers/productController/productController');
const baseUnitController = require('../controllers/productController/baseUnitController');
const barcodeController = require('../controllers/productController/barcodeController');
const brandsController = require('../controllers/productController/brandController');
const categoryController= require('../controllers/productController/categoryController');
const unitController = require('../controllers/productController/unitController');
const productVariationController = require('../controllers/productController/variationController');
const cashController = require('../controllers/posController/cashController');
const OffersController = require('../controllers/OffersController/OffersController')


router.delete('/deleteHeldProduct/:id', posController.deleteHeldProduct);

router.delete('/closeRegister/:id', cashController.closeRegister);

router.delete('/DeleteAdjustment/:id', adjustmentController.deleteAdjustment);

router.delete('/deleteCurrency/:id',currencyController.deleteCurrency);

router.delete('/DeleteCustomer/:id',customersController.DeleteCustomer);

router.delete('/deleteExpenses/:id', expensesController.deleteCExpenses);

router.delete('/deleteExpensesCategory/:id',expensesCatController.deleteExpensesCatergory);

router.delete('/DeletePurchaseReturn/:id' , purchaseReturnController.deletePurchaseReturn);

router.delete('/deleteProductFromPurchaseReturn', purchaseReturnController.removeProductFromPurchaseReturn);

router.delete('/deletePurchase/:id', purchaseController.deletePurchase);

router.delete('/DeleteQuatation/:id',quatationController.DeleteQuatation);

router.delete('/deleteRole/:id',permissionsController.DeleteRole);

router.delete('/removeProductFromSaleReturn',saleReturnController.removeProductFromSaleReturn);

router.delete('/DeleteSaleReturn/:id',saleReturnController.deleteSaleReturn);

router.delete('/DeleteSale/:id',saleController.deleteSale);

router.delete('/deletePayment/:id', saleController.deletePaymentOfSale);

router.delete('/deletePurchasePayment/:id', purchaseController.deletePaymentOfPurchase);

router.delete('/deleteProductFromSale',saleController.deleteProductFromSale);

router.delete('/DeleteSuplier/:id',suplierController.DeleteSuplier);

router.delete('/deleteTransfer/:id', transferController.deleteTransfer);

router.delete('/DeleteUser/:id', userController.deleteUser);

router.delete('/DeleteWarehouse/:id',warehouseController.DeleteWarehouse);

router.delete('/deleteProductFromAdjustment', adjustmentController.deleteProductFromAdjustment);

router.delete('/deleteProductFromPurchase', purchaseController.deleteProductFromPurchase);

router.delete('/deleteProductFromQuatation', quatationController.deleteProductFromQuatation);

router.delete('/deleteProductFromSale',saleController.deleteProductFromSale);

router.delete('/deleteProduct/:id', productController.deleteProduct);

router.delete('/deleteBaseUnit/:id', baseUnitController.deleteBaseUnit);

router.delete('/deleteBrand/:id', brandsController.deleteProductBrand);

router.delete('/deleteCategory/:id', categoryController.deleteCategory);

router.delete('/deleteUnit/:id', unitController.deleteProductUnit);

router.delete('/deleteVariation/:id', productVariationController.deleteProductVariation);

router.delete('/deleteOffer/:id', OffersController.deleteOffer);

router.delete('/DeleteZBill/:id', posController.deleteZReading);

module.exports = router;

