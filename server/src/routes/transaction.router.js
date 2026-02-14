const express = require('express');
const router = express.Router();
const {
    addDonation,
    addExpense,
    getTransactionHistory,
} = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth');

// All transaction routes require authentication
router.use(authenticate);

router.post('/donations', addDonation);
router.post('/expenses', addExpense);
router.get('/history', getTransactionHistory);

module.exports = router;
