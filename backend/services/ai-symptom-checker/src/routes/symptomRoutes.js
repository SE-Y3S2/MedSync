const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');

// Analyze symptoms (multi-specialty matching with urgency)
router.post('/analyze', symptomController.analyzeSymptoms);

// Get symptom check history for a patient
router.get('/history/:patientId', symptomController.getHistory);

module.exports = router;
