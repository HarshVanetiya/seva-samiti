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
                orderBy: {
                    createdAt: 'desc',
                },
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

module.exports = {
    addDonation,
    addExpense,
    getTransactionHistory,
};
