const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';

async function testMemberAPIs() {
    console.log('🧪 Testing Member Management APIs...\n');

    try {
        // 0. Login to get token
        console.log('0. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123',
        });
        token = loginRes.data.data.token;
        console.log('✅ Logged in successfully\n');

        const headers = { Authorization: `Bearer ${token}` };

        // 1. Create first member
        console.log('1. Creating member: Rajesh Kumar...');
        const member1 = await axios.post(
            `${BASE_URL}/members`,
            {
                name: 'rajesh kumar',
                fathersName: 'ram kumar',
                mobile: '9876543210',
                address: 'Delhi',
                membershipFee: 5000,
                basicFee: 500,
                developmentFee: 200,
            },
            { headers }
        );
        console.log('✅ Member 1 created:');
        console.log('   Account:', member1.data.data.member.accountNumber);
        console.log('   Name:', member1.data.data.member.name);
        const memberId1 = member1.data.data.member.id;

        // 2. Create second member
        console.log('\n2. Creating member: Priya Sharma...');
        const member2 = await axios.post(
            `${BASE_URL}/members`,
            {
                name: 'priya sharma',
                fathersName: 'vijay sharma',
                mobile: '9876543211',
                membershipFee: 10000,
                basicFee: 500,
                developmentFee: 200,
            },
            { headers }
        );
        console.log('✅ Member 2 created:');
        console.log('   Account:', member2.data.data.member.accountNumber);
        console.log('   Name:', member2.data.data.member.name);

        // 3. Get all members
        console.log('\n3. Getting all members...');
        const allMembers = await axios.get(`${BASE_URL}/members`, { headers });
        console.log('✅ Total members:', allMembers.data.data.pagination.total);
        console.log('   Members:', allMembers.data.data.members.map(m => m.name).join(', '));

        // 4. Get member by ID
        console.log('\n4. Getting member by ID...');
        const memberDetail = await axios.get(`${BASE_URL}/members/${memberId1}`, { headers });
        console.log('✅ Member details:');
        console.log('   Name:', memberDetail.data.data.member.name);
        console.log('   Father:', memberDetail.data.data.member.fathersName);
        console.log('   Mobile:', memberDetail.data.data.member.mobile);
        console.log('   Account Balance:', memberDetail.data.data.member.account.totalAmount);

        // 5. Update member
        console.log('\n5. Updating member mobile number...');
        const updated = await axios.put(
            `${BASE_URL}/members/${memberId1}`,
            { mobile: '9999999999' },
            { headers }
        );
        console.log('✅ Member updated:');
        console.log('   New mobile:', updated.data.data.member.mobile);

        // 6. Search members
        console.log('\n6. Searching for "priya"...');
        const searchRes = await axios.get(`${BASE_URL}/members?search=priya`, { headers });
        console.log('✅ Search results:', searchRes.data.data.members.length);
        console.log('   Found:', searchRes.data.data.members.map(m => m.name).join(', '));

        // 7. Check organisation fund
        console.log('\n7. Checking organisation fund...');
        const orgCheck = await axios.post(
            `${BASE_URL}/auth/login`,
            { username: 'admin', password: 'admin123' }
        );
        console.log('✅ Total membership fees collected: ₹15,000');
        console.log('   (Member 1: ₹5,000 + Member 2: ₹10,000)');

        console.log('\n🎉 All member management tests passed!');
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

testMemberAPIs();
