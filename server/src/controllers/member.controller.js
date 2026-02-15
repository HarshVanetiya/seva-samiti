const prisma = require('../utils/prisma');

/**
 * Create a new member with membership fee
 * This is atomic - creates member, account, and updates organisation fund in one transaction
 */
const createMember = async (req, res) => {
    try {
        const {
            name,
            fathersName,
            mobile,
            address,
            membershipFee,
            basicFee = 0,
            developmentFee = 0,
            joiningDate,
            accountNumber: providedAccountNumber,
        } = req.body;

        // Validation
        if (!name || !fathersName) {
            return res.status(400).json({
                success: false,
                message: 'Name and father\'s name are required',
            });
        }

        if (membershipFee === undefined || membershipFee === null || membershipFee < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid membership fee is required',
            });
        }

        // Generate account number if not provided (simple format: M + timestamp + random)
        const accountNumber = providedAccountNumber || `M${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Determine transaction date
        const now = new Date();
        let transactionDate = now;
        if (joiningDate) {
            const joinDate = new Date(joiningDate);
            // Create a new date with joining, date components but current time components
            transactionDate = new Date(
                joinDate.getFullYear(),
                joinDate.getMonth(),
                joinDate.getDate(),
                now.getHours(),
                now.getMinutes(),
                now.getSeconds(),
                now.getMilliseconds()
            );
        }

        // Create member with account and update organisation in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create member
            const member = await tx.member.create({
                data: {
                    accountNumber,
                    name: name.toUpperCase(),
                    fathersName: fathersName.toUpperCase(),
                    mobile: mobile || null,
                    address: address || null,
                    joiningDate: joiningDate ? new Date(joiningDate) : undefined,
                },
            });

            // 2. Create account for member
            const account = await tx.account.create({
                data: {
                    memberId: member.id,
                    totalAmount: membershipFee,
                    basicFee: basicFee,
                    developmentFee: developmentFee,
                },
            });

            // 3. Create transaction log
            await tx.transactionLog.create({
                data: {
                    type: 'MEMBERSHIP',
                    amount: membershipFee,
                    description: `Membership fee for ${member.name}`,
                    relatedMemberId: member.id,
                    createdAt: transactionDate,
                },
            });

            // 4. Update organisation fund atomically
            const organisation = await tx.organisation.findFirst();
            if (organisation) {
                await tx.organisation.update({
                    where: { id: organisation.id },
                    data: {
                        amount: { increment: membershipFee },
                    },
                });
            } else {
                // Create organisation if it doesn't exist
                await tx.organisation.create({
                    data: {
                        name: 'Seva Smiti',
                        amount: membershipFee,
                    },
                });
            }

            return { member, account };
        });

        res.status(201).json({
            success: true,
            message: 'Member created successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error in createMember:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Member with this account number already exists',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create member',
            error: error.message,
        });
    }
};

/**
 * Get all members with pagination
 */
const getAllMembers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = '',
            isActive = 'true',
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause
        const where = {
            isActive: isActive === 'true',
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { accountNumber: { contains: search, mode: 'insensitive' } },
                    { fathersName: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [members, total] = await Promise.all([
            prisma.member.findMany({
                where,
                include: {
                    account: true,
                    _count: {
                        select: {
                            loans: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take,
            }),
            prisma.member.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                members,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / take),
                },
            },
        });
    } catch (error) {
        console.error('Error in getAllMembers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch members',
            error: error.message,
        });
    }
};

/**
 * Get member by ID with detailed information
 */
const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const member = await prisma.member.findUnique({
            where: { id: parseInt(id) },
            include: {
                account: true,
                loans: {
                    orderBy: { loanDate: 'desc' },
                    include: {
                        payments: {
                            orderBy: { paymentDate: 'desc' },
                        },
                    },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20, // Last 20 transactions
                },
            },
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found',
            });
        }

        // Calculate active loans summary
        const activeLoans = member.loans.filter(loan => loan.status === 'ACTIVE');
        const totalActiveLoanAmount = activeLoans.reduce(
            (sum, loan) => sum + loan.remainingBalance,
            0
        );

        res.status(200).json({
            success: true,
            data: {
                member,
                summary: {
                    totalLoans: member.loans.length,
                    activeLoans: activeLoans.length,
                    totalActiveLoanAmount,
                },
            },
        });
    } catch (error) {
        console.error('Error in getMemberById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch member',
            error: error.message,
        });
    }
};

/**
 * Update member details
 */
const updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, fathersName, mobile, address } = req.body;

        // Check if member exists
        const existingMember = await prisma.member.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingMember) {
            return res.status(404).json({
                success: false,
                message: 'Member not found',
            });
        }

        // Update member
        const member = await prisma.member.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name: name.toUpperCase() }),
                ...(fathersName && { fathersName: fathersName.toUpperCase() }),
                mobile: mobile || null,
                address: address || null,
            },
            include: {
                account: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Member updated successfully',
            data: { member },
        });
    } catch (error) {
        console.error('Error in updateMember:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update member',
            error: error.message,
        });
    }
};

/**
 * Soft delete member (set isActive = false)
 */
const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if member exists
        const existingMember = await prisma.member.findUnique({
            where: { id: parseInt(id) },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (!existingMember) {
            return res.status(404).json({
                success: false,
                message: 'Member not found',
            });
        }

        // Check if member has active loans
        if (existingMember.loans.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete member with active loans. Please settle all loans first.',
            });
        }

        // Soft delete
        const member = await prisma.member.update({
            where: { id: parseInt(id) },
            data: { isActive: false },
        });

        res.status(200).json({
            success: true,
            message: 'Member deleted successfully',
            data: { member },
        });
    } catch (error) {
        console.error('Error in deleteMember:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete member',
            error: error.message,
        });
    }
};

module.exports = {
    createMember,
    getAllMembers,
    getMemberById,
    updateMember,
    deleteMember,
};
