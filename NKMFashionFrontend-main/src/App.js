import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/auth/Login";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Importing components
import "@fortawesome/fontawesome-free/css/all.min.css";
import ForgetPassword from "./component/auth/ForgetPassword";
import SendOTP from "./component/auth/SendOTP";
import NewPassword from "./component/auth/NewPassword";
import PrivateRoute from "./component/routing/privateRoute";
import ReceiptSettingsInitiate from "./component/settings/ReceiptSettingsInitiate";
import PrefixSettingsInitiate from "./component/settings/PrefixSettingsInitiate";
import CreateProductBody from "./component/product/createProduct";
import EditProductBody from "./component/product/editProduct";
import MainLayout from "./component/layout/MainLayout";
import ViewProductsBody from "./component/product/viewProducts";
import DashboardBody from "./component/layout/DashboardCards";
import CreateUserBody from "./component/user/CreateUser";
import CreateAdminBody from "./component/admin/CreateAdmin";
import ProfileBody from "./component/user/ProfileBody";
import EditProfileByAdmin from "./component/admin/EditProfileByAdmin";
import CreateRoleBody from "./component/admin/CreateRole";
import ViewRoleAndPermissionBody from "./component/admin/ViewRoleAndPermission";
import EditPermissionsBody from "./component/admin/EditPermissions";
import CreateCustomerBody from "./component/customer/CreateCustomer";
import ViewCustomersBody from "./component/customer/ViewCustomers";
import CreateBarcodeBody from "./component/product/barcode/createBarcode";
import EditCustomerBody from "./component/customer/EditCustomer";
import CreateSuplierBody from "./component/supplier/CreateSupplier";
import ViewSuplierBody from "./component/supplier/ViewSuplier";
import EditSuplierBody from "./component/supplier/EditSuplier";
import CreateWhereHouseBody from "./component/warehouse/CreateWhereHouse";
import ViewWhereHouseBody from "./component/warehouse/ViewWhereHouse";
import EditWarehouseBody from "./component/warehouse/EditWarehouse";
import CreateBaseUnitBody from "./component/product/baseUnit/createBaseUnit";
import ViewBaseUnitBody from "./component/product/baseUnit/viewBaseUnit";
import EditBaseUnitBody from "./component/product/baseUnit/editBaseUnit";
import CreateUnitBody from "./component/product/units/createUnit";
import ViewUnitBody from "./component/product/units/viewUnit";
import EditUnitBody from "./component/product/units/editUnit";
import CreateVariationBody from "./component/product/variations/createVariation";
import ViewVariationBody from "./component/product/variations/viewVariation";
import EditVariationBody from "./component/product/variations/editVariation";
import CreateBrandsBody from "./component/product/brands/createBrands";
import ViewBrandsBody from "./component/product/brands/viewBrands";
import EditBrandBody from "./component/product/brands/editBrands";
import CreateProductCategoryBody from "./component/product/categories/createProductCategory";
import ViewCategoryBody from "./component/product/categories/viewCatergory";
import EditCatergoryBody from "./component/product/categories/editCategory";
import PosSystemBody from "./component/pos/components/PosSystemBody";
import CreateSaleBody from "./component/sales/CreateSale";
import ViewSaleBody from "./component/sales/ViewSale";
import EditSaleBody from "./component/sales/EditSale";
import ViewSale from "./component/sales/backerySales/ViewSale.jsx";
import CreateBackerySale from "./component/sales/backerySales/CreateBackerySale"
//import EditBackerySale from "./component/sales/backerySales/EditBackerySales"
import CreateSaleReturnBody from "./component/sales/saleReturns/CreateSaleReturn";
import ViewSaleReturnBody from "./component/sales/saleReturns/ViewSaleReturn";
import EditSaleReturnBody from "./component/sales/saleReturns/EditSaleReturn";
import CreatePurchaseBody from "./component/purchase/CreatePurchase";
import ViewPurchaseBody from "./component/purchase/ViewPurchase";
import EditPurchaseBody from "./component/purchase/EditPurchase";
import CreatePurchaseReturnBody from "./component/purchase/purchaseReturns/CreatePurchaseReturn";
import ViewPurchaseReturnBody from "./component/purchase/purchaseReturns/ViewPurchaseReturn";
import EditPurchaseReturnBody from "./component/purchase/purchaseReturns/EditPurchaseReturn";
import CreateQuatationBody from "./component/quotation/CreateQuatation";
import ViewQuatationBody from "./component/quotation/ViewQuatation";
import EditQuatationBody from "./component/quotation/EditQuatation";
import CreateSaleFromQuatationBody from "./component/quotation/CreateSaleFromQuatation";
import CreateAdjustmentBody from "./component/adjustment/CreateAdjustment";
import ViewAdjustmentBody from "./component/adjustment/ViewAdjustment";
import EditAdjustmentBody from "./component/adjustment/EditAdjustment";
import ViewCurrencyBody from "./component/currency/ViewCurrency";
import ViewExpensesCategoryBody from "./component/expenses/CreateExpensesCategory";
import CreateExpensesBody from "./component/expenses/CreateExpenses";
import ViewExpensesBody from "./component/expenses/ViewExpenses";
import EditExpensesBody from "./component/expenses/EditExpenses";
import ViewReportBody from "./component/reports/ViewReports";
import CustomerReportBody from "./component/reports/CustomerReportBody";
import ClickedCustomerReport from "./component/reports/ClickedCustomerReport";
import SuplierReportBody from "./component/reports/SuplierReportBody";
import ClickedSuplierReport from "./component/reports/ClickedSuplierRep";
import QuantityAlertReportBody from "./component/reports/QuantityAlertReportBody";
import ClickedStokeReport from "./component/reports/ClickedStokeReport";
import CreateTransferBody from "./component/transfers/CreateTransfer";
import ViewTransferBody from "./component/transfers/ViewTransfer";
import EditTransferBody from "./component/transfers/EditTransfer";
import SystemSettingsBody from "./component/settings/SystemSettings";
import MailSettingsBody from "./component/settings/MailSettings";
import ReceiptSettingsBody from "./component/settings/ReceiptSettings";
import PrefixSettingsBody from "./component/settings/prefixSettings";
import ViewUserBody from "./component/user/ViewUser";
import CreateSaleReturnForSupplier from "./component/sales/ReturnsToSupplier/CreateSaleReturnForSupplier";
import StaffRefreshments from "./component/sales/staffRefreshments/staffRefreshments";
import ProfitAndLost from "./component/reports/ProfitAndLost";
import PermissionGuard from "./component/guard/PermissionGuard";
import PermissionController from "./component/utill/permissionController";
import StokeReportBody from "./component/reports/ViewStokeReport";
import ViedRegisterReportBody from "./component/reports/ViewRegisterReport";
import { ToastContainer } from "react-toastify";
import Languages from "./component/utill/sidebarLanguage";
import Team from "./component/utill/navBar/team";
import Products from "./component/utill/navBar/products";
import ViewOffers from "./component/offers/ViewOffers";
import CreateOffers from "./component/offers/CreateOffers";
import EditOffer from "./component/offers/EditOffer";
import ZBill from "./component/zBill/zBill";
import { CurrencyProvider } from './context/CurrencyContext';
import { LogoProvider } from "./context/logoContext";


// PrivateRoute component to check if the cashRegisterID exists in sessionStorage
const PosPrivateRoute = ({ children }) => {
  const cashRegisterID = sessionStorage.getItem('cashRegisterID');
  if (!cashRegisterID) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <LogoProvider>
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Routes>
            {/* public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/forgetpassword" element={<ForgetPassword />} />
            <Route path="/newpassword" element={<NewPassword />} />
            <Route path="/sendOTP" element={<SendOTP />} />

            {/* private routes without MainLayout */}
            <Route
              path="/settingsInitiate"
              element={
                <PrivateRoute>
                  <ReceiptSettingsInitiate />
                </PrivateRoute>
              }
            />
            <Route
              path="/prefixsettingsInitiate"
              element={
                <PrivateRoute>
                  <PrefixSettingsInitiate />
                </PrivateRoute>
              }
            />
            {/* private routes */}
            <Route
              element={
                <PrivateRoute>
                  {/* <LogoProvider> */}
                  <MainLayout /> {/* Header and Sidebar always present */}
                  {/* </LogoProvider> */}
                </PrivateRoute>
              }
            >

              <Route path="/dashboard" element={<CurrencyProvider><DashboardBody /></CurrencyProvider>} />


              {/**crearte, read and edit USER BY ADMIN*/}
              <Route path="/createUser" element={
                <PermissionGuard requiredPermissions={["create_user"]}>
                  <CreateUserBody />
                </PermissionGuard>
              } />
              <Route path="/createAdmin" element={
                <PermissionGuard requiredPermissions={["create_user"]}>
                  <CreateAdminBody />
                </PermissionGuard>
              } />
              <Route path="/users" element={
                <PermissionGuard requiredPermissions={["view_user"]}>
                  <ViewUserBody />
                </PermissionGuard>
              } />
              <Route path="/profile" element={<ProfileBody />} />
              <Route path="/editprofilebyadmin/:id" element={
                <PermissionGuard requiredPermissions={["view_user"]}>
                  <EditProfileByAdmin />
                </PermissionGuard>
              } />
              <Route path="/language" element={
                <PermissionGuard requiredPermissions={["view_language"]}>
                  <Languages />
                </PermissionGuard>
              } />

              {/* Navbar items */}
              <Route path="/team" element={<Team />} />
              <Route path="/products" element={<Products />} />


              {/**creat read and update PERMISSIONS*/}
              <Route path="/createRoleAndPermissions" element={
                <PermissionGuard requiredPermissions={["create_role"]}>
                  <CreateRoleBody />
                </PermissionGuard>} />
              <Route path="/viewRoleAndPermissions" element={
                <PermissionGuard requiredPermissions={["view_role"]}>
                  <ViewRoleAndPermissionBody />
                </PermissionGuard>} />
              <Route path="/editPermissions/:id" element={
                <PermissionGuard requiredPermissions={["edit_role"]}>
                  <EditPermissionsBody />
                </PermissionGuard>} />

              {/**creat read and update CUSTOMER*/}
              <Route path="/createCustomer" element={
                <PermissionGuard requiredPermissions={["create_customer"]}>
                  <CreateCustomerBody />
                </PermissionGuard>} />
              <Route path="/viewCustomers" element={
                <PermissionGuard requiredPermissions={["view_customer"]}>
                  <ViewCustomersBody />
                </PermissionGuard>} />
              <Route path="/editCustomerDetails/:id" element={
                <PermissionGuard requiredPermissions={["edit_customer"]}>
                  <EditCustomerBody />
                </PermissionGuard>} />

              {/**creat read and update SUPLIER*/}
              <Route path="/createSuplier" element={
                <PermissionGuard requiredPermissions={['create_supplier']}>
                  <CreateSuplierBody />
                </PermissionGuard>} />
              <Route path="/viewSuplier" element={
                <PermissionGuard requiredPermissions={['view_supplier']}>
                  <ViewSuplierBody />
                </PermissionGuard>} />
              <Route path="/editSuplier/:id" element={
                <PermissionGuard requiredPermissions={['edit_supplier']}>
                  <EditSuplierBody />
                </PermissionGuard>} />

              {/**creat read and update WAREHOUSE*/}
              <Route path="/createWarehouse" element={
                <PermissionGuard requiredPermissions={['create_warehouse']}>
                  <CreateWhereHouseBody />
                </PermissionGuard>} />
              <Route path="/viewWarehouse" element={
                <PermissionGuard requiredPermissions={['view_warehouse']}>
                  <ViewWhereHouseBody />
                </PermissionGuard>} />
              <Route path="/editWarehouse/:id" element={
                <PermissionGuard requiredPermissions={['edit_warehouse']}>
                  <EditWarehouseBody />
                </PermissionGuard>} />

              {/**creat read and update BASE UNIT*/}
              <Route path="/createBaseUnit" element={
                <PermissionGuard requiredPermissions={['create_baseunit']}>
                  <CreateBaseUnitBody />
                </PermissionGuard>} />
              <Route path="/viewBaseUnit" element={
                <PermissionGuard requiredPermissions={['view_baseunit']}>
                  <ViewBaseUnitBody />
                </PermissionGuard>} />
              <Route path="/editBaseUnit/:id" element={
                <PermissionGuard requiredPermissions={['edit_baseunit']}>
                  <EditBaseUnitBody />
                </PermissionGuard>} />

              {/**creat read and update UNIT*/}
              <Route path="/createUnit" element={
                <PermissionGuard requiredPermissions={['create_unit']}>
                  <CreateUnitBody />
                </PermissionGuard>} />
              <Route path="/viewUnit" element={
                <PermissionGuard requiredPermissions={['view_unit']}>
                  <ViewUnitBody />
                </PermissionGuard>} />
              <Route path="/editUnit/:id" element={
                <PermissionGuard requiredPermissions={['edit_unit']}>
                  <EditUnitBody />
                </PermissionGuard>} />

              {/**creat read and update VARIATION*/}
              <Route path="/createVariation" element={
                <PermissionGuard requiredPermissions={['create_variation']}>
                  <CreateVariationBody />
                </PermissionGuard>} />
              <Route path="/viewVariation" element={
                <PermissionGuard requiredPermissions={['view_variation']}>
                  <ViewVariationBody />
                </PermissionGuard>} />
              <Route path="/editVariation/:id" element={
                <PermissionGuard requiredPermissions={['edit_variation']}>
                  <EditVariationBody />
                </PermissionGuard>} />

              {/**creat read and update BRANDS*/}
              <Route path="/createBrands" element={
                <PermissionGuard requiredPermissions={['create_brand']}>
                  <CreateBrandsBody />
                </PermissionGuard>} />
              <Route path="/viewBrands" element={
                <PermissionGuard requiredPermissions={['view_brand']}>
                  <ViewBrandsBody />
                </PermissionGuard>} />
              <Route path="/editBrands/:id" element={
                <PermissionGuard requiredPermissions={['edit_brand']}>
                  <EditBrandBody />
                </PermissionGuard>} />

              {/**creat read and update CATEGORY*/}
              <Route path="/createCategory" element={
                <PermissionGuard requiredPermissions={['create_category']}>
                  <CreateProductCategoryBody />
                </PermissionGuard>} />
              <Route path="/viewCategory" element={
                <PermissionGuard requiredPermissions={['view_category']}>
                  <ViewCategoryBody />
                </PermissionGuard>} />
              <Route path="/editCategory/:id" element={
                <PermissionGuard requiredPermissions={['edit_category']}>
                  <EditCatergoryBody />
                </PermissionGuard>} />

              {/**create , read ,and update product */}
              <Route path="/createProduct" element={
                <PermissionGuard requiredPermissions={["create_product"]}>
                  <CurrencyProvider>
                    <CreateProductBody />
                  </CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewProducts" element={
                <PermissionGuard requiredPermissions={["view_product"]}>
                  <CurrencyProvider>
                    <ViewProductsBody />
                  </CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editProduct/:id" element={
                <PermissionGuard requiredPermissions={['edit_product']}>
                  <CurrencyProvider>
                    <EditProductBody />
                  </CurrencyProvider>
                </PermissionGuard>} />

              {/**Barcode creating and printing */}
              <Route path="/barcodePrint" element={
                <PermissionGuard requiredPermissions={['create_barcode']}>
                  <CurrencyProvider>
                    <CreateBarcodeBody />
                  </CurrencyProvider>
                </PermissionGuard>} />


              {/*Create sale*/}
              <Route path="/createSale" element={
                <PermissionGuard requiredPermissions={['create_sale']}>
                  <CurrencyProvider><CreateSaleBody /></CurrencyProvider>
                </PermissionGuard>
              } />
              <Route path="/viewSale" element={
                <PermissionGuard requiredPermissions={['view_sale']}>
                  <CurrencyProvider><ViewSaleBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewBackerySale" element={
                <PermissionGuard requiredPermissions={['view_sale']}>
                  <CurrencyProvider><ViewSale /></CurrencyProvider>ViewSale
                </PermissionGuard>} />
              <Route path="/editSale/:id" element={
                <PermissionGuard requiredPermissions={['edit_sale']}>
                  <CurrencyProvider><EditSaleBody /></CurrencyProvider>
                </PermissionGuard>} />
              {/* <Route path="/editBackerySale/:id" element={
              <PermissionGuard requiredPermissions={['edit_sale']}>
              <CurrencyProvider><EditBackerySales/></CurrencyProvider>
              </PermissionGuard>} /> */}
              <Route path="/createEndOfTheDaySale" element={
                <PermissionGuard requiredPermissions={['create_sale']}>
                  <CurrencyProvider><CreateBackerySale /></CurrencyProvider>
                </PermissionGuard>} />


              {/*Create sale return*/}
              <Route path="/createSaleReturn/:id" element={
                <PermissionGuard requiredPermissions={['return_sale']}>
                  <CurrencyProvider><CreateSaleReturnBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewSaleReturns" element={
                <PermissionGuard requiredPermissions={['view_sl_return']}>
                  <CurrencyProvider><ViewSaleReturnBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editSaleReturn/:id" element={
                <PermissionGuard requiredPermissions={['edit_sl_return']}>
                  <CurrencyProvider><EditSaleReturnBody /></CurrencyProvider>
                </PermissionGuard>} />

              {/* Staff refreshments */}
              <Route path="/staffRefreshments" element={
                <PermissionGuard requiredPermissions={['view_sale']}>
                  <CurrencyProvider><StaffRefreshments /></CurrencyProvider>
                </PermissionGuard>
              } />

              <Route path="/saleReturnsToSupplier" element={
                <PermissionGuard requiredPermissions={['return_purchase']}>
                  <CurrencyProvider><CreateSaleReturnForSupplier /></CurrencyProvider>
                </PermissionGuard>
              } />

              {/* Create purchase CreatePurchase */}
              <Route path="/createPurchase" element={
                <PermissionGuard requiredPermissions={['create_purchase']}>
                  <CurrencyProvider><CreatePurchaseBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewPurchase" element={
                <PermissionGuard requiredPermissions={['view_purchase']}>
                  <CurrencyProvider><ViewPurchaseBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editPurchase/:id" element={
                <PermissionGuard requiredPermissions={['edit_purchase']}>
                  <CurrencyProvider><EditPurchaseBody /></CurrencyProvider>
                </PermissionGuard>} />

              {/*Create purchase return*/}
              <Route path="/createPurchaseReturn/:id" element={
                <PermissionGuard requiredPermissions={['return_purchase']}>
                  <CurrencyProvider><CreatePurchaseReturnBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/saleReturnsToSupplier" element={
                <PermissionGuard requiredPermissions={['return_purchase']}>
                  <CurrencyProvider><CreateSaleReturnForSupplier /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewPurchaseReturns" element={
                <PermissionGuard requiredPermissions={['view_pur_return']}>
                  <CurrencyProvider><ViewPurchaseReturnBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editPurchaseReturn/:id" element={
                <PermissionGuard requiredPermissions={['edit_pur_return']}>
                  <CurrencyProvider><EditPurchaseReturnBody /></CurrencyProvider>
                </PermissionGuard>} />

              {/*Create quatation*/}
              <Route path="/createQuotation" element={
                <PermissionGuard requiredPermissions={['create_quotation']}>
                  <CurrencyProvider><CreateQuatationBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewQuotation" element={
                <PermissionGuard requiredPermissions={['view_quotation']}>
                  <CurrencyProvider><ViewQuatationBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editQuotation/:id" element={
                <PermissionGuard requiredPermissions={['edit_quotation']}>
                  <CurrencyProvider><EditQuatationBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/createSaleFromQuotation/:id" element={
                <PermissionGuard requiredPermissions={['create_sl_quotation']}>
                  <CurrencyProvider><CreateSaleFromQuatationBody /></CurrencyProvider>
                </PermissionGuard>} />

              {/*Create adjustment*/}
              <Route path="/createAdjustment" element={
                <PermissionGuard requiredPermissions={['create_adjustment']}>
                  <CurrencyProvider><CreateAdjustmentBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewAdjustment" element={
                <PermissionGuard requiredPermissions={['view_adjustment']}>
                  <CurrencyProvider><ViewAdjustmentBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editAdjustment/:id" element={
                <PermissionGuard requiredPermissions={['edit_adjustment']}>
                  <CurrencyProvider><EditAdjustmentBody /></CurrencyProvider>
                </PermissionGuard>} />

              {/*Create currency*/}
              <Route path="/viewCurrency" element={
                <PermissionGuard requiredPermissions={['view_currency']}>
                  <ViewCurrencyBody />
                </PermissionGuard>} />

              {/*Create expenses category*/}
              <Route path="/viewExpensesCategory" element={
                <PermissionGuard requiredPermissions={['view_exp_category']}>
                  <ViewExpensesCategoryBody />
                </PermissionGuard>} />

              {/*Create expenses*/}
              <Route path="/createExpenses" element={
                <PermissionGuard requiredPermissions={['create_expense']}>
                  <CurrencyProvider><CreateExpensesBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewExpenses" element={
                <PermissionGuard requiredPermissions={['view_expense']}>
                  <CurrencyProvider><ViewExpensesBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editExpenses/:id" element={
                <PermissionGuard requiredPermissions={['edit_expense']}>
                  <CurrencyProvider><EditExpensesBody /></CurrencyProvider>
                </PermissionGuard>} />
              {/* 
            View Reports */}
              <Route path="/viewReport" element={<CurrencyProvider><ViewReportBody /></CurrencyProvider>} />
              <Route path="/customerReport" element={<CurrencyProvider><CustomerReportBody /></CurrencyProvider>} />
              <Route path="/viewCustomerRep/:sale" element={<CurrencyProvider><ClickedCustomerReport /></CurrencyProvider>} />
              <Route path="/suplierReport" element={<CurrencyProvider><SuplierReportBody /></CurrencyProvider>} />
              <Route path="/viewSuplierRep/:sale" element={<CurrencyProvider><ClickedSuplierReport /></CurrencyProvider>} />
              <Route path="/viewStokeRep" element={<CurrencyProvider><StokeReportBody /></CurrencyProvider>} />
              <Route path="/quantityAlertRep" element={<CurrencyProvider><QuantityAlertReportBody /></CurrencyProvider>} />
              <Route path="/viewRegisterRep" element={<CurrencyProvider><ViedRegisterReportBody /></CurrencyProvider>} />
              <Route path="/clickedStokeRep/:id" element={<CurrencyProvider><ClickedStokeReport /></CurrencyProvider>} />
              <Route path="/profitAndLostReport" element={<CurrencyProvider><ProfitAndLost /></CurrencyProvider>} />

              {/* Transfer routes */}
              <Route path="/createTransfer" element={
                <PermissionGuard requiredPermissions={['create_transfer']}>
                  <CurrencyProvider><CreateTransferBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/viewTransfer" element={
                <PermissionGuard requiredPermissions={['view_transfer']}>
                  <CurrencyProvider><ViewTransferBody /></CurrencyProvider>
                </PermissionGuard>} />
              <Route path="/editTransfer/:id" element={
                <PermissionGuard requiredPermissions={['edit_transfer']}>
                  <CurrencyProvider><EditTransferBody /></CurrencyProvider>
                </PermissionGuard>} />


              {/* offers managing */}
              <Route path="/viewOffers" element={
                <PermissionGuard requiredPermissions={['view_offer']}><ViewOffers />
                </PermissionGuard>} />

              <Route path="/createOffers" element={
                <PermissionGuard requiredPermissions={['create_offer']}><CreateOffers />
                </PermissionGuard>} />

              <Route path="/editOffers/:id" element={
                <PermissionGuard requiredPermissions={['edit_offer']}><EditOffer />
                </PermissionGuard>} />


              <Route path="/mailSettings" element={<MailSettingsBody />} />
              <Route path="/receiptSettings" element={<ReceiptSettingsBody />} />
              <Route path="/prefixSettings" element={<PrefixSettingsBody />} />

              <Route path="/zBillRecords" element={
                <PermissionGuard requiredPermissions={['view_zbills']}>
                  <CurrencyProvider><ZBill /></CurrencyProvider>
                </PermissionGuard>}
              />

              {/* Setting routes */}
              <Route path="/settings" element={<SystemSettingsBody />} />
              <Route path="/mailSettings" element={<MailSettingsBody />} />
              <Route path="/receiptSettings" element={<ReceiptSettingsBody />} />
              <Route path="/prefixSettings" element={<PrefixSettingsBody />} />
            </Route>

            <Route path="/posSystem" element={<PosPrivateRoute><CurrencyProvider><PosSystemBody /></CurrencyProvider></PosPrivateRoute>} />
          </Routes>

        </div>
      </LogoProvider>
    </Router>
  );
}

export default App;
