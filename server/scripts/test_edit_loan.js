require('dotenv').config();
const prisma = require('../src/utils/prisma');
const { updateLoan } = require('../src/controllers/loan.controller');

async function main() {
    console.log('Starting Edit Loan Verification...');

    let memberId;
    let loanId;

    // Mock Response
    const mockRes = (label) => ({
        status: (code) => {
            console.log(`[${label}] Status: ${code}`);
            return {
                json: (data) => console.log(`[${label}] Data:`, JSON.stringify(data, null, 2))
            };
        }
    });

    try {
        // 1. Setup Data
        const member = await prisma.member.create({
            data: {
                name: 'TEST EDIT LOAN ' + Date.now(),
                fathersName: 'TEST FATHER',
                accountNumber: `EDIT-${Date.now()}`,
                joiningDate: new Date(),
            }
        });
        memberId = member.id;

        const loan = await prisma.loan.create({
            data: {
                memberId: member.id,
                principalAmount: 1000,
                remainingBalance: 1000,
                interestRate: 2,
                loanDate: new Date('2026-01-01'),
                status: 'ACTIVE',
            }
        });
        loanId = loan.id;

        // Create Disbursement Transaction
        await prisma.transactionLog.create({
            data: {
                type: 'LOAN_DISBURSEMENT',
                amount: 1000,
                relatedLoanId: loan.id,
                createdAt: new Date('2026-01-01'),
            }
        });

        console.log(`Created Loan ${loanId} on 2026-01-01`);

        // 2. Test Success Update
        console.log('\n--- Test 1: Update Loan Date (Success) ---');
        await updateLoan(
            { params: { id: loanId }, body: { loanDate: '2026-01-05' } },
            mockRes('Update Success')
        );

        // Verify DB
        const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });
        const disburseTx = await prisma.transactionLog.findFirst({
            where: { relatedLoanId: loanId, type: 'LOAN_DISBURSEMENT' }
        });

        console.log(`Updated Loan Date: ${updatedLoan.loanDate.toISOString()} (Expected: 2026-01-05)`);
        console.log(`Updated Tx Date: ${disburseTx.createdAt.toISOString()} (Expected: 2026-01-05)`);

        // 3. Add Payment
        await prisma.loanPayment.create({
            data: {
                loanId: loanId,
                interestAmount: 20,
                paymentDate: new Date('2026-02-01')
            }
        });
        console.log('\nAdded Payment on 2026-02-01');

        // 4. Test Validation Failure (Date after payment)
        console.log('\n--- Test 2: Update Loan Date after Payment (Failure) ---');
        await updateLoan(
            { params: { id: loanId }, body: { loanDate: '2026-02-05' } },
            mockRes('Update Fail')
        );

        // 5. Test Update Before Payment (Success)
        console.log('\n--- Test 3: Update Loan Date before Payment (Success) ---');
        await updateLoan(
            { params: { id: loanId }, body: { loanDate: '2026-01-10' } },
            mockRes('Update Success 2')
        );

    } catch (e) {
        console.error(e);
    } finally {
        // Cleanup?
        await prisma.$disconnect();
    }
}

main();
