const express = require('express');
const router = express.Router();
const { register, login, getCurrentOperator } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentOperator);

module.exports = router;
