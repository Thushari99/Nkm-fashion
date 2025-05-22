const PermissionController = {
  hasPermission: (userPermissions, requiredPermissions) => {
      if (!requiredPermissions || requiredPermissions.length === 0) {
          return true; // If no permissions are required, allow access
      }
      return requiredPermissions.every((permission) =>
          userPermissions.includes(permission)
      );
  },
};

export default PermissionController;
