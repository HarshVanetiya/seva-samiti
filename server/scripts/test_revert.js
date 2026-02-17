require('dotenv').config();
const prisma = require('../src/utils/prisma');
const { revertTransaction } = require('../src/controllers/transaction.controller');

async function main() {
    console.log('Starting Revert Transaction Verification...');

    let memberId;
    let loanId;
    let donationTxId;
    let membershipTxId;
    let loanTxId;
    let paymentTxId;
    let expenseTxId;

    // Create a mock response object
    const mockRes = (label) => ({
        status: (code) => {
            console.log(`[${label}] Status: ${code}`);
            return {
                json: (data) => console.log(`[${label}] Data:`, JSON.stringify(data, null, 2))
            };
        }
    });

    try {
        // --- Setup ---
        // 1. Create a Member (triggers MEMBERSHIP transaction)
        console.log('\n--- Step 1: Create Member ---');
        const member = await prisma.member.create({
            data: {
                name: 'TEST MEMBER REVERT ' + Date.now(),
                fathersName: 'TEST FATHER',
                accountNumber: `TEST-${Date.now()}`,
                joiningDate: new Date(),
            }
        });
        memberId = member.id;
        console.log(`Member created: ${member.id}`);

        const account = await prisma.account.create({
            data: {
                memberId: member.id,
                totalAmount: 100, // Membership Fee
                basicFee: 0,
                developmentFee: 0,
            }
        });

        // Manually create MEMBERSHIP transaction and update Org
        const membershipTx = await prisma.transactionLog.create({
            data: {
                type: 'MEMBERSHIP',
                amount: 100,
                description: 'Membership Fee',
                relatedMemberId: member.id,
            }
        });
        membershipTxId = membershipTx.id;

        // Upsert Organisation
        const org = await prisma.organisation.upsert({
            where: { id: 1 },
            update: { amount: { increment: 100 } },
            create: { id: 1, name: 'Seva Smiti', amount: 100 }
        });
        console.log(`Membership Transaction: ${membershipTx.id}`);

        // --- Test 2: Donation ---
        console.log('\n--- Step 2: Donation ---');
        const donationTx = await prisma.transactionLog.create({
            data: {
                type: 'DONATION',
                amount: 500,
                description: 'Test Donation',
            }
        });
        donationTxId = donationTx.id;
        await prisma.organisation.update({ where: { id: org.id }, data: { amount: { increment: 500 } } });
        console.log(`Donation Transaction: ${donationTx.id}`);

        // --- Test 3: Expense ---
        console.log('\n--- Step 3: Expense ---');
        const expenseTx = await prisma.transactionLog.create({
            data: {
                type: 'EXPENSE',
                amount: 50,
                description: 'Test Expense',
            }
        });
        expenseTxId = expenseTx.id;
        await prisma.organisation.update({ where: { id: org.id }, data: { amount: { decrement: 50 } } });
        console.log(`Expense Transaction: ${expenseTx.id}`);

        // --- Test 4: Loan Disbursement ---
        console.log('\n--- Step 4: Loan Disbursement ---');
        const loan = await prisma.loan.create({
            data: {
                memberId: member.id,
                principalAmount: 1000,
                remainingBalance: 1000,
                interestRate: 2,
                status: 'ACTIVE',
            }
        });
        loanId = loan.id;

        const loanTx = await prisma.transactionLog.create({
            data: {
                type: 'LOAN_DISBURSEMENT',
                amount: 1000,
                description: 'Test Loan',
                relatedMemberId: member.id,
                relatedLoanId: loan.id,
            }
        });
        loanTxId = loanTx.id;
        await prisma.organisation.update({ where: { id: org.id }, data: { amount: { decrement: 1000 } } });
        console.log(`Loan Transaction: ${loanTx.id}, Loan: ${loan.id}`);

        // --- Test 5: Loan Payment ---
        console.log('\n--- Step 5: Loan Payment ---');
        const payment = await prisma.loanPayment.create({
            data: {
                loanId: loan.id,
                interestAmount: 20,
                principalPaid: 100,
                paymentDate: new Date(),
            }
        });

        const paymentTx = await prisma.transactionLog.create({
            data: {
                type: 'LOAN_PAYMENT',
                amount: 120, // 100 + 20
                description: 'Test Payment',
                relatedMemberId: member.id,
                relatedLoanId: loan.id,
                relatedPaymentId: payment.id,
            }
        });
        paymentTxId = paymentTx.id;

        // Update Org and Loan
        await prisma.organisation.update({
            where: { id: org.id },
            data: { amount: { increment: 120 }, profit: { increment: 20 } }
        });
        await prisma.loan.update({
            where: { id: loan.id },
            data: {
                remainingBalance: { decrement: 100 },
                totalInterestPaid: { increment: 20 }
            }
        });
        console.log(`Payment Transaction: ${paymentTx.id}`);


        // --- VERIFICATION (Pre-Revert Snapshots) ---
        const orgBefore = await prisma.organisation.findUnique({ where: { id: org.id } });
        console.log('\n[Pre-Revert Status]');
        // Start Amount (from existing DB state) + 100 + 500 - 50 - 1000 + 120
        console.log(`Org Amount: ${orgBefore.amount}`);
        console.log(`Org Profit: ${orgBefore.profit}`);
        console.log(`Loan Balance: ${(await prisma.loan.findUnique({ where: { id: loanId } })).remainingBalance}`);

        // --- REVERT EXECUTION ---

        // 1. Revert Expense
        console.log('\n--- Reverting Expense ---');
        await revertTransaction({ params: { id: expenseTxId } }, mockRes('Expense Revert'));

        // 2. Revert Donation
        console.log('\n--- Reverting Donation ---');
        await revertTransaction({ params: { id: donationTxId } }, mockRes('Donation Revert'));

        // 3. Revert Payment
        console.log('\n--- Reverting Payment ---');
        await revertTransaction({ params: { id: paymentTxId } }, mockRes('Payment Revert'));

        // Verify Loan State after Payment Revert
        const loanAfterPaymentRevert = await prisma.loan.findUnique({ where: { id: loanId } });
        console.log(`Loan Balance after Payment Revert (Should be 1000): ${loanAfterPaymentRevert.remainingBalance}`);
        console.log(`Loan Interest Paid (Should be 0): ${loanAfterPaymentRevert.totalInterestPaid}`);

        // 4. Revert Membership
        console.log('\n--- Reverting Membership ---');
        await revertTransaction({ params: { id: membershipTxId } }, mockRes('Membership Revert'));

        // 5. Cascading Revert Test
        console.log('\n--- Creating another payment to test cascading revert ---');

        // Add a new payment
        const payment2 = await prisma.loanPayment.create({
            data: { loanId: loan.id, interestAmount: 10, principalPaid: 50 }
        });
        // Create Transaction Log for this payment
        const paymentTx2 = await prisma.transactionLog.create({
            data: {
                type: 'LOAN_PAYMENT',
                amount: 60,
                relatedLoanId: loan.id,
                relatedPaymentId: payment2.id,
                description: 'Cascading Test Payment'
            }
        });

        // Update Org
        await prisma.organisation.update({ where: { id: org.id }, data: { amount: { increment: 60 }, profit: { increment: 10 } } });

        console.log(`Created additional payment structure. Transaction ID: ${paymentTx2.id}`);
        console.log('\n--- Reverting Loan (Should cascade to payment2) ---');
        await revertTransaction({ params: { id: loanTxId } }, mockRes('Loan Revert (Cascade)'));

        // --- FINAL VERIFICATION ---
        const orgAfter = await prisma.organisation.findUnique({ where: { id: org.id } });
        console.log('\n[Post-Revert Status]');
        console.log(`Org Amount (Should match start): ${orgAfter.amount}`);
        console.log(`Org Profit (Should match start): ${orgAfter.profit}`);

        const loanFinal = await prisma.loan.findUnique({ where: { id: loanId } });
        console.log(`Loan Status (Should be CANCELLED): ${loanFinal.status}`);

        const txLogs = await prisma.transactionLog.findMany({
            where: { id: { in: [donationTxId, membershipTxId, loanTxId, paymentTxId, expenseTxId, paymentTx2.id] } }
        });

        console.log('\nTransaction Statuses:');
        txLogs.forEach(tx => console.log(`Tx ${tx.id} (${tx.type}): ${tx.type === 'CANCELLED' ? 'CANCELLED' : tx.type}`)); // Wait, type IS Cancelled in code

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
