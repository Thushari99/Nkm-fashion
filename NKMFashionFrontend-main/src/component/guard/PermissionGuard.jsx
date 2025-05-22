import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import PermissionController from "../utill/permissionController";

const PermissionGuard = ({ children, requiredPermissions }) => {
  const { userData } = useContext(UserContext);

  if (!userData) {
    return <Navigate to="/" replace />;
  }

  // Extract all permissions (including sub-permissions)
  const userPermissions = Object.entries(userData.permissions || {}).reduce(
    (acc, [_, subPermissions]) => {
      return { ...acc, ...subPermissions };
    },
    {}
  );

  // Check if user has at least one required permission
  const hasRequiredPermission = requiredPermissions.some(
    (perm) => userPermissions[perm] === true
  );

  if (!hasRequiredPermission) {
    console.log("Access Denied. Required Permissions:", requiredPermissions);
    return <p>Access Denied</p>;
  }

  return children;
};

export default PermissionGuard;
