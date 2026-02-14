const { PrismaClient } = require('../../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter for pg
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter (Prisma 7 requirement)
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
