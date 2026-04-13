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

// Admin-only: list all patients (must be defined BEFORE `/:patientId/*` catchers)
router.get('/', authMiddleware, patientController.listPatients);

// Records routes
router.get('/records', authMiddleware, patientController.getRecords);
router.post('/records/history', authMiddleware, patientController.addMedicalRecord);
router.post('/records/prescriptions', authMiddleware, patientController.addPrescription);
router.post('/:patientId/prescriptions', authMiddleware, patientController.doctorIssuePrescription);

// Doctor/admin: view a specific patient's full record
router.get('/:patientId/full', authMiddleware, patientController.getPatientForProvider);

// Document routes
router.post('/documents/upload', authMiddleware, upload.single('file'), patientController.uploadDocument);
router.get('/documents', authMiddleware, patientController.getDocuments);
router.delete('/documents/:id', authMiddleware, patientController.deleteDocument);

// Doctor Oversight routes
router.get('/:patientId', authMiddleware, patientController.getPatientProfile);
router.get('/:patientId/records', authMiddleware, patientController.getPatientRecords);
router.get('/:patientId/documents', authMiddleware, patientController.getPatientDocuments);

module.exports = router;
