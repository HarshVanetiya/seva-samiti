const prisma = require('../utils/prisma');

/**
 * Add a donation to the fund
 */
const addDonation = async (req, res) => {
    try {
        const { amount, description, donorName, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create transaction log
            const transaction = await tx.transactionLog.create({
                data: {
                    type: 'DONATION',
                    amount,
                    description: description || `Donation${donorName ? ` from ${donorName}` : ''}`,
                    createdAt: date ? new Date(date) : undefined,
                },
            });

            // 2. Update organisation fund
            const org = await tx.organisation.findFirst();
            await tx.organisation.update({
                where: { id: org.id },
                data: {
                    amount: { increment: amount },
                },
            });

            return transaction;
        });

        res.status(201).json({
            success: true,
            message: 'Donation added successfully',
            data: { transaction: result },
        });
    } catch (error) {
        console.error('Error in addDonation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add donation',
            error: error.message,
        });
    }
};

/**
 * Add an expense (withdrawal from fund)
 */
const addExpense = async (req, res) => {
    try {
        const { amount, description, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Description/reason is required for expenses',
            });
        }

        // Check if organisation has sufficient funds
        const org = await prisma.organisation.findFirst();
        if (!org || org.amount < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient funds in organisation',
                available: org?.amount || 0,
                required: amount,
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create transaction log
            const transaction = await tx.transactionLog.create({
                data: {
                    type: 'EXPENSE',
                    amount,
                    description,
                    createdAt: date ? new Date(date) : undefined,
                },
            });

            // 2. Update organisation fund
            await tx.organisation.update({
                where: { id: org.id },
                data: {
                    amount: { decrement: amount },
                },
            });

            return transaction;
        });

        res.status(201).json({
            success: true,
            message: 'Expense recorded successfully',
            data: { transaction: result },
        });
    } catch (error) {
        console.error('Error in addExpense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record expense',
            error: error.message,
        });
    }
};

/**
 * Get transaction history with filters
 */
const getTransactionHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            type,
            memberId,
            startDate,
            endDate,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            ...(type && { type }),
            ...(memberId && { relatedMemberId: parseInt(memberId) }),
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };

        const [transactions, total] = await Promise.all([
            prisma.transactionLog.findMany({
                where,
                include: {
                    member: {
                        select: {
                            id: true,
                            accountNumber: true,
                            name: true,
                        },
                    },
                    loan: {
                        select: {
                            id: true,
                            principalAmount: true,
                        },
                    },
                },
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ],
                skip,
                take,
            }),
            prisma.transactionLog.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / take),
                },
            },
        });
    } catch (error) {
        console.error('Error in getTransactionHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message,
        });
    }
};

/**
 * Revert a transaction
 */
const revertTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch transaction with related data
        const transaction = await prisma.transactionLog.findUnique({
            where: { id: parseInt(id) },
            include: {
                loan: true,
                payment: true,
            },
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        if (transaction.type === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Transaction is already cancelled',
            });
        }

        // Perform revert logic in a transaction
        await prisma.$transaction(async (tx) => {
            const org = await tx.organisation.findFirst();
            if (!org) throw new Error('Organisation not found');

            switch (transaction.type) {
                case 'DONATION':
                    // Revert: Deduct from org fund
                    await tx.organisation.update({
                        where: { id: org.id },
                        data: { amount: { decrement: transaction.amount } },
                    });
                    break;

                case 'MEMBERSHIP':
                    // Revert: Deduct from org fund and account
                    // Note: Member is NOT deleted, just unpaid status
                    await tx.organisation.update({
                        where: { id: org.id },
                        data: { amount: { decrement: transaction.amount } },
                    });

                    if (transaction.relatedMemberId) {
                        const account = await tx.account.findUnique({
                            where: { memberId: transaction.relatedMemberId },
                        });
                        if (account) {
                            await tx.account.update({
                                where: { id: account.id },
                                data: {
                                    totalAmount: { decrement: transaction.amount },
                                    // Assuming membership fee usually goes to totalAmount. 
                                    // If split between basic/development, we might need more logic or just reduce total.
                                    // Based on createMember, it sets totalAmount = membershipFee.
                                },
                            });
                        }
                    }
                    break;

                case 'EXPENSE':
                    // Revert: Add back to org fund
                    await tx.organisation.update({
                        where: { id: org.id },
                        data: { amount: { increment: transaction.amount } },
                    });
                    break;

                case 'LOAN_DISBURSEMENT':
                    // Revert: Add back to org fund, Cancel Loan, AND Cancel all related payments
                    await tx.organisation.update({
                        where: { id: org.id },
                        data: { amount: { increment: transaction.amount } },
                    });

                    // Update Loan status to CANCELLED
                    if (transaction.relatedLoanId) {
                        await tx.loan.update({
                            where: { id: transaction.relatedLoanId },
                            data: { status: 'CANCELLED' },
                        });

                        // CASCADING REVERT: Find all payments for this loan
                        // We need to find transactions of type LOAN_PAYMENT that share this loanId
                        const relatedPayments = await tx.transactionLog.findMany({
                            where: {
                                relatedLoanId: transaction.relatedLoanId,
                                type: 'LOAN_PAYMENT',
                                NOT: { type: 'CANCELLED' } // Only revert active ones
                            },
                            include: {
                                payment: true
                            }
                        });

                        for (const payTx of relatedPayments) {
                            // Revert financial effect of this payment
                            // Payment adds to Org Amount (Total) and Profit (Interest)
                            // So we reduce Amount and Profit

                            const interestPortion = payTx.payment?.interestAmount || 0;

                            await tx.organisation.update({
                                where: { id: org.id },
                                data: {
                                    amount: { decrement: payTx.amount },
                                    profit: { decrement: interestPortion },
                                }
                            });

                            // Mark payment transaction as CANCELLED
                            await tx.transactionLog.update({
                                where: { id: payTx.id },
                                data: { type: 'CANCELLED' }
                            });
                        }
                    }
                    break;

                case 'LOAN_PAYMENT':
                    // Revert: Deduct from org fund, Deduct from profit, Revert Loan Balance
                    await tx.organisation.update({
                        where: { id: org.id },
                        data: { amount: { decrement: transaction.amount } },
                    });

                    // Deduct interest from profit
                    // We need to know the interest portion. 
                    // Option 1: It's in the payment record (transaction.payment)
                    // Option 2: Parse from description (risky)
                    // We included 'payment' in the fetch.

                    let interestPaid = 0;
                    let principalPaid = 0;

                    if (transaction.payment) {
                        interestPaid = transaction.payment.interestAmount;
                        principalPaid = transaction.payment.principalPaid;
                    }

                    if (interestPaid > 0) {
                        await tx.organisation.update({
                            where: { id: org.id },
                            data: { profit: { decrement: interestPaid } },
                        });
                    }

                    if (transaction.relatedLoanId) {
                        const loan = await tx.loan.findUnique({ where: { id: transaction.relatedLoanId } });
                        if (loan) {
                            await tx.loan.update({
                                where: { id: loan.id },
                                data: {
                                    remainingBalance: { increment: principalPaid }, // Add back principal
                                    totalInterestPaid: { decrement: interestPaid },
                                    status: loan.status === 'COMPLETED' ? 'ACTIVE' : loan.status, // Revert completion
                                    completedAt: loan.status === 'COMPLETED' ? null : loan.completedAt,
                                },
                            });

                            // Delete the LoanPayment record so it doesn't show up in history or calculations
                            if (transaction.relatedPaymentId) {
                                await tx.loanPayment.delete({
                                    where: { id: transaction.relatedPaymentId },
                                });
                            }
                        }
                    }
                    break;

                case 'RELEASED_MONEY':
                    // Revert: Add back to org fund (since released money is money OUT)
                    await tx.organisation.update({
                        where: { id: org.id },
                        data: { amount: { increment: transaction.amount } },
                    });
                    break;

                default:
                    throw new Error(`Unsupported transaction type for revert: ${transaction.type}`);
            }

            // Finally, mark the transaction itself as CANCELLED
            await tx.transactionLog.update({
                where: { id: transaction.id },
                data: { type: 'CANCELLED' },
            });
        });

        res.status(200).json({
            success: true,
            message: 'Transaction reverted successfully',
        });

    } catch (error) {
        console.error('Error in revertTransaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revert transaction',
            error: error.message,
        });
    }
};

module.exports = {
    addDonation,
    addExpense,
    getTransactionHistory,
    revertTransaction,
};
