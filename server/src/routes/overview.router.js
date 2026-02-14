const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/overview.controller');
const { authenticate } = require('../middleware/auth');

// All overview routes require authentication
router.use(authenticate);

router.get('/', getDashboard);

module.exports = router;
