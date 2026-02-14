const prisma = require('../utils/prisma');

/**
 * Get dashboard overview with all metrics
 */
const getDashboard = async (req, res) => {
    try {
        // Get organisation data
        const org = await prisma.organisation.findFirst();

        // Get active loans summary
        const activeLoans = await prisma.loan.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                principalAmount: true,
                remainingBalance: true,
            },
        });

        const totalActiveLoans = activeLoans.length;
        const totalActiveLoanAmount = activeLoans.reduce(
            (sum, loan) => sum + loan.remainingBalance,
            0
        );

        // Get overdue members (no payment in 6+ months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const allActiveLoans = await prisma.loan.findMany({
            where: { status: 'ACTIVE' },
            include: {
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    take: 1,
                },
                member: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const overdueLoans = allActiveLoans.filter(loan => {
            if (loan.payments.length === 0) {
                return loan.loanDate < sixMonthsAgo;
            }
            return loan.payments[0].paymentDate < sixMonthsAgo;
        });

        // Get total members count
        const totalMembers = await prisma.member.count({
            where: { isActive: true },
        });

        // Get recent transactions
        const recentTransactions = await prisma.transactionLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: {
                fund: {
                    cashInHand: org?.amount || 0,
                    totalProfit: org?.profit || 0,
                },
                loans: {
                    totalActive: totalActiveLoans,
                    totalActiveAmount: totalActiveLoanAmount,
                    overdueCount: overdueLoans.length,
                    overdueMembers: overdueLoans.map(loan => ({
                        loanId: loan.id,
                        memberName: loan.member.name,
                        principalAmount: loan.principalAmount,
                        remainingBalance: loan.remainingBalance,
                        lastPaymentDate: loan.payments[0]?.paymentDate || null,
                    })),
                },
                members: {
                    total: totalMembers,
                },
                recentTransactions,
            },
        });
    } catch (error) {
        console.error('Error in getDashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message,
        });
    }
};

module.exports = {
    getDashboard,
};
