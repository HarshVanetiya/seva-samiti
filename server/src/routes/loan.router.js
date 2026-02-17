const express = require('express');
const router = express.Router();
const {
    createLoan,
    addLoanPayment,
    getAllLoans,
    getLoanById,
    getOverdueLoans,
    updateLoan,
} = require('../controllers/loan.controller');
const { authenticate } = require('../middleware/auth');

// All loan routes require authentication
router.use(authenticate);

// Loan routes
router.post('/', createLoan);
router.get('/', getAllLoans);
router.get('/overdue', getOverdueLoans);
router.get('/:id', getLoanById);
router.put('/:id', updateLoan); // Added update route
router.post('/:loanId/payments', addLoanPayment);

module.exports = router;
