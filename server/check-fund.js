require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function checkOrganisationFund() {
    try {
        const org = await prisma.organisation.findFirst();

        if (org) {
            console.log('📊 Organisation Fund Status:');
            console.log('   Name:', org.name);
            console.log('   Cash in Hand: ₹', org.amount.toFixed(2));
            console.log('   Total Profit: ₹', org.profit.toFixed(2));
            console.log('   Last Updated:', org.updatedAt);
        } else {
            console.log('No organisation record found');
        }

        const transactions = await prisma.transactionLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                member: true,
            },
        });

        console.log('\n📝 Transaction History:');
        transactions.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.type}: ₹${tx.amount} - ${tx.description}`);
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
    }
}

checkOrganisationFund();
