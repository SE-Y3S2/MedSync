const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptomController');

router.post('/analyze', symptomController.analyzeSymptoms);

module.exports = router;
