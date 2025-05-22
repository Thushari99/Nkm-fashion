const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
    },
    lastName: { 
        type: String, 
    },
    mobile: { 
        type: String,
        unique: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String,
        ref: "RolePermissions" 
    },
    profileImage: { 
       type: String
    }
    
});
const User = mongoose.model('User', userSchema);
module.exports = User;
