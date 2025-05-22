import { useState, useEffect } from 'react';
import '../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box'
import { toast } from 'react-toastify';

const CreateRoleBody = () => {
    // Define categories for permissions
    const permissionCategories = {
        manageProducts: ["create_product", "edit_product", "delete_product", "view_product"],
        manageBaseUnits: ["create_baseunit", "edit_baseunit", "delete_baseunit", "view_baseunit"],
        manageUnits: ["create_unit", "edit_unit", "delete_unit", "view_unit"],
        manageVariation: ["create_variation", "edit_variation", "delete_variation", "view_variation"],
        manageBrands: ["create_brand", "edit_brand", "delete_brand", "view_brand"],
        manageCategory: ["create_category", "edit_category", "delete_category", "view_category"],
        manageBarcodePrint: ["create_barcode", "print_barcode"],
        manageCustomers: ["create_customer", "import_customer", "edit_customer", "delete_customer", "view_customer"],
        manageUsers: ["create_user", "edit_user", "delete_user", "view_user"],
        manageSuppliers: ["create_supplier", "edit_supplier", "delete_supplier", "view_supplier", "import_supplier"],
        manageWarehouse: ["create_warehouse", "edit_warehouse", "delete_warehouse", "view_warehouse"],
        manageTransfer: ["create_transfer", "edit_transfer", "view_transfer", "delete_transfer", "view_transfer_popup"],
        manageSales: ["create_sale", "edit_sale", "view_sale", "delete_sale", "show_payment", "return_sale", "view_sl_popup", "print_sale"],
        manageSaleReturns: ["view_sl_return", "delete_sl_return", "edit_sl_return", "view_sl_return_popup"],
        managePurchases: ["create_purchase", "edit_purchase", "view_purchase", "delete_purchase", "return_purchase", "view_purchase_popup"],
        managePurchaseReturns: ["view_pur_return", "edit_pur_return", "delete_pur_return", "view_pur_return_popup"],
        manageQuotations: ["create_quotation", "edit_quotation", "view_quotation", "delete_quotation", "create_sl_quotation", "view_quotation_popup"],
        manageCurrency: ["create_currency", "edit_currency", "delete_currency", "view_currency"],
        manageOffers: ["create_offer", "edit_offer", "delete_offer", "view_offer", "assign_offer"],
        manageExpenses: ["create_expense", "edit_expense", "delete_expense", "view_expense"],
        manageExpensesCategory: ["create_exp_category", "edit_exp_category", "delete_exp_category", "view_exp_category"],
        manageRolesAndPermissions: ["create_role", "edit_role", "delete_role", "view_role"],
        manageReports: ["view_reports"],
        manageAdjustments: ["create_adjustment", "edit_adjustment", "view_adjustment", "delete_adjustment", "view_adjustment_popup"],
        manageLanguage: ["view_language"],
        manageSettings: ["view_settings"],
        manageMailSettings: ["view_mail_settings"],
        manageReceiptSettings: ["view_receipt_settings"],
        managePrefixesSettings: ["view_prefixes_settings"],
        managePOS: ["view_pos", "manage_warehouses"],
        manageZbill: ["delete_zbill", "view_zbills"]

    };


    const defaultCheckedPermissions = [
        "view_product", "delete_baseunit", "view_unit", "delete_variation", "view_brand", "view_category",
        "view_customer", "delete_userx", "view_supplier", "view_warehouse", "view_transfer", "view_sale",
        "view_sl_return", "view_purchase", "view_pur_return", "view_quotation", "view_currency",
        "view_expense", "view_exp_category", "view_role", "view_adjustment", "view_zbills","delete_user"
      ];

    // Initialize state variables for input values
    const [roleName, setRoleName] = useState('');
    const [permissions, setPermissions] = useState(() => {
        // Dynamically initialize all permissions as false based on the permissionCategories
        const allPermissions = {};
        Object.values(permissionCategories).flat().forEach(permission => {
            allPermissions[permission] = defaultCheckedPermissions.includes(permission);
        });
        return allPermissions;
    });
    const [progress, setProgress] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [warehouseData, setWarehouseData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllWarehouses = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`);
                setWarehouseData(response.data.warehouses || []);
            } catch (error) {
                console.error('Failed to fetch all warehouses:', error);
            }
        };
        fetchAllWarehouses();
    }, []);

    // Handle role name
    const handleRoleNameChange = (event) => {
        setRoleName(event.target.value);
    };

    // Handle role permissions
    const handlePermissionChange = (event) => {
        const { name, checked } = event.target;
        setPermissions((prevPermissions) => ({
            ...prevPermissions,
            [name]: checked,

        }));
    };

    const handleWarehousePermissionChange = (event, warehouseId, permission) => {
        const { checked } = event.target;

        // Convert permission to correct format (camelCase to snake_case)
        const formattedPermission = permission.toLowerCase().replace(/\s+/g, '_');

        setPermissions((prev) => {
            return {
                ...prev,
                managePOS: {
                    ...prev.managePOS,
                    warehouses: {
                        ...(prev.managePOS?.warehouses || {}),
                        [warehouseId]: {
                            ...(prev.managePOS?.warehouses?.[warehouseId] || {}),
                            [formattedPermission]: checked,
                        },
                    },
                },
            };
        });
    };


    // Handle submit
    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);

        if (roleName.trim() === '') {
            setError('Please enter a role name.');
            console.error('Role name is empty');
            return;
        }

        const hasPermissions = Object.values(permissions).some(value => value);
        if (!hasPermissions) {
            setError('Please select at least one permission for the role.');
            console.warn('No permissions selected');
            return;
        }

        const permissionCategories = {
            manageProducts: ["create_product", "edit_product", "delete_product", "view_product"],
            manageBaseUnits: ["create_baseunit", "edit_baseunit", "delete_baseunit", "view_baseunit"],
            manageUnits: ["create_unit", "edit_unit", "delete_unit", "view_unit"],
            manageVariation: ["create_variation", "edit_variation", "delete_variation", "view_variation"],
            manageBrands: ["create_brand", "edit_brand", "delete_brand", "view_brand"],
            manageCategory: ["create_category", "edit_category", "delete_category", "view_category"],
            manageBarcodePrint: ["create_barcode", "print_barcode"],
            manageCustomers: ["create_customer", "import_customer", "edit_customer", "delete_customer", "view_customer"],
            manageUsers: ["create_user", "edit_user", "delete_user", "view_user"],
            manageSuppliers: ["create_supplier", "edit_supplier", "delete_supplier", "view_supplier", "import_supplier"],
            manageWarehouse: ["create_warehouse", "edit_warehouse", "delete_warehouse", "view_warehouse"],
            manageTransfer: ["create_transfer", "edit_transfer", "view_transfer", "delete_transfer", "view_transfer_popup"],
            manageSales: ["create_sale", "edit_sale", "view_sale", "delete_sale", "show_payment", "return_sale", "view_sl_popup", "print_sale"],
            manageSaleReturns: ["view_sl_return", "delete_sl_return", "edit_sl_return", "view_sl_return_popup"],
            managePurchases: ["create_purchase", "edit_purchase", "view_purchase", "delete_purchase", "return_purchase", "view_purchase_popup"],
            managePurchaseReturns: ["view_pur_return", "edit_pur_return", "delete_pur_return", "view_pur_return_popup"],
            manageQuotations: ["create_quotation", "edit_quotation", "view_quotation", "delete_quotation", "create_sl_quotation", "view_quotation_popup"],
            manageCurrency: ["create_currency", "edit_currency", "delete_currency", "view_currency"],
            manageOffers: ["create_offer", "edit_offer", "delete_offer", "view_offer", "assign_offer"],
            manageExpenses: ["create_expense", "edit_expense", "delete_expense", "view_expense"],
            manageExpensesCategory: ["create_exp_category", "edit_exp_category", "delete_exp_category", "view_exp_category"],
            manageRolesAndPermissions: ["create_role", "edit_role", "delete_role", "view_role"],
            manageReports: ["view_reports"],
            manageAdjustments: ["create_adjustment", "edit_adjustment", "view_adjustment", "delete_adjustment", "view_adjustment_popup"],
            manageLanguage: ["view_language"],
            manageSettings: ["view_settings"],
            manageMailSettings: ["view_mail_settings"],
            manageReceiptSettings: ["view_receipt_settings"],
            managePrefixesSettings: ["view_prefixes_settings"],
            managePOS: ["view_pos", "manage_warehouses"],
            manageZbill: ["delete_zbill", "view_zbills"]
        };

        // Build the correct permissions object
        const formattedPermissions = {};

        Object.entries(permissionCategories).forEach(([category, perms]) => {
            formattedPermissions[category] = {};
            perms.forEach(permission => {
                formattedPermissions[category][permission] = permissions[permission] || false;
            });
        });

        // Ensure warehouses are included properly under managePOS
        if (permissions.managePOS?.warehouses) {
            formattedPermissions.managePOS = {
                ...formattedPermissions.managePOS, 
                warehouses: {}
            };

            warehouseData.forEach((warehouse) => {
                const warehousePermissions = permissions.managePOS.warehouses[warehouse._id] || {};
                const allPermissions = {};

                ["access", "create_sale_from_pos"].forEach((perm) => {
                    allPermissions[perm] = warehousePermissions[perm] !== undefined ? warehousePermissions[perm] : false;
                });
                formattedPermissions.managePOS.warehouses[warehouse._id] = allPermissions;
            });
        }

        const roleData = {
            roleName: roleName.trim(),
            ...formattedPermissions,
        };

        axios.post(`${process.env.REACT_APP_BASE_URL}/api/createPermissions`, roleData)
        .then((response) => {
            toast.success("Role and permissions added successfully!", { autoClose: 2000, className: "custom-toast" });

            setTimeout(() => {
                navigate("/viewRoleAndPermissions");
            }, 1000);

            setRoleName('');
            setPermissions(Object.fromEntries(Object.keys(permissions).map(key => [key, false])));
            console.log("Form reset: Role name cleared, permissions reset");
        })
        .catch((err) => {
            console.error('Error occurred during API request:', err);

            let errorMessage = "An error occurred while adding the permissions. Please try again later.";

            if (err.response && err.response.data) {
                console.error("Error Response Data:", err.response.data);
                if (err.response.data.message === 'Already exists this role') {
                    errorMessage = "Role already exists";
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            toast.error(errorMessage, { autoClose: 2000, className: "custom-toast" });
        })
        .finally(() => {
            setProgress(false);
            console.log("API request completed, progress set to false");
        });
    };

    const handleAllPermissionsChange = (event) => {
        const { checked } = event.target;
        setPermissions((prevPermissions) => {
            const updatedPermissions = Object.keys(prevPermissions).reduce((acc, key) => {
                acc[key] = checked;
                return acc;
            }, {});

            updatedPermissions.managePOS = {
                view_pos: checked,
                manageWarehouses: checked,
                warehouses: warehouseData.reduce((warehousesAcc, warehouse) => {
                    warehousesAcc[warehouse._id] = {
                        access: checked,
                        create_sale_from_pos: checked
                    };
                    return warehousesAcc;
                }, {})
            };

            return updatedPermissions;
        });
    };

    // Handle clear
    const handleClear = () => {
        setRoleName('');
        setPermissions(Object.fromEntries(Object.keys(permissions).map(key => [key, false])));
        setError('');
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh]  p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center mt-20'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create User Role</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewRoleAndPermissions'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-20">
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="mobile" className="block text-sm font-medium leading-6 py-4 text-gray-900 text-left">
                            Role Name <span className='text-red-500'>*</span>
                        </label>
                        <input
                            className="roleName w-50 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            type="text"
                            name="role"
                            placeholder="Enter the role name"
                            value={roleName}
                            onChange={handleRoleNameChange}
                        />
                    </div>
                    <div className="mt-10 flex items-center">
                        <label className="text-lightgray-300 font-semibold text-gray-700">Permissions:</label>
                        <input
                            type="checkbox"
                            id="checkbox-all"
                            name='allPermissions'
                            className="checkbox-custom ml-4"
                            onChange={handleAllPermissionsChange}
                        />
                        <label className="text-lightgray-300 ml-4">All Permissions</label>
                    </div>
                    <div className="mt-10 flex justify-between items-center w-full">
                        <div className="flex gap-x-36">
                            <div className="flex-1 text-left m-0 p-0">
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Roles</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createRole"
                                                name="create_role"
                                                className="checkbox-custom"
                                                checked={permissions.create_role}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Role</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editRole"
                                                name="edit_role"
                                                className="checkbox-custom"
                                                checked={permissions.edit_role}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Role</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteRole"
                                                name="delete_role"
                                                className="checkbox-custom"
                                                checked={permissions.delete_role}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Role</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Products</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createProduct"
                                                name="create_product"
                                                className="checkbox-custom"
                                                checked={permissions.create_product}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Product</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editProduct"
                                                name="edit_product"
                                                className="checkbox-custom"
                                                checked={permissions.edit_product}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Product</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewProduct"
                                                name="view_product"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Product</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteproduct"
                                                name="delete_product"
                                                className="checkbox-custom"
                                                checked={permissions.delete_product}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Product</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Base Units</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createBaseunit"
                                                name="create_baseunit"
                                                className="checkbox-custom"
                                                checked={permissions.create_baseunit}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Baseunit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editBaseunit"
                                                name="edit_baseunit"
                                                className="checkbox-custom"
                                                checked={permissions.edit_baseunit}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Baseunit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewBaseunit"
                                                name="view_baseunit"
                                                className="checkbox-custom"
                                                checked={permissions.view_baseunit}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Baseunit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteBaseunit"
                                                name="delete_baseunit"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Baseunit</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Variation</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createVariation"
                                                name="create_variation"
                                                className="checkbox-custom"
                                                checked={permissions.create_variation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Variation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editVariation"
                                                name="edit_variation"
                                                className="checkbox-custom"
                                                checked={permissions.edit_variation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Variation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewVariation"
                                                name="view_variation"
                                                className="checkbox-custom"
                                                checked={permissions.view_variation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Variation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteVariation"
                                                name="delete_variation"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Variation</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Barcode Print</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createBarcode"
                                                name="create_barcode"
                                                className="checkbox-custom"
                                                checked={permissions.create_barcode}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Barcode</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-printBarcode"
                                                name="print_barcode"
                                                className="checkbox-custom"
                                                checked={permissions.print_barcode}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Print Barcode</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Users</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createUser"
                                                name="create_user"
                                                className="checkbox-custom"
                                                checked={permissions.create_user}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create User</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editUser"
                                                name="edit_user"
                                                className="checkbox-custom"
                                                checked={permissions.edit_user}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit User</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewUser"
                                                name="view_user"
                                                className="checkbox-custom"
                                                checked={permissions.view_user}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View User</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteUser"
                                                name="delete_user"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete User</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Quotations</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createQuotation"
                                                name="create_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.create_quotation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editQuotation"
                                                name="edit_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.edit_quotation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewQuotation"
                                                name="view_quotation"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createSaleQuotation"
                                                name="create_sl_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.create_sl_quotation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Sale from Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewQuotationPopup"
                                                name="view_quotation_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_quotation_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Quotation Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteQuotation"
                                                name="delete_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.delete_quotation}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Quotation</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Reports</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewReports"
                                                name="view_reports"
                                                className="checkbox-custom"
                                                checked={permissions.view_reports}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Reports</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Warehouse</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createWarehouse"
                                                name="create_warehouse"
                                                className="checkbox-custom"
                                                checked={permissions.create_warehouse}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Warehouse</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editWarehouse"
                                                name="edit_warehouse"
                                                className="checkbox-custom"
                                                checked={permissions.edit_warehouse}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Warehouse</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewWarehouse"
                                                name="view_warehouse"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Warehouse</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteWarehouse"
                                                name="delete_warehouse"
                                                className="checkbox-custom"
                                                checked={permissions.delete_warehouse}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Warehouse</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Expenses Categories</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createEXPCategory"
                                                name="create_exp_category"
                                                className="checkbox-custom"
                                                checked={permissions.create_exp_category}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Expenses Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editEXPCategory"
                                                name="edit_exp_category"
                                                className="checkbox-custom"
                                                checked={permissions.edit_exp_category}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Expenses Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewEXPCategory"
                                                name="view_exp_category"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Expenses Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteEXPCategory"
                                                name="delete_exp_category"
                                                className="checkbox-custom"
                                                checked={permissions.delete_exp_category}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Expenses Category</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Offers</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createOffer"
                                                name="create_offer"
                                                className="checkbox-custom"
                                                checked={permissions.create_offer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editOffer"
                                                name="edit_offer"
                                                className="checkbox-custom"
                                                checked={permissions.edit_offer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewOffer"
                                                name="view_offer"
                                                className="checkbox-custom"
                                                checked={permissions.view_offer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteOffer"
                                                name="delete_offer"
                                                className="checkbox-custom"
                                                checked={permissions.delete_offer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-assignOffer"
                                                name="assign_offer"
                                                className="checkbox-custom"
                                                checked={permissions.assign_offer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Assign Offer</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 text-left m-0 p-0">
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Brands</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createBrand"
                                                name="create_brand"
                                                className="checkbox-custom"
                                                checked={permissions.create_brand}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Brand</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editBrand"
                                                name="edit_brand"
                                                className="checkbox-custom"
                                                checked={permissions.edit_brand}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Brand</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewBrand"
                                                name="view_brand"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Brand</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteBrand"
                                                name="delete_brand"
                                                className="checkbox-custom"
                                                checked={permissions.delete_brand}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Brand</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Units</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createUnit"
                                                name="create_unit"
                                                className="checkbox-custom"
                                                checked={permissions.create_unit}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Unit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editUnit"
                                                name="edit_unit"
                                                className="checkbox-custom"
                                                checked={permissions.edit_unit}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Unit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewUnit"
                                                name="view_unit"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Unit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteUnit"
                                                name="delete_unit"
                                                className="checkbox-custom"
                                                checked={permissions.delete_unit}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Unit</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Transfer</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createTransfer"
                                                name="create_transfer"
                                                className="checkbox-custom"
                                                checked={permissions.create_transfer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Transfer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editTransfer"
                                                name="edit_transfer"
                                                className="checkbox-custom"
                                                checked={permissions.edit_transfer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Transfer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewTransfer"
                                                name="view_transfer"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Transfer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewTransferPopup"
                                                name="view_transfer_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_transfer_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Transfer Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteTransfer"
                                                name="delete_transfer"
                                                className="checkbox-custom"
                                                checked={permissions.delete_transfer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Transfer</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Sales</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createSale"
                                                name="create_sale"
                                                className="checkbox-custom"
                                                checked={permissions.create_sale}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editSale"
                                                name="edit_sale"
                                                className="checkbox-custom"
                                                checked={permissions.edit_sale}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSale"
                                                name="view_sale"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSlPopup"
                                                name="view_sl_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_sl_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Sale Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSlPopup"
                                                name="print_sale"
                                                className="checkbox-custom"
                                                checked={permissions.print_sale}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Print Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteSale"
                                                name="delete_sale"
                                                className="checkbox-custom"
                                                checked={permissions.delete_sale}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-showPayment"
                                                name="show_payment"
                                                className="checkbox-custom"
                                                checked={permissions.show_payment}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Show Payment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-returnSale"
                                                name="return_sale"
                                                className="checkbox-custom"
                                                checked={permissions.return_sale}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Return Sale</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Sale Returns</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSLReturn"
                                                name="view_sl_return"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Sale Return</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editSLReturn"
                                                name="edit_sl_return"
                                                className="checkbox-custom"
                                                checked={permissions.edit_sl_return}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Sale Return</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSLReturn"
                                                name="view_sl_return_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_sl_return_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Sale Return Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteSLReturn"
                                                name="delete_sl_return"
                                                className="checkbox-custom"
                                                checked={permissions.delete_sl_return}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Sale Return</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Purchases</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createPurchase"
                                                name="create_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.create_purchase}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editPurchase"
                                                name="edit_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.edit_purchase}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPurchase"
                                                name="view_purchase"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPurchasePopup"
                                                name="view_purchase_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_purchase_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Purchase Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deletePurchase"
                                                name="delete_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.delete_purchase}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-returnPurchase"
                                                name="return_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.return_purchase}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Return Purchase</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Purchase Returns</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPURReturn"
                                                name="view_pur_return_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_pur_return_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Purchase Return Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editPURReturn"
                                                name="edit_pur_return"
                                                className="checkbox-custom"
                                                checked={permissions.edit_pur_return}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Purchase Return</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPURReturn"
                                                name="view_pur_return"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Purchase Return</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deletePURReturn"
                                                name="delete_pur_return"
                                                className="checkbox-custom"
                                                checked={permissions.delete_pur_return}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Purchase Return</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Suppliers</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createSupplier"
                                                name="create_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.create_supplier}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editSupplier"
                                                name="edit_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.edit_supplier}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSupplier"
                                                name="view_supplier"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-importSupplier"
                                                name="import_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.import_supplier}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Import Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteSupplier"
                                                name="delete_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.delete_supplier}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Supplier</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Z Bill</div>
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewZbills"
                                                name="view_zbills"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Z bills</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteZbill"
                                                name="delete_zbill"
                                                className="checkbox-custom"
                                                checked={permissions.delete_zbill}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete  bill</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 text-left m-0 p-0">
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Currency</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createCurrency"
                                                name="create_currency"
                                                className="checkbox-custom"
                                                checked={permissions.create_currency}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Currency</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editCurrency"
                                                name="edit_currency"
                                                className="checkbox-custom"
                                                checked={permissions.edit_currency}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Currency</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewCurrency"
                                                name="view_currency"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Currency</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteCurrency"
                                                name="delete_currency"
                                                className="checkbox-custom"
                                                checked={permissions.delete_currency}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Currency</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Product Category</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createCategory"
                                                name="create_category"
                                                className="checkbox-custom"
                                                checked={permissions.create_category}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editCategory"
                                                name="edit_category"
                                                className="checkbox-custom"
                                                checked={permissions.edit_category}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewCategory"
                                                name="view_category"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteCategory"
                                                name="delete_category"
                                                className="checkbox-custom"
                                                checked={permissions.delete_category}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Category</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Customers</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createCustomer"
                                                name="create_customer"
                                                className="checkbox-custom"
                                                checked={permissions.create_customer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Customer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editCustomer"
                                                name="edit_customer"
                                                className="checkbox-custom"
                                                checked={permissions.edit_customer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Customer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewCustomer"
                                                name="view_customer"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Customer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteCustomer"
                                                name="delete_customer"
                                                className="checkbox-custom"
                                                checked={permissions.delete_customer}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Customer</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Adjustments</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createAdjustment"
                                                name="create_adjustment"
                                                className="checkbox-custom"
                                                checked={permissions.create_adjustment}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Adjustment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editAdjustment"
                                                name="edit_adjustment"
                                                className="checkbox-custom"
                                                checked={permissions.edit_adjustment}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Adjustment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewAdjustment"
                                                name="view_adjustment"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Adjustment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewAdjustmentPopup"
                                                name="view_adjustment_popup"
                                                className="checkbox-custom"
                                                checked={permissions.view_adjustment_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Adjustment Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteAdjustment"
                                                name="delete_adjustment"
                                                className="checkbox-custom"
                                                checked={permissions.delete_adjustment}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Adjustment</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Language</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewLanguage"
                                                name="view_language"
                                                className="checkbox-custom"
                                                checked={permissions.view_language}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Language</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Settings</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSettings"
                                                name="view_settings"
                                                className="checkbox-custom"
                                                checked={permissions.view_settings}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Settings</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Mail Settings</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewMailSettings"
                                                name="view_mail_settings"
                                                className="checkbox-custom"
                                                checked={permissions.view_mail_settings}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Mail Settings</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Receipt Settings</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewReceiptSettings"
                                                name="view_receipt_settings"
                                                className="checkbox-custom"
                                                checked={permissions.view_receipt_settings}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Receipt Settings</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Prefixes Settings</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPrefixesSettings"
                                                name="view_prefixes_settings"
                                                className="checkbox-custom"
                                                checked={permissions.view_prefixes_settings}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Prefixes Settings</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage POS */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage POS</div>

                                    {/* View POS Permission */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPOS"
                                                name="view_pos"
                                                className="checkbox-custom"
                                                checked={permissions.view_pos || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View POS</label>
                                        </div>
                                    </div>

                                    {/* Warehouse Access within Manage POS */}
                                    <div className="ml-8 mt-2">
                                        {warehouseData.map((warehouse) => (
                                            <div key={warehouse._id} className="mt-4">
                                                {/* Main Checkbox for Warehouse */}
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`warehouse-${warehouse._id}`}
                                                        name={warehouse._id}
                                                        className="checkbox-custom"
                                                        checked={permissions.managePOS?.warehouses?.[warehouse._id]?.access || false}
                                                        onChange={(e) => handleWarehousePermissionChange(e, warehouse._id, "access")}
                                                    />
                                                    <label htmlFor={`warehouse-${warehouse._id}`} className="ml-4 font-semibold">{warehouse.name}</label>
                                                </div>

                                                {/* Sub-Permissions for Each Warehouse */}
                                                <div className="ml-8 mt-2">
                                                    {["Create Sale From POS"].map((perm) => (
                                                        <div key={`${warehouse._id}-${perm}`} className="flex items-center mt-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`${warehouse._id}-create_sale_from_pos`}
                                                                name={`${warehouse._id}-create_sale_from_pos`}
                                                                className="checkbox-custom"
                                                                checked={permissions.managePOS?.warehouses?.[warehouse._id]?.create_sale_from_pos || false}
                                                                onChange={(e) => handleWarehousePermissionChange(e, warehouse._id, "create_sale_from_pos")}
                                                                disabled={!permissions.managePOS?.warehouses?.[warehouse._id]?.access} // Disable if warehouse is not checked
                                                            />
                                                            <label htmlFor={`${warehouse._id}-create_sale_from_pos`} className="ml-4">Create Sale From POS</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Expenses</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createExpense"
                                                name="create_expense"
                                                className="checkbox-custom"
                                                checked={permissions.create_expense}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Expense</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editExpense"
                                                name="edit_expense"
                                                className="checkbox-custom"
                                                checked={permissions.edit_expense}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Expense</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewExpense"
                                                name="view_expense"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Expense</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteExpense"
                                                name="delete_expense"
                                                className="checkbox-custom"
                                                checked={permissions.delete_expense}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Expense</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-4 mt-40">
                        <button
                            type="submit"
                            className="button-bg-color  button-bg-color:hover text-white rounded-md px-4 py-2 transition-colors duration-300  text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#37b34a] focus:ring-offset-2"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Clear
                        </button>
                    </div>
                </form>
                {/* Error and Response Messages */}
                <div className="mt-5">
                    <div className="relative">
                        {/* Reserve space for messages */}
                        <div className="absolute top-0 left-0 w-full">
                            {error && (
                                <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 text-center mx-auto max-w-sm">
                                    {error}
                                </p>
                            )}
                            {responseMessage && (
                                <p className="text-color px-5 py-2 rounded-md bg-green-100 text-center mx-auto max-w-sm">
                                    {responseMessage}
                                </p>
                            )}
                        </div>
                        {/* Reserve empty space to maintain layout */}
                        <div className="h-[50px]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRoleBody;