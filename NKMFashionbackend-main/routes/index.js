const express = require('express');
const router = express.Router();

// Import CRUD route handlers
const getRoutes = require('./getRoutes');
const postRoutes = require('./postRoutes');
const putRoutes = require('./putRoutes');
const deleteRoutes = require('./deleteRoutes');

// Use CRUD routes with a base path
router.use('/', getRoutes);
router.use('/', postRoutes);
router.use('/', putRoutes);
router.use('/', deleteRoutes);

module.exports = router;
