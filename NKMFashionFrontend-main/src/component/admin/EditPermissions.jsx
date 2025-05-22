import { useState, useEffect } from 'react';
import '../../styles/role.css';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box'
import { toast } from 'react-toastify';

const EditPermissionsBody = () => {
    const { id } = useParams();
    const [roleName, setRoleName] = useState('');
    const [permissions, setPermissions] = useState({});
    const [progress, setProgress] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) {
            console.error("Error: Role ID is undefined");
            return;
        }

        const FetchingPermissionData = async () => {
            try {
                setProgress(true);
                const roleResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findRoleForUpdate/${id}`);
                const roleData = roleResponse.data;

                const warehousesResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`);
                const currentWarehouses = warehousesResponse.data.warehouses || [];

                let formattedPermissions = roleData.permissions || {};

                formattedPermissions.managePOS = formattedPermissions.managePOS || { view_pos: false, warehouses: {} };
                const existingWarehouses = formattedPermissions.managePOS.warehouses || {};

                const mergedWarehouses = {};
                currentWarehouses.forEach(warehouse => {
                    const warehouseId = warehouse._id;
                    const existing = existingWarehouses[warehouseId];
                    mergedWarehouses[warehouseId] = existing ? {
                        ...existing,
                        warehouseName: warehouse.name,
                    } : {
                        warehouseId: warehouseId,
                        warehouseName: warehouse.name,
                        access: false,
                        view_pos_product: false,
                        create_sale_from_pos: false,
                    };
                });

                formattedPermissions.managePOS.warehouses = mergedWarehouses;
                setRoleName(roleData.roleName);
                setPermissions(formattedPermissions);

            } catch (error) {
                setError('An error occurred while fetching data. Please try again later.');
                console.error('Error fetching data:', error);
            } finally {
                setProgress(false);
            }
        };

        FetchingPermissionData();
    }, [id]);

    const handleRoleNameChange = (event) => {
        setRoleName(event.target.value);
    };

    const handleWarehousePermissionChange = (event, warehouseId, permission) => {
        const { checked } = event.target;
        const normalizedPermission = permission.toLowerCase().replace(/\s+/g, "_");

        setPermissions((prev) => ({
            ...prev,
            managePOS: {
                ...prev.managePOS,
                warehouses: {
                    ...(prev.managePOS?.warehouses || {}),
                    [warehouseId]: {
                        ...(prev.managePOS?.warehouses?.[warehouseId] || {}),
                        [normalizedPermission]: checked, // Update specific warehouse permission
                    },
                },
            },
        }));
    };

    // Handle role permissions
    const handlePermissionChange = (event) => {
        const { name, checked } = event.target;
        const firstUnderscoreIndex = name.indexOf("_");
        const category = name.substring(0, firstUnderscoreIndex); // e.g., "manageRolesAndPermissions"
        const permission = name.substring(firstUnderscoreIndex + 1); // e.g., "create_role"

        setPermissions((prevPermissions) => {
            return {
                ...prevPermissions,
                [category]: {
                    ...(prevPermissions[category] || {}), // Preserve existing permissions
                    [permission]: checked, // Correctly update the specific permission
                },
            };
        });
    };

    useEffect(() => {
        console.log("Updated Permissions State:", permissions);
    }, [permissions]);


    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);

        if (roleName.trim() === '') {
            setError('Please enter a role name.');
            console.error('❌ Role name is empty');
            setProgress(false);
            return;
        }
        const isPermissionSelected = Object.values(permissions).some(permissionGroup =>
            Object.values(permissionGroup).some(value => value === true)
        );

        if (!isPermissionSelected) {
            setError('Please select at least one permission for the role.');
            console.error('❌ No permissions selected');
            setProgress(false);
            return;
        }

        // 🛠 Construct the updated permissions object to match backend format
        const updatedPermissions = {};

        for (const [mainPermission, subPermissions] of Object.entries(permissions)) {
            updatedPermissions[mainPermission] = {};

            for (const [subPermission, value] of Object.entries(subPermissions)) {
                updatedPermissions[mainPermission][subPermission] = value; // Ensure all permissions update correctly
            }
        }

        // 🏪 Process `managePOS` permissions (Ensure warehouses structure is correct)
        if (permissions.managePOS?.warehouses) {
            updatedPermissions.managePOS.warehouses = {};

            for (const [warehouseId, warehousePermissions] of Object.entries(permissions.managePOS.warehouses)) {
                updatedPermissions.managePOS.warehouses[warehouseId] = {
                    warehouseId,
                    warehouseName: warehousePermissions.warehouseName || "Unknown Warehouse",
                    access: warehousePermissions.access || false, // Ensure 'access' exists
                    ...warehousePermissions, // Keep other permissions intact
                };
            }
        }

        // ✅ Final payload to send
        const updatedPermission = {
            id: id,
            roleName: roleName.trim(),
            permissions: updatedPermissions,
        };

        // 🔄 Send updated data to backend
        axios.put(`${process.env.REACT_APP_BASE_URL}/api/updatePermissions`, updatedPermission)
            .then((response) => {
                toast.success("Successfully updated the permissions", { autoClose: 2000 });

                setTimeout(() => {
                    navigate("/viewRoleAndPermissions");
                }, 1000);
            })
            .catch((err) => {
                console.error('❌ Error during permission update:', err);
                toast.error("An error occurred while updating the permissions. Please try again later.", { autoClose: 2000 });
            })
            .finally(() => {
                setProgress(false);
            });
    };

    // Handle clear
    const handleClear = () => {
        setRoleName('');
        setPermissions({
            manageRoles: false,
            manageProducts: false,
            manageUser: false,
            manageWarehouse: false,
            manageBrands: false,
            manageUnits: false,
            manageSuppliers: false,
            manageExpenseCategories: false,
            manageCurrency: false,
            manageProductCategories: false,
            manageCustomers: false,
            manageExpenses: false,
            manageOffers: false,
            manageZbill: false,
        });
        setError('');
        setResponseMessage('');
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
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit User Role</h2>
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
                            name="allPermissions"
                            className="checkbox-custom ml-4"
                            checked={Object.values(permissions).every(
                                (category) => Object.values(category).every(Boolean)
                            )} 
                            onChange={(event) => {
                                const { checked } = event.target;

                                axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`)
                                    .then((response) => {
                                        const currentWarehouses = response.data.warehouses || [];

                                        setPermissions((prevPermissions) => {
                                            const updatedPermissions = { ...prevPermissions };
                                            Object.keys(updatedPermissions).forEach((category) => {
                                                if (category !== "managePOS") {
                                                    Object.keys(updatedPermissions[category]).forEach((permission) => {
                                                        updatedPermissions[category][permission] = checked;
                                                    });
                                                }
                                            });
                                            updatedPermissions.managePOS = {
                                                ...updatedPermissions.managePOS,
                                                view_pos: checked,
                                                warehouses: currentWarehouses.reduce((acc, warehouse) => ({
                                                    ...acc,
                                                    [warehouse._id]: {
                                                        warehouseId: warehouse._id,
                                                        warehouseName: warehouse.name,
                                                        access: checked,
                                                        view_pos_product: checked,
                                                        create_sale_from_pos: checked
                                                    }
                                                }), {})
                                            };
                                            return updatedPermissions;
                                        });
                                    })
                                    .catch((error) => {
                                        console.error("Error fetching warehouses:", error);
                                        toast.error("Could not refresh warehouse data");
                                    });
                            }}
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
                                                name="manageRolesAndPermissions_create_role"
                                                className="checkbox-custom"
                                                checked={permissions.manageRolesAndPermissions?.create_role || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Role</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editRole"
                                                name="manageRolesAndPermissions_edit_role"
                                                className="checkbox-custom"
                                                checked={permissions.manageRolesAndPermissions?.edit_role || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Role</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteRole"
                                                name="manageRolesAndPermissions_delete_role"
                                                className="checkbox-custom"
                                                checked={permissions.manageRolesAndPermissions?.delete_role || false}
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
                                                name="manageProducts_create_product"
                                                className="checkbox-custom"
                                                checked={permissions.manageProducts?.create_product || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Product</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editProduct"
                                                name="manageProducts_edit_product"
                                                className="checkbox-custom"
                                                checked={permissions.manageProducts?.edit_product || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Product</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewProduct"
                                                name="manageProducts_view_product"
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
                                                name="manageProducts_delete_product"
                                                className="checkbox-custom"
                                                checked={permissions.manageProducts?.delete_product || false}
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
                                                name="manageBaseUnits_create_baseunit"
                                                className="checkbox-custom"
                                                checked={permissions.manageBaseUnits?.create_baseunit || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Baseunit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editBaseunit"
                                                name="manageBaseUnits_edit_baseunit"
                                                className="checkbox-custom"
                                                checked={permissions.manageBaseUnits?.edit_baseunit || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Baseunit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewBaseunit"
                                                name="manageBaseUnits_view_baseunit"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Baseunit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteBaseunit"
                                                name="manageBaseUnits_delete_baseunit"
                                                className="checkbox-custom"
                                                checked={permissions.manageBaseUnits?.delete_baseunit || false}
                                                onChange={handlePermissionChange}
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
                                                name="manageVariation_create_variation"
                                                className="checkbox-custom"
                                                checked={permissions.manageVariation?.create_variation || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Variation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editVariation"
                                                name="manageVariation_edit_variation"
                                                className="checkbox-custom"
                                                checked={permissions.manageVariation?.edit_variation || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Variation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewVariation"
                                                name="manageVariation_view_variation"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Variation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteVariation"
                                                name="manageVariation_delete_variation"
                                                className="checkbox-custom"
                                                checked={permissions.manageVariation?.delete_variation || false}
                                                onChange={handlePermissionChange}
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
                                                name="manageBarcodePrint_create_barcode"
                                                className="checkbox-custom"
                                                checked={permissions.manageBarcodePrint?.create_barcode || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Barcode</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-printBarcode"
                                                name="manageBarcodePrint_print_barcode"
                                                className="checkbox-custom"
                                                checked={permissions.manageBarcodePrint?.print_barcode || false}
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
                                                name="manageUsers_create_user"
                                                className="checkbox-custom"
                                                checked={permissions.manageUsers?.create_user || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create User</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editUser"
                                                name="manageUsers_edit_user"
                                                className="checkbox-custom"
                                                checked={permissions.manageUsers?.edit_user || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit User</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewUser"
                                                name="manageUsers_view_user"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View User</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteUser"
                                                name="manageUsers_delete_user"
                                                className="checkbox-custom"
                                                checked={permissions.manageUsers?.delete_user || false}
                                                onChange={handlePermissionChange}
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
                                                name="manageQuotations_create_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.manageQuotations?.create_quotation || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editQuotation"
                                                name="manageQuotations_edit_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.manageQuotations?.edit_quotation || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewQuotation"
                                                name="manageQuotations_view_quotation"
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
                                                name="manageQuotations_create_sl_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.manageQuotations?.create_sl_quotation || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Sale from Quotation</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewQuotationPopup"
                                                name="manageQuotations_view_quotation_popup"
                                                className="checkbox-custom"
                                                checked={permissions.manageQuotations?.view_quotation_popup || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Quotation Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteQuotation"
                                                name="manageQuotations_delete_quotation"
                                                className="checkbox-custom"
                                                checked={permissions.manageQuotations?.delete_quotation || false}
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
                                                name="manageReports_view_reports"
                                                className="checkbox-custom"
                                                checked={permissions.manageReports?.view_reports || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Reports</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Warehouse</div>
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createWarehouse"
                                                name="manageWarehouse_create_warehouse"
                                                className="checkbox-custom"
                                                checked={permissions.manageWarehouse?.create_warehouse || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Warehouse</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editWarehouse"
                                                name="manageWarehouse_edit_warehouse"
                                                className="checkbox-custom"
                                                checked={permissions.manageWarehouse?.edit_warehouse || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Warehouse</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewWarehouse"
                                                name="manageWarehouse_view_warehouse"
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
                                                name="manageWarehouse_delete_warehouse"
                                                className="checkbox-custom"
                                                checked={permissions.manageWarehouse?.delete_warehouse || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Warehouse</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Offers</div>
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createOffer"
                                                name="manageOffers_create_offer"
                                                className="checkbox-custom"
                                                checked={permissions.manageOffers?.create_offer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editOffer"
                                                name="manageOffers_edit_offer"
                                                className="checkbox-custom"
                                                checked={permissions.manageOffers?.edit_offer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewOffer"
                                                name="manageOffers_view_offer"
                                                className="checkbox-custom"
                                                checked={true}
                                                disabled
                                            />
                                            <label className="text-lightgray-300 ml-4">View Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteOffer"
                                                name="manageOffers_delete_offer"
                                                className="checkbox-custom"
                                                checked={permissions.manageOffers?.delete_offer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Offer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-assignOffer"
                                                name="manageOffers_assign_offer"
                                                className="checkbox-custom"
                                                checked={permissions.manageOffers?.assign_offer || false}
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
                                                name="manageBrands_create_brand"
                                                className="checkbox-custom"
                                                checked={permissions.manageBrands?.create_brand || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Brand</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editBrand"
                                                name="manageBrands_edit_brand"
                                                className="checkbox-custom"
                                                checked={permissions.manageBrands?.edit_brand || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Brand</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewBrand"
                                                name="manageBrands_view_brand"
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
                                                name="manageBrands_delete_brand"
                                                className="checkbox-custom"
                                                checked={permissions.manageBrands?.delete_brand || false}
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
                                                name="manageUnits_create_unit"
                                                className="checkbox-custom"
                                                checked={permissions.manageUnits?.create_unit || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Unit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editUnit"
                                                name="manageUnits_edit_unit"
                                                className="checkbox-custom"
                                                checked={permissions.manageUnits?.edit_unit || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Unit</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewUnit"
                                                name="manageUnits_view_unit"
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
                                                name="manageUnits_delete_unit"
                                                className="checkbox-custom"
                                                checked={permissions.manageUnits?.delete_unit || false}
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
                                                name="manageTransfer_create_transfer"
                                                className="checkbox-custom"
                                                checked={permissions.manageTransfer?.create_transfer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Transfer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editTransfer"
                                                name="manageTransfer_edit_transfer"
                                                className="checkbox-custom"
                                                checked={permissions.manageTransfer?.edit_transfer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Transfer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewTransfer"
                                                name="manageTransfer_view_transfer"
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
                                                name="manageTransfer_view_transfer_popup"
                                                className="checkbox-custom"
                                                checked={permissions.manageTransfer?.view_transfer_popup || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Transfer Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteTransfer"
                                                name="manageTransfer_delete_transfer"
                                                className="checkbox-custom"
                                                checked={permissions.manageTransfer?.delete_transfer || false}
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
                                                name="manageSales_create_sale"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.create_sale || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editSale"
                                                name="manageSales_edit_sale"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.edit_sale || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSale"
                                                name="manageSales_view_sale"
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
                                                name="manageSales_view_sl_popup"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.view_sl_popup || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Sale Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-printSale"
                                                name="manageSales_print_sale"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.print_sale || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Print Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteSale"
                                                name="manageSales_delete_sale"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.delete_sale || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Sale</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-showPayment"
                                                name="manageSales_show_payment"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.show_payment || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Show Payment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-returnSale"
                                                name="manageSales_return_sale"
                                                className="checkbox-custom"
                                                checked={permissions.manageSales?.return_sale || false}
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
                                                name="manageSaleReturns_view_sl_return"
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
                                                name="manageSaleReturns_edit_sl_return"
                                                className="checkbox-custom"
                                                checked={permissions.manageSaleReturns?.edit_sl_return || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Sale Return</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSLReturn"
                                                name="manageSaleReturns_view_sl_return_popup"
                                                className="checkbox-custom"
                                                checked={permissions.manageSaleReturns?.view_sl_return_popup || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Sale Return Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteSLReturn"
                                                name="manageSaleReturns_delete_sl_return"
                                                className="checkbox-custom"
                                                checked={permissions.manageSaleReturns?.delete_sl_return || false}
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
                                                name="managePurchases_create_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchases?.create_purchase || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editPurchase"
                                                name="managePurchases_edit_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchases?.edit_purchase || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPurchase"
                                                name="managePurchases_view_purchase"
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
                                                name="managePurchases_view_purchase_popup"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchases?.view_purchase_popup || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Purchase Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deletePurchase"
                                                name="managePurchases_delete_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchases?.delete_purchase || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Purchase</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-returnPurchase"
                                                name="managePurchases_return_purchase"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchases?.return_purchase || false}
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
                                                name="managePurchaseReturns_view_pur_return_popup"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchaseReturns?.view_pur_return_popup}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Purchase Return Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editPURReturn"
                                                name="managePurchaseReturns_edit_pur_return"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchaseReturns?.edit_pur_return || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Purchase Return</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPURReturn"
                                                name="managePurchaseReturns_view_pur_return"
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
                                                name="managePurchaseReturns_delete_pur_return"
                                                className="checkbox-custom"
                                                checked={permissions.managePurchaseReturns?.delete_pur_return || false}
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
                                                name="manageSuppliers_create_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.manageSuppliers?.create_supplier || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editSupplier"
                                                name="manageSuppliers_edit_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.manageSuppliers?.edit_supplier || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewSupplier"
                                                name="manageSuppliers_view_supplier"
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
                                                name="manageSuppliers_import_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.manageSuppliers?.import_supplier || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Import Supplier</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteSupplier"
                                                name="manageSuppliers_delete_supplier"
                                                className="checkbox-custom"
                                                checked={permissions.manageSuppliers?.delete_supplier || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Supplier</label>
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
                                                name="manageExpensesCategory_create_exp_category"
                                                className="checkbox-custom"
                                                checked={permissions.manageExpensesCategory?.create_exp_category || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Expenses Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editEXPCategory"
                                                name="manageExpensesCategory_edit_exp_category"
                                                className="checkbox-custom"
                                                checked={permissions.manageExpensesCategory?.edit_exp_category || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Expenses Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewEXPCategory"
                                                name="manageExpensesCategory_view_exp_category"
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
                                                name="manageExpensesCategory_delete_exp_category"
                                                className="checkbox-custom"
                                                checked={permissions.manageExpensesCategory?.delete_exp_category || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Expenses Category</label>
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
                                                name="manageCurrency_create_currency"
                                                className="checkbox-custom"
                                                checked={permissions.manageCurrency?.create_currency || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Currency</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editCurrency"
                                                name="manageCurrency_edit_currency"
                                                className="checkbox-custom"
                                                checked={permissions.manageCurrency?.edit_currency || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Currency</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewCurrency"
                                                name="manageCurrency_view_currency"
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
                                                name="manageCurrency_delete_currency"
                                                className="checkbox-custom"
                                                checked={permissions.manageCurrency?.delete_currency || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Currency</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Main Permission: Manage Roles */}
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage Category</div>

                                    {/* Sub-permissions for Manage Roles */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-createCategory"
                                                name="manageCategory_create_category"
                                                className="checkbox-custom"
                                                checked={permissions.manageCategory?.create_category || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editCategory"
                                                name="manageCategory_edit_category"
                                                className="checkbox-custom"
                                                checked={permissions.manageCategory?.edit_category || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Category</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewCategory"
                                                name="manageCategory_view_category"
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
                                                name="manageCategory_delete_category"
                                                className="checkbox-custom"
                                                checked={permissions.manageCategory?.delete_category || false}
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
                                                name="manageCustomers_create_customer"
                                                className="checkbox-custom"
                                                checked={permissions.manageCustomers?.create_customer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Customer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editCustomer"
                                                name="manageCustomers_edit_customer"
                                                className="checkbox-custom"
                                                checked={permissions.manageCustomers?.edit_customer || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Customer</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewCustomer"
                                                name="manageCustomers_view_customer"
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
                                                name="manageCustomers_delete_customer"
                                                className="checkbox-custom"
                                                checked={permissions.manageCustomers?.delete_customer || false}
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
                                                name="manageAdjustments_create_adjustment"
                                                className="checkbox-custom"
                                                checked={permissions.manageAdjustments?.create_adjustment || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Adjustment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editAdjustment"
                                                name="manageAdjustments_edit_adjustment"
                                                className="checkbox-custom"
                                                checked={permissions.manageAdjustments?.edit_adjustment || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Adjustment</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewAdjustment"
                                                name="manageAdjustments_view_adjustment"
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
                                                name="manageAdjustments_view_adjustment_popup"
                                                className="checkbox-custom"
                                                checked={permissions.manageAdjustments?.view_adjustment_popup || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Adjustment Details</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-deleteAdjustment"
                                                name="manageAdjustments_delete_adjustment"
                                                className="checkbox-custom"
                                                checked={permissions.manageAdjustments?.delete_adjustment || false}
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
                                                name="manageLanguage_view_language"
                                                className="checkbox-custom"
                                                checked={permissions.manageLanguage?.view_language || false}
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
                                                name="manageSettings_view_settings"
                                                className="checkbox-custom"
                                                checked={permissions.manageSettings?.view_settings || false}
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
                                                name="manageMailSettings_view_mail_settings"
                                                className="checkbox-custom"
                                                checked={permissions.manageMailSettings?.view_mail_settings}
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
                                                name="manageReceiptSettings_view_receipt_settings"
                                                className="checkbox-custom"
                                                checked={permissions.manageReceiptSettings?.view_receipt_settings}
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
                                                name="managePrefixesSettings_view_prefixes_settings"
                                                className="checkbox-custom"
                                                checked={permissions.managePrefixesSettings?.view_prefixes_settings}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">View Prefixes Settings</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-lightgray-300 font-semibold mt-4">Manage POS</div>

                                    {/* View POS Permission */}
                                    <div className="ml-8 mt-2">
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewPOS"
                                                name="managePOS_view_pos"
                                                className="checkbox-custom"
                                                checked={permissions.managePOS?.view_pos || false}
                                                onChange={handlePermissionChange}
                                            />
                                            <label htmlFor="checkbox-viewPOS" className="ml-4">View POS</label>
                                        </div>
                                    </div>

                                    {/* Warehouse Access within Manage POS */}
                                    <div className="ml-8 mt-2">
                                        {Object.values(permissions.managePOS?.warehouses || {}).map((warehouse) => (
                                            <div key={warehouse.warehouseId} className="mt-4">
                                                {/* Main Checkbox for Warehouse */}
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`warehouse-${warehouse.warehouseId}`}
                                                        className="checkbox-custom"
                                                        checked={warehouse.access}
                                                        onChange={(e) => handleWarehousePermissionChange(e, warehouse.warehouseId, "access")}
                                                    />
                                                    <label htmlFor={`warehouse-${warehouse.warehouseId}`} className="ml-4 font-semibold">
                                                        {warehouse.warehouseName}
                                                    </label>
                                                </div>

                                                {/* Sub-Permissions for Each Warehouse */}
                                                <div className="ml-8 mt-2">
                                                    {["Create Sale From POS"].map((perm) => (
                                                        <div key={`${warehouse.warehouseId}-create_sale_from_pos`} className="flex items-center mt-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`${warehouse.warehouseId}-create_sale_from_pos`}
                                                                className="checkbox-custom"
                                                                // Ensure 'create_pos_sale' permission is used here for checked state
                                                                checked={warehouse.create_sale_from_pos || false}
                                                                onChange={(e) => handleWarehousePermissionChange(e, warehouse.warehouseId, "create_sale_from_pos")}
                                                                disabled={!warehouse.access} // Disable if warehouse is not checked
                                                            />
                                                            <label htmlFor={`${warehouse.warehouseId}-create_sale_from_pos`} className="ml-4">
                                                                Create Sale From POS
                                                            </label>
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
                                                name="manageExpenses_create_expense"
                                                className="checkbox-custom"
                                                checked={permissions.manageExpenses?.create_expense}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Create Expense</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-editExpense"
                                                name="manageExpenses_edit_expense"
                                                className="checkbox-custom"
                                                checked={permissions.manageExpenses?.edit_expense}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Edit Expense</label>
                                        </div>
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="checkbox-viewExpense"
                                                name="manageExpenses_view_expense"
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
                                                name="manageExpenses_delete_expense"
                                                className="checkbox-custom"
                                                checked={permissions.manageExpenses?.delete_expense}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete Expense</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4  bg-black-800 p-4 rounded-md">
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
                                                name="manageZbill_delete_zbill"
                                                className="checkbox-custom"
                                                checked={permissions.manageZbill?.delete_zbill}
                                                onChange={handlePermissionChange}
                                            />
                                            <label className="text-lightgray-300 ml-4">Delete  bills</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-start mt-20">
                        <button
                            className="saveBtn w-[100px] flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            type="submit"
                        >
                            Update
                        </button>
                        <button
                            className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px]  focus:ring-gray-500 focus:ring-offset-2"
                            type="button"
                            onClick={handleClear}
                        >
                            Clear
                        </button>
                    </div>
                </form>

                {/* Error and Response Messages */}
                <div className="mt-10">
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
            </div >
        </div >
    );
};

export default EditPermissionsBody;
