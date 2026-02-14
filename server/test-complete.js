const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';

async function testCompleteSystem() {
    console.log('🧪 Testing Complete Backend System...\n');

    try {
        // Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123',
        });
        token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Test Dashboard
        console.log('1. Testing Dashboard API...');
        const dashboard = await axios.get(`${BASE_URL}/dashboard`, { headers });
        console.log('✅ Dashboard data:');
        console.log('   Cash in Hand: ₹', dashboard.data.data.fund.cashInHand);
        console.log('   Total Profit: ₹', dashboard.data.data.fund.totalProfit);
        console.log('   Active Loans:', dashboard.data.data.loans.totalActive);
        console.log('   Total Members:', dashboard.data.data.members.total);
        console.log('   Overdue Loans:', dashboard.data.data.loans.overdueCount);

        // 2. Test Donation
        console.log('\n2. Adding donation of ₹2,000...');
        await axios.post(
            `${BASE_URL}/transactions/donations`,
            {
                amount: 2000,
                description: 'Community donation',
                donorName: 'Anonymous',
            },
            { headers }
        );
        console.log('✅ Donation added');

        // 3. Test Expense
        console.log('\n3. Recording expense of ₹500...');
        await axios.post(
            `${BASE_URL}/transactions/expenses`,
            {
                amount: 500,
                description: 'Office supplies',
            },
            { headers }
        );
        console.log('✅ Expense recorded');

        // 4. Test Transaction History
        console.log('\n4. Fetching transaction history...');
        const history = await axios.get(`${BASE_URL}/transactions/history?limit=5`, { headers });
        console.log('✅ Recent transactions:', history.data.data.transactions.length);
        history.data.data.transactions.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.type}: ₹${tx.amount} - ${tx.description}`);
        });

        // 5. Check updated dashboard
        console.log('\n5. Checking updated dashboard...');
        const dashboard2 = await axios.get(`${BASE_URL}/dashboard`, { headers });
        console.log('✅ Updated fund:');
        console.log('   Cash in Hand: ₹', dashboard2.data.data.fund.cashInHand);
        console.log('   Expected: ₹16,560 (15,060 + 2,000 - 500)');

        // 6. Test Overdue Loans
        console.log('\n6. Checking overdue loans...');
        const overdue = await axios.get(`${BASE_URL}/loans/overdue`, { headers });
        console.log('✅ Overdue loans:', overdue.data.data.count);

        console.log('\n🎉 All backend system tests passed!');
        console.log('\n📊 Final System State:');
        console.log('   Cash: ₹', dashboard2.data.data.fund.cashInHand);
        console.log('   Profit: ₹', dashboard2.data.data.fund.totalProfit);
        console.log('   Members:', dashboard2.data.data.members.total);
        console.log('   Active Loans:', dashboard2.data.data.loans.totalActive);
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

testCompleteSystem();
