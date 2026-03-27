const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ───── Public routes (no auth required) ─────
router.post('/register', patientController.register);
router.post('/login', patientController.login);

// ───── Protected routes (auth required) ─────
router.get('/profile', authMiddleware, patientController.getProfile);
router.put('/profile', authMiddleware, patientController.updateProfile);

// Records routes
router.get('/records', authMiddleware, patientController.getRecords);
router.post('/records/history', authMiddleware, patientController.addMedicalRecord);
router.post('/records/prescriptions', authMiddleware, patientController.addPrescription);

// Document routes
router.post('/documents/upload', authMiddleware, upload.single('file'), patientController.uploadDocument);
router.get('/documents', authMiddleware, patientController.getDocuments);
router.delete('/documents/:id', authMiddleware, patientController.deleteDocument);

module.exports = router;
