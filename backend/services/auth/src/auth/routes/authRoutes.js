const express = require('express');
const router = express.Router();
const { register, login, listUsers, getProfile, updateUser, deleteUser } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

router.get('/profile', protect, getProfile);
router.get('/', protect, authorizeRoles('admin'), listUsers);
router.put('/:id', protect, authorizeRoles('admin'), updateUser);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;