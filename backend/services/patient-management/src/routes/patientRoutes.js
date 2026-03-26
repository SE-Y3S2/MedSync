const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const upload = require('../middleware/uploadMiddleware');

// Profile routes
router.post('/profile', patientController.updateProfile);
router.get('/profile', patientController.getProfile);

// Records routes
router.get('/records', patientController.getRecords);

// Document routes
router.post('/documents/upload', upload.single('file'), patientController.uploadDocument);
router.get('/documents', patientController.getDocuments);

module.exports = router;
