require('dotenv').config();
const { PrismaClient } = require('./generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

console.log('Attempting to create Prisma Client...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

try {
    // Create a PostgreSQL connection pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    // Create Prisma adapter for pg
    const adapter = new PrismaPg(pool);

    // Initialize Prisma Client with the adapter
    const prisma = new PrismaClient({ adapter });

    console.log('✅ Prisma Client created successfully!');
    console.log('Models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

    // Test database connection
    prisma.$connect().then(async () => {
        console.log('✅ Database connected!');

        // Try a simple query
        const orgs = await prisma.organisation.findMany();
        console.log('Organisations count:', orgs.length);

        await prisma.$disconnect();
        console.log('✅ Test completed successfully!');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Database error:', err);
        process.exit(1);
    });
} catch (error) {
    console.error('❌ Error creating Prisma Client:');
    console.error(error);
    process.exit(1);
}
