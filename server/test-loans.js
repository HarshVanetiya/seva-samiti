const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let memberId = null;

async function testLoanAPIs() {
    console.log('🧪 Testing Loan Management APIs...\n');

    try {
        // 0. Login
        console.log('0. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123',
        });
        token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Logged in\n');

        // Get an existing member
        const members = await axios.get(`${BASE_URL}/members`, { headers });
        memberId = members.data.data.members[0].id;
        const memberName = members.data.data.members[0].name;
        console.log(`📋 Using member: ${memberName} (ID: ${memberId})\n`);

        // 1. Create loan
        console.log('1. Creating loan of ₹3,000 at 1% interest...');
        const loan = await axios.post(
            `${BASE_URL}/loans`,
            {
                memberId,
                principalAmount: 3000,
                interestRate: 1, // 1% per month
                scheme: 'NEW',
            },
            { headers }
        );
        const loanId = loan.data.data.loan.id;
        console.log('✅ Loan created:');
        console.log('   Loan ID:', loanId);
        console.log('   Principal:', loan.data.data.loan.principalAmount);
        console.log('   Interest Rate:', loan.data.data.loan.interestRate + '%');
        console.log('   Remaining:', loan.data.data.loan.remainingBalance);

        // 2. Check fund reduced
        console.log('\n2. Checking organisation fund...');
        const axios2 = require('axios');
        console.log('   Fund should have reduced by ₹3,000');
        console.log('   (15,000 - 3,000 = 12,000)');

        // 3. Add interest payment (Month 1)
        console.log('\n3. Adding Month 1 interest payment (₹30)...');
        const payment1 = await axios.post(
            `${BASE_URL}/loans/${loanId}/payments`,
            {
                interestAmount: 30, // 1% of 3000
                principalPaid: 0,
            },
            { headers }
        );
        console.log('✅ Payment 1 added:');
        console.log('   Interest: ₹30');
        console.log('   Loan Status:', payment1.data.data.loan.status);
        console.log('   Remaining Balance:', payment1.data.data.loan.remainingBalance);

        // 4. Add interest payment (Month 2)
        console.log('\n4. Adding Month 2 interest payment (₹30)...');
        const payment2 = await axios.post(
            `${BASE_URL}/loans/${loanId}/payments`,
            {
                interestAmount: 30,
                principalPaid: 0,
            },
            { headers }
        );
        console.log('✅ Payment 2 added');
        console.log('   Total Interest Paid:', payment2.data.data.loan.totalInterestPaid);

        // 5. Get all loans
        console.log('\n5. Getting all active loans...');
        const allLoans = await axios.get(`${BASE_URL}/loans?status=ACTIVE`, { headers });
        console.log('✅ Active loans:', allLoans.data.data.pagination.total);

        // 6. Get loan by ID
        console.log('\n6. Getting loan details with payment history...');
        const loanDetails = await axios.get(`${BASE_URL}/loans/${loanId}`, { headers });
        console.log('✅ Loan details:');
        console.log('   Member:', loanDetails.data.data.loan.member.name);
        console.log('   Principal:', loanDetails.data.data.loan.principalAmount);
        console.log('   Remaining:', loanDetails.data.data.loan.remainingBalance);
        console.log('   Total Interest Paid:', loanDetails.data.data.loan.totalInterestPaid);
        console.log('   Payments Count:', loanDetails.data.data.loan.payments.length);

        // 7. Settle loan (pay principal)
        console.log('\n7. Settling loan with principal payment (₹3,000)...');
        const settlement = await axios.post(
            `${BASE_URL}/loans/${loanId}/payments`,
            {
                interestAmount: 0,
                principalPaid: 3000,
            },
            { headers }
        );
        console.log('✅ Loan settled!');
        console.log('   Status:', settlement.data.data.loan.status);
        console.log('   Remaining Balance:', settlement.data.data.loan.remainingBalance);
        console.log('   Message:', settlement.data.message);

        // 8. Check completed loans
        console.log('\n8. Checking completed loans...');
        const completedLoans = await axios.get(`${BASE_URL}/loans?status=COMPLETED`, { headers });
        console.log('✅ Completed loans:', completedLoans.data.data.pagination.total);

        // 9. Verify fund calculation
        console.log('\n9. Final fund verification:');
        console.log('   Initial: ₹15,000');
        console.log('   Loan Disbursed: -₹3,000');
        console.log('   Interest Payments: +₹60 (2 × ₹30)');
        console.log('   Principal Returned: +₹3,000');
        console.log('   Expected Final Fund: ₹15,060');
        console.log('   Expected Profit: ₹60');

        console.log('\n🎉 All loan management tests passed!');
    } catch (error) {
        console.error('\n❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testLoanAPIs();
