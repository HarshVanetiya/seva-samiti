const express = require('express');
const router = express.Router();
const {
    createLoan,
    addLoanPayment,
    getAllLoans,
    getLoanById,
    getOverdueLoans,
} = require('../controllers/loan.controller');
const { authenticate } = require('../middleware/auth');

// All loan routes require authentication
router.use(authenticate);

// Loan routes
router.post('/', createLoan);
router.get('/', getAllLoans);
router.get('/overdue', getOverdueLoans);
router.get('/:id', getLoanById);
router.post('/:loanId/payments', addLoanPayment);

module.exports = router;
