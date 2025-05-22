const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (token == null) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token and check expiration
    console.log('Verifying token:', token);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            // If the token is expired, return a specific error message
            if (err.name === 'TokenExpiredError') {
                console.log('Session expired');
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }
            // For other errors (like invalid token), return a generic message
            return res.status(403).json({ message: 'Invalid token' });
        }

        // Log the successful verification
        console.log('Token verified successfully, user:', user);

        // Attach the user information to the request object
        req.user = user; 
        next(); // Token is valid, proceed to the next middleware or route handler
    });
};

module.exports = { authenticateToken };
