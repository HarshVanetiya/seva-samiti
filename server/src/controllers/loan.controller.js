const prisma = require('../utils/prisma');

/**
 * Create a new loan for a member
 * Atomically: creates loan, reduces organisation fund, logs transaction
 */
const createLoan = async (req, res) => {
    try {
        const {
            memberId,
            principalAmount,
            interestRate,
            loanDate,
            scheme = 'OLD_SCHEME',
        } = req.body;

        // Validation
        if (!memberId || !principalAmount || !interestRate) {
            return res.status(400).json({
                success: false,
                message: 'Member ID, principal amount, and interest rate are required',
            });
        }

        if (principalAmount <= 0 || interestRate < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid principal amount or interest rate',
            });
        }

        // Check if member exists and is active
        const member = await prisma.member.findUnique({
            where: { id: parseInt(memberId) },
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found',
            });
        }

        if (!member.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create loan for inactive member',
            });
        }

        // Check organisation has sufficient funds
        const org = await prisma.organisation.findFirst();
        if (!org || org.amount < principalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient funds in organisation',
                available: org?.amount || 0,
                required: principalAmount,
            });
        }

        // Create loan and update fund in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create loan
            const loan = await tx.loan.create({
                data: {
                    memberId: parseInt(memberId),
                    principalAmount,
                    remainingBalance: principalAmount,
                    interestRate,
                    loanDate: loanDate ? new Date(loanDate) : new Date(),
                    scheme,
                    status: 'ACTIVE',
                },
                include: {
                    member: true,
                },
            });

            // 2. Create transaction log
            await tx.transactionLog.create({
                data: {
                    type: 'LOAN_DISBURSEMENT',
                    amount: principalAmount,
                    description: `Loan disbursed to ${member.name}`,
                    relatedMemberId: parseInt(memberId),
                    relatedLoanId: loan.id,
                    createdAt: loanDate ? new Date(loanDate) : new Date(),
                },
            });

            // 3. Reduce organisation fund
            await tx.organisation.update({
                where: { id: org.id },
                data: {
                    amount: { decrement: principalAmount },
                },
            });

            return loan;
        });

        res.status(201).json({
            success: true,
            message: 'Loan created successfully',
            data: { loan: result },
        });
    } catch (error) {
        console.error('Error in createLoan:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create loan',
            error: error.message,
        });
    }
};

/**
 * Add a loan payment (interest only or with principal)
 * Atomically: creates payment, updates loan, updates org fund and profit
 */
const addLoanPayment = async (req, res) => {
    try {
        const { loanId } = req.params;
        const { category } = req.query; // Check if this is relevant, actually focusing on addLoanPayment

        const {
            interestPaid,
            interestAmount: _interestAmount,
            principalPaid = 0,
            paymentDate,
        } = req.body;

        // Create a single interestAmount variable
        const interestAmount = interestPaid !== undefined ? interestPaid : (_interestAmount || 0);

        // Validation
        if (interestAmount < 0 || principalPaid < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment amounts',
            });
        }

        // Get loan details
        const loan = await prisma.loan.findUnique({
            where: { id: parseInt(loanId) },
            include: { member: true },
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }

        if (loan.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Loan is already completed',
            });
        }

        if (principalPaid > loan.remainingBalance) {
            return res.status(400).json({
                success: false,
                message: 'Principal payment exceeds remaining balance',
                remaining: loan.remainingBalance,
            });
        }

        // Process payment in transaction
        const result = await prisma.$transaction(async (tx) => {
            const totalPayment = interestAmount + principalPaid;

            // 1. Create payment record
            const payment = await tx.loanPayment.create({
                data: {
                    loanId: parseInt(loanId),
                    interestAmount,
                    principalPaid,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                },
            });

            // 2. Update loan
            const newRemainingBalance = loan.remainingBalance - principalPaid;
            const isCompleted = newRemainingBalance === 0;

            const updatedLoan = await tx.loan.update({
                where: { id: parseInt(loanId) },
                data: {
                    remainingBalance: newRemainingBalance,
                    totalInterestPaid: { increment: interestAmount },
                    status: isCompleted ? 'COMPLETED' : 'ACTIVE',
                    completedAt: isCompleted ? new Date() : null,
                },
                include: { member: true },
            });

            // 3. Create transaction log
            await tx.transactionLog.create({
                data: {
                    type: 'LOAN_PAYMENT',
                    amount: totalPayment,
                    description: `Loan payment from ${loan.member.name} (Interest: ₹${interestAmount}, Principal: ₹${principalPaid})`,
                    relatedMemberId: loan.memberId,
                    relatedLoanId: parseInt(loanId),
                    relatedPaymentId: payment.id,
                    createdAt: paymentDate ? new Date(paymentDate) : new Date(),
                },
            });

            // 4. Update organisation fund and profit
            const org = await tx.organisation.findFirst();
            await tx.organisation.update({
                where: { id: org.id },
                data: {
                    amount: { increment: totalPayment },
                    profit: { increment: interestAmount },
                },
            });

            return { payment, loan: updatedLoan };
        });

        res.status(201).json({
            success: true,
            message: result.loan.status === 'COMPLETED'
                ? 'Loan settled successfully'
                : 'Payment added successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error in addLoanPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment',
            error: error.message,
        });
    }
};

/**
 * Get all loans with filters
 */
const getAllLoans = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            memberId,
            search,
            pagination
        } = req.query;

        // If pagination is explicitly disabled or limit is -1, fetch all
        const isPaginationDisabled = pagination === 'false' || limit === '-1';

        const skip = isPaginationDisabled ? undefined : (parseInt(page) - 1) * parseInt(limit);
        const take = isPaginationDisabled ? undefined : parseInt(limit);

        const where = {
            ...(status && { status }),
            ...(memberId && { memberId: parseInt(memberId) }),
            ...(search && {
                OR: [
                    { member: { name: { contains: search, mode: 'insensitive' } } },
                    { member: { accountNumber: { contains: search, mode: 'insensitive' } } },
                    { member: { fathersName: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };

        const [loans, total] = await Promise.all([
            prisma.loan.findMany({
                where,
                include: {
                    member: {
                        select: {
                            id: true,
                            accountNumber: true,
                            name: true,
                            fathersName: true,
                        },
                    },
                    _count: {
                        select: {
                            payments: true,
                        },
                    },
                },
                orderBy: {
                    member: {
                        accountNumber: 'asc',
                    },
                },
                skip,
                take,
            }),
            prisma.loan.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                loans,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / take),
                },
            },
        });
    } catch (error) {
        console.error('Error in getAllLoans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loans',
            error: error.message,
        });
    }
};

/**
 * Get loan by ID with payment history
 */
const getLoanById = async (req, res) => {
    try {
        const { id } = req.params;

        const loan = await prisma.loan.findUnique({
            where: { id: parseInt(id) },
            include: {
                member: true,
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }

        res.status(200).json({
            success: true,
            data: { loan },
        });
    } catch (error) {
        console.error('Error in getLoanById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loan',
            error: error.message,
        });
    }
};

/**
 * Get overdue loans (no payment in last 6 months)
 */
const getOverdueLoans = async (req, res) => {
    try {
        console.log("Request Query:", req.query); // Debug: Check what params are received
        const { months = 3 } = req.query; // Default to 3 months as per requirement
        const monthsThreshold = parseInt(months);

        const thresholdDate = new Date();
        thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold);

        console.log(`[DEBUG] getOverdueLoans: months=${months}, thresholdDate=${thresholdDate.toISOString()}`);

        const activeLoans = await prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                member: {
                    select: {
                        id: true,
                        accountNumber: true,
                        name: true,
                        fathersName: true,
                        mobile: true,
                    },
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    take: 1,
                },
            },
        });

        console.log(`[DEBUG] Found ${activeLoans.length} active loans.`);

        // Filter loans with no payment in monthsThreshold+ months
        const overdueLoans = activeLoans.filter(loan => {
            let lastActivityDate;
            let isOverdue = false;

            if (loan.payments.length === 0) {
                // No payments yet - check if loan is older than threshold
                lastActivityDate = new Date(loan.loanDate);
                isOverdue = lastActivityDate < thresholdDate;
                console.log(`[DEBUG] Loan ${loan.id} (No payments): Date=${lastActivityDate.toISOString()} < Threshold? ${isOverdue}`);
                return isOverdue;
            }

            // Check if last payment was before threshold
            lastActivityDate = new Date(loan.payments[0].paymentDate);
            isOverdue = lastActivityDate < thresholdDate;
            console.log(`[DEBUG] Loan ${loan.id} (Last Payment): Date=${lastActivityDate.toISOString()} < Threshold? ${isOverdue}`);
            return isOverdue;
        });

        console.log(`[DEBUG] Returning ${overdueLoans.length} overdue loans.`);

        res.status(200).json({
            success: true,
            data: {
                overdueLoans,
                count: overdueLoans.length,
                thresholdDate,
            },
        });
    } catch (error) {
        console.error('Error in getOverdueLoans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overdue loans',
            error: error.message,
        });
    }
};

module.exports = {
    createLoan,
    addLoanPayment,
    getAllLoans,
    getLoanById,
    getOverdueLoans,
};
