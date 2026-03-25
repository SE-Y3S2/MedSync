const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.post('/', sessionController.createSession);
router.get('/:appointmentId', sessionController.getSession);
router.put('/:appointmentId/ready', sessionController.readySession);
router.put('/:appointmentId/end', sessionController.endSession);
router.post('/webhooks/agora', sessionController.agoraWebhook);

module.exports = router;
