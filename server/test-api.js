/**
 * API Test Script for Seva Smiti Community Fund Management System
 * Run with: node test-api.js
 */

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🧪 Starting API Tests...\n');
    let token = null;
    let memberId = null;
    let loanId = null;

    // Track test results
    const results = { passed: 0, failed: 0 };

    function log(passed, testName, details = '') {
        if (passed) {
            console.log(`✅ ${testName}`);
            results.passed++;
        } else {
            console.log(`❌ ${testName}: ${details}`);
            results.failed++;
        }
    }

    try {
        // ========== AUTH TESTS ==========
        console.log('\n--- AUTH TESTS ---');

        // Test 1: Login with correct credentials
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        log(loginRes.ok && loginData.data?.token, 'Login with correct credentials');
        token = loginData.data?.token;

        // Test 2: Login with wrong credentials
        const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
        });
        log(badLoginRes.status === 401, 'Login rejected with wrong password');

        // Test 3: Access protected route without token
        const noAuthRes = await fetch(`${BASE_URL}/members`);
        log(noAuthRes.status === 401, 'Protected route rejects unauthenticated request');

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // ========== MEMBER TESTS ==========
        console.log('\n--- MEMBER TESTS ---');

        // Test 4: Get all members
        const membersRes = await fetch(`${BASE_URL}/members`, { headers: authHeaders });
        const membersData = await membersRes.json();
        log(membersRes.ok && Array.isArray(membersData.data?.members), 'Get all members');

        // Test 5: Create a new member
        const newMember = {
            name: 'TEST MEMBER',
            fathersName: 'TEST FATHER',
            mobile: '9876543210',
            membershipFee: 500
        };
        const createMemberRes = await fetch(`${BASE_URL}/members`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(newMember)
        });
        const createMemberData = await createMemberRes.json();
        log(createMemberRes.ok && createMemberData.data?.member?.id, 'Create new member', JSON.stringify(createMemberData));
        memberId = createMemberData.data?.member?.id;

        // Test 6: Get member by ID
        if (memberId) {
            const memberRes = await fetch(`${BASE_URL}/members/${memberId}`, { headers: authHeaders });
            const memberData = await memberRes.json();
            log(memberRes.ok && memberData.data?.member?.name === 'TEST MEMBER', 'Get member by ID', JSON.stringify(memberData));
        }

        // ========== LOAN TESTS ==========
        console.log('\n--- LOAN TESTS ---');

        // Test 7: Get all loans
        const loansRes = await fetch(`${BASE_URL}/loans`, { headers: authHeaders });
        const loansData = await loansRes.json();
        log(loansRes.ok && Array.isArray(loansData.data?.loans), 'Get all loans', JSON.stringify(loansData));

        // Setup: Add funds to organisation so loan can be disbursed
        const fundRes = await fetch(`${BASE_URL}/transactions/donations`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ amount: 50000, donorName: 'Seed Funder', description: 'Initial Capital' })
        });
        log(fundRes.ok, 'Add funds for loan disbursement');

        // Test 8: Create a loan for the test member
        if (memberId) {
            const newLoan = {
                memberId: memberId,
                principalAmount: 10000,
                interestRate: 2,
                scheme: 'NEW_SCHEME'
            };
            const createLoanRes = await fetch(`${BASE_URL}/loans`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(newLoan)
            });
            const createLoanData = await createLoanRes.json();
            log(createLoanRes.ok && createLoanData.data?.loan?.id, 'Create new loan', JSON.stringify(createLoanData));
            loanId = createLoanData.data?.loan?.id;
        }

        // Test 9: Get loan by ID
        if (loanId) {
            const loanRes = await fetch(`${BASE_URL}/loans/${loanId}`, { headers: authHeaders });
            const loanData = await loanRes.json();
            log(loanRes.ok && loanData.data?.loan?.principalAmount === 10000, 'Get loan by ID', JSON.stringify(loanData));
        }

        // Test 10: Add loan payment
        if (loanId) {
            const payment = {
                interestPaid: 200,
                principalPaid: 1000
            };
            const paymentRes = await fetch(`${BASE_URL}/loans/${loanId}/payments`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(payment)
            });
            log(paymentRes.ok, 'Add loan payment');
        }

        // ========== DASHBOARD TESTS ==========
        console.log('\n--- DASHBOARD TESTS ---');

        // Test 11: Get dashboard overview
        const dashboardRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
        const dashboardData = await dashboardRes.json();
        log(dashboardRes.ok && dashboardData.data?.fund !== undefined, 'Get dashboard overview', JSON.stringify(dashboardData));

        // Test 12: Get transaction history
        const txRes = await fetch(`${BASE_URL}/transactions/history`, { headers: authHeaders });
        const txData = await txRes.json();
        log(txRes.ok && Array.isArray(txData.data?.transactions), 'Get transaction history', JSON.stringify(txData));

        // Test 13: Add donation
        const donationRes = await fetch(`${BASE_URL}/transactions/donations`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ amount: 1000, donorName: 'Test Donor' })
        });
        const donationData = await donationRes.json();
        log(donationRes.ok, 'Add donation', JSON.stringify(donationData));

        // Test 14: Add expense
        const expenseRes = await fetch(`${BASE_URL}/transactions/expenses`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ amount: 500, description: 'Test expense' })
        });
        const expenseData = await expenseRes.json();
        log(expenseRes.ok, 'Add expense', JSON.stringify(expenseData));

        // ========== BUSINESS LOGIC TESTS ==========
        console.log('\n--- BUSINESS LOGIC TESTS ---');

        // Test 15: Verify cash in hand calculation
        const finalDashRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
        const finalDashData = await finalDashRes.json();
        log(
            finalDashData.data?.fund?.cashInHand !== undefined,
            'Cash in hand is calculated',
            `Value: ₹${finalDashData.data?.fund?.cashInHand}`
        );

        // Test 16: Verify profit tracking
        log(
            finalDashData.data?.fund?.totalProfit !== undefined,
            'Total profit is tracked',
            `Value: ₹${finalDashData.data?.fund?.totalProfit}`
        );

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        results.failed++;
    }

    // ========== SUMMARY ==========
    console.log('\n========================================');
    console.log(`📊 TEST RESULTS: ${results.passed} passed, ${results.failed} failed`);
    console.log('========================================\n');

    return results;
}

testAPI().catch(console.error);
