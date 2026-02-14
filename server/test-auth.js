const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
    console.log('🧪 Testing Authentication APIs...\n');

    try {
        // 1. Register operator
        console.log('1. Registering operator...');
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            username: 'admin',
            password: 'admin123',
        });
        console.log('✅ Register successful!');
        console.log('Response:', JSON.stringify(registerRes.data, null, 2));

        const token = registerRes.data.data.token;
        console.log('\n📌 Token:', token.substring(0, 50) + '...\n');

        // 2. Login
        console.log('2. Testing login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123',
        });
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(loginRes.data, null, 2));

        // 3. Get current operator
        console.log('\n3. Getting current operator info...');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log('✅ Got operator info!');
        console.log('Response:', JSON.stringify(meRes.data, null, 2));

        console.log('\n🎉 All authentication tests passed!');
    } catch (error) {
        console.error('❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAuth();
