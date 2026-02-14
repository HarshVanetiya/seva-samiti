require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const username = 'hvanetiya';
    const password = 'qstn7954';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingOperator = await prisma.operator.findUnique({
        where: { username },
    });

    if (!existingOperator) {
        await prisma.operator.create({
            data: {
                username,
                password: hashedPassword,
            },
        });
        console.log(`Created admin user: ${username}`);
    } else {
        console.log(`Admin user: ${username} already exists`);
    }

    // Create initial organisation if not exists
    const existingOrg = await prisma.organisation.findFirst();
    if (!existingOrg) {
        await prisma.organisation.create({
            data: {
                name: 'Seva Smiti',
                amount: 0,
                profit: 0,
            },
        });
        console.log('Created initial organisation');
    } else {
        console.log('Organisation already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
