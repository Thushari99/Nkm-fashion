// commonMiddleware.js
const express = require('express');
const cors = require('cors'); // Import the cors package
require('dotenv').config();

// CORS Middleware using the 'cors' package
const corsMiddleware = cors({
  origin: process.env.ORIGIN_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Body Parser Middleware
const bodyParserMiddleware = express.json();

// Exporting as an object
module.exports = {
  corsMiddleware,
  bodyParserMiddleware
};
