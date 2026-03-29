const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medsync-secret-key-2026';

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

module.exports = router;
