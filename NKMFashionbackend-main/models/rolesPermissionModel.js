const mongoose = require('mongoose');

const PermissionsSchema = new mongoose.Schema({
    roleName: { type: String, required: true, unique: true },
    permissions: { 
        type: Map, 
        of: mongoose.Schema.Types.Mixed, 
        default: {} 
    } // Store permissions dynamically
});

const Permissions = mongoose.model('RolePermissions', PermissionsSchema);
module.exports = Permissions;
