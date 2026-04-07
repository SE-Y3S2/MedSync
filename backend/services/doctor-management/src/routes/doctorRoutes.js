const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[Doctor Management] CRITICAL: JWT_SECRET not found in environment.');
}

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

router.post('/register', doctorController.registerDoctor);
router.post('/login', doctorController.login);
router.get('/', doctorController.listDoctors);
router.get('/:id', doctorController.getDoctor);
router.put('/:id', auth, doctorController.updateDoctor);
router.get('/:id/analytics', auth, doctorController.getAnalytics);

// Availability
router.get('/:id/availability', auth, doctorController.getAvailability);
router.post('/:id/availability', auth, doctorController.addAvailability);
router.delete('/:id/availability/:slotId', auth, doctorController.deleteAvailability);

// Prescription Routes
router.post('/prescriptions', auth, doctorController.issuePrescription);
router.get('/prescriptions/verify/:verificationId', doctorController.getPrescriptionByVerifyId);

module.exports = router;
