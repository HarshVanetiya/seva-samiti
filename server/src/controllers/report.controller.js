const ExcelJS = require('exceljs');
const prisma = require('../utils/prisma');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Generate Database Backup (.sql)
 * Uses pg_dump from local PostgreSQL installation
 */
const getDatabaseBackup = async (req, res) => {
    try {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL not found');
        }

        // Parse DB URL to get credentials
        // Format: postgres://user:password@host:port/dbname
        const match = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (!match) {
            throw new Error('Invalid DATABASE_URL format');
        }

        const [, user, password, host, port, dbname] = match;

        // Path to pg_dump - assuming standard installation based on user input
        const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe';

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.sql`);

        const env = { ...process.env, PGPASSWORD: password };

        const dumpProcess = spawn(pgDumpPath, [
            '-U', user,
            '-h', host,
            '-p', port,
            '--clean',      // Clean (drop) database objects before creating
            '--if-exists',  // Use IF EXISTS when dropping objects
            '--inserts',    // Dump data as INSERT commands (more portable)
            dbname
        ], { env });

        dumpProcess.stdout.pipe(res);

        dumpProcess.stderr.on('data', (data) => {
            console.error(`pg_dump stderr: ${data}`);
        });

        dumpProcess.on('error', (error) => {
            console.error('Failed to start pg_dump:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to create backup process' });
            }
        });

        dumpProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`pg_dump process exited with code ${code}`);
            }
        });

    } catch (error) {
        console.error('Error generating backup:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to generate backup' });
        }
    }
};

/**
 * Generate Organisation Report (Summary + Loan Details)
 */
const getOrganisationReport = async (req, res) => {
    try {
        // 1. Fetch Data
        const [transactionStats, loans, membersCount] = await Promise.all([
            prisma.transactionLog.groupBy({
                by: ['type'],
                _sum: { amount: true },
            }),
            prisma.loan.findMany({
                include: {
                    member: {
                        select: { name: true, accountNumber: true }
                    }
                },
                orderBy: { loanDate: 'desc' }
            }),
            prisma.member.count()
        ]);

        // 2. Calculate Stats
        let totalDonations = 0;
        let totalMembershipFees = 0;
        let totalLoanInterest = 0;
        let totalLoanPrincipalRepaid = 0; // Need to fetch from payments to be accurate or infer?
        // Better approach for principal repaid: Sum of LOAN_PAYMENT where principalPaid > 0? 
        // usage of transactionLog type LOAN_PAYMENT includes both.
        // Let's use transaction logs for cash flow.

        let totalIncome = 0;
        let totalExpenses = 0;
        let totalLoanDisbursed = 0;

        // Process transaction stats
        transactionStats.forEach(stat => {
            const amount = stat._sum.amount || 0;
            switch (stat.type) {
                case 'DONATION':
                    totalDonations += amount;
                    totalIncome += amount;
                    break;
                case 'MEMBERSHIP':
                    totalMembershipFees += amount;
                    totalIncome += amount;
                    break;
                case 'LOAN_PAYMENT':
                    // This includes principal + interest
                    totalIncome += amount;
                    break;
                case 'INTEREST_PAYMENT': // If used separately
                    totalIncome += amount;
                    break;
                case 'LOAN_DISBURSEMENT':
                    totalLoanDisbursed += amount;
                    totalExpenses += amount;
                    break;
                case 'EXPENSE':
                    totalExpenses += amount;
                    break;
            }
        });

        // Calculate specific loan stats from Loans table for accuracy on Active/Completed
        let totalActiveLoanAmount = 0;
        let totalCompletedLoanAmount = 0;
        let totalProfitFromInterest = 0; // Strictly interest

        loans.forEach(loan => {
            if (loan.status === 'ACTIVE') {
                totalActiveLoanAmount += loan.remainingBalance;
            } else if (loan.status === 'COMPLETED') {
                // For completed, the original principal is what was lent.
                // We can't easily get "current amount" for completed, but we know it's 0 remaining.
                totalCompletedLoanAmount += loan.principalAmount;
            }
            totalProfitFromInterest += loan.totalInterestPaid;
        });

        const cashInHand = totalIncome - totalExpenses;

        // 3. Generate Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Seva Smiti';
        workbook.created = new Date();

        // --- Sheet 1: Summary ---
        const summarySheet = workbook.addWorksheet('Organisation Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 },
        ];

        summarySheet.addRows([
            { metric: 'Report Date', value: new Date().toLocaleDateString() },
            { metric: '', value: '' },
            { metric: 'Cash in Hand (Calculated)', value: cashInHand },
            { metric: '', value: '' },
            { metric: 'Total Members', value: membersCount },
            { metric: '', value: '' },
            { metric: 'Total Income (All Sources)', value: totalIncome },
            { metric: 'Total Expenses (All Sources)', value: totalExpenses },
            { metric: '', value: '' },
            { metric: 'Total Donations Received', value: totalDonations },
            { metric: 'Total Membership Fees', value: totalMembershipFees },
            { metric: 'Total Interest Collected (Profit)', value: totalProfitFromInterest },
            { metric: '', value: '' },
            { metric: 'Total Loan Disbursed', value: totalLoanDisbursed },
            { metric: 'Current Active Loans (Remaining)', value: totalActiveLoanAmount },
        ]);

        // Style the Summary
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getColumn('value').numFmt = '₹#,##0.00';

        // --- Sheet 2: All Loans ---
        const loanSheet = workbook.addWorksheet('All Loans');
        loanSheet.columns = [
            { header: 'Account No', key: 'accountNumber', width: 15 },
            { header: 'Member Name', key: 'name', width: 25 },
            { header: 'Principal', key: 'principal', width: 15 },
            { header: 'Remaining', key: 'remaining', width: 15 },
            { header: 'Interest Paid', key: 'interestPaid', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Disbursed Date', key: 'loanDate', width: 15 },
            { header: 'Completed Date', key: 'completedAt', width: 15 },
        ];

        loans.forEach(loan => {
            loanSheet.addRow({
                accountNumber: loan.member.accountNumber,
                name: loan.member.name,
                principal: loan.principalAmount,
                remaining: loan.remainingBalance,
                interestPaid: loan.totalInterestPaid,
                status: loan.status,
                loanDate: loan.loanDate ? new Date(loan.loanDate).toLocaleDateString() : '',
                completedAt: loan.completedAt ? new Date(loan.completedAt).toLocaleDateString() : '-',
            });
        });

        // Style header
        loanSheet.getRow(1).font = { bold: true };
        ['principal', 'remaining', 'interestPaid'].forEach(key => {
            loanSheet.getColumn(key).numFmt = '₹#,##0.00';
        });

        // 4. Send Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Organisation_Report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating organisation report:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

/**
 * Generate Member Report (Active Loan Calculations)
 */
const getMemberReport = async (req, res) => {
    try {
        // 1. Fetch Members with Active Loans
        const membersWithLoans = await prisma.member.findMany({
            where: {
                loans: {
                    some: { status: 'ACTIVE' }
                }
            },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                    include: {
                        payments: {
                            orderBy: { paymentDate: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        // 2. Generate Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Seva Smiti';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Member Loan Status');
        sheet.columns = [
            { header: 'Account No', key: 'accountNumber', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Father\'s Name', key: 'fathersName', width: 25 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'Loan Principal', key: 'principal', width: 15 },
            { header: 'Loan Date', key: 'loanDate', width: 15 },
            { header: 'Last Payment Date', key: 'lastPaymentDate', width: 18 },
            { header: 'Months Pending', key: 'monthsPending', width: 15 },
            { header: 'Interest/Month', key: 'interestPerMonth', width: 15 },
            { header: 'Suggested Interest', key: 'suggestedInterest', width: 18 },
            { header: 'Total Interest Paid', key: 'totalInterestPaid', width: 18 },
        ];

        const today = new Date();

        membersWithLoans.forEach(member => {
            member.loans.forEach(loan => {
                // Calculate metrics
                const loanDate = new Date(loan.loanDate);
                const lastPaymentDate = loan.payments.length > 0
                    ? new Date(loan.payments[0].paymentDate)
                    : loanDate;

                // Calculate months difference
                const diffTime = Math.abs(today - lastPaymentDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Approximate months (can be fractional or integer based on business logic)
                // Using simple month difference for now
                let monthsPending = (today.getFullYear() - lastPaymentDate.getFullYear()) * 12;
                monthsPending -= lastPaymentDate.getMonth();
                monthsPending += today.getMonth();

                // Adjust if day of month is earlier (optional, but let's keep it simple integer months for now or float)
                // If we want exact fractional months:
                // monthsPending += (today.getDate() - lastPaymentDate.getDate()) / 30;

                // Ensure at least 0
                monthsPending = Math.max(0, monthsPending);

                // Interest Per Month = (Principal * Rate) / 100
                // Note: Is it Original Principal or Remaining? Usually calculated on Remaining Balance or Original depending on scheme.
                // "New Scheme" / "Old Scheme" might differ.
                // Request said: "how much money is given in loan ... how much they have paid ... Interest Calculation"
                // Assuming Simple Interest on *Remaining Balance* is standard for reducing balance, 
                // BUT "Suggested Interest" usually implies interest on the *current outstanding* for the pending period.
                // Let's use Remaining Balance for calculation.
                const interestPerMonth = (loan.remainingBalance * loan.interestRate) / 100;

                const suggestedInterest = Math.round(interestPerMonth * monthsPending);

                sheet.addRow({
                    accountNumber: member.accountNumber,
                    name: member.name,
                    fathersName: member.fathersName,
                    mobile: member.mobile || '-',
                    principal: loan.remainingBalance, // Showing remaining principal
                    loanDate: loanDate.toLocaleDateString(),
                    lastPaymentDate: lastPaymentDate.toLocaleDateString(),
                    monthsPending: monthsPending <= 0 ? 0 : monthsPending, // Show 0 if negative (future date case?)
                    interestPerMonth: interestPerMonth,
                    suggestedInterest: suggestedInterest,
                    totalInterestPaid: loan.totalInterestPaid
                });
            });
        });

        // Style
        sheet.getRow(1).font = { bold: true };
        ['principal', 'interestPerMonth', 'suggestedInterest', 'totalInterestPaid'].forEach(key => {
            sheet.getColumn(key).numFmt = '₹#,##0.00';
        });

        // 3. Send Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Member_Report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating member report:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

module.exports = {
    getOrganisationReport,
    getMemberReport,
    getDatabaseBackup
};
