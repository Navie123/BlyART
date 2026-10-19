const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public
router.post('/login', login);

// Admin-only: create new users (admin or technician)
router.post('/register', protect, authorize('admin'), register);

// Any authenticated user
router.get('/me', protect, getMe);

module.exports = router;
