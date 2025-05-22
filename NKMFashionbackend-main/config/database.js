const mongoose = require('mongoose');
require('dotenv').config();
const URL = process.env.MONGODB_URL;

// Connect to Database with Retry Logic
const connectDB = async () => {
    try {
        await mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Database Connected');
    } catch (err) {
        console.error('Database Not Connected: ' + err.message);
        console.log('Retrying in 5 seconds...');
        setTimeout(connectDB, 5000); // Retry connection after 5 seconds
    }
};

// Event listeners for connection monitoring
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established.');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.error('MongoDB connection lost. Retrying...');
    connectDB(); // Retry connection on disconnection
});

// Graceful shutdown for database connection
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed. App terminating.');
    process.exit(0);
});

module.exports = connectDB;
