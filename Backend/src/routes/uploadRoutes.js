const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// POST /api/upload
router.post('/api/upload', uploadMiddleware.single, uploadController.uploadFile);

module.exports = router;
