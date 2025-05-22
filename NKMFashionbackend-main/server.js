const express = require('express');
const connectDB = require('./config/database');
const routes = require('./routes/index'); // Aggregated routes
const { corsMiddleware, bodyParserMiddleware } = require('./middleware/commonMiddleware'); // Import middleware functions
require('dotenv').config();
const path = require('path');

const app = express();

// Use CORS Middleware
app.use(corsMiddleware);
app.use(bodyParserMiddleware);

// Serve static files (e.g., images)
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Connect to MongoDB
connectDB();

// Use routes with a base path (e.g., `/api`)
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Handle 404 errors for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Respond with appropriate HTTP status and error message
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
