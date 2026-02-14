require('dotenv').config();

async function main() {
    try {
        console.log("Starting analysis...");
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is missing from environment variables");
        }
        console.log("DATABASE_URL found.");

        const prisma = require('./utils/prisma');
        console.log("Prisma client loaded.");

        const months = 3;
        const monthsThreshold = parseInt(months);
        const thresholdDate = new Date();
        thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold);

        console.log(`Checking for loans overdue > ${months} months`);
        console.log(`Threshold Date: ${thresholdDate.toISOString()}`);

        const activeLoans = await prisma.loan.findMany({
            where: { status: 'ACTIVE' },
            include: {
                member: { select: { name: true, accountNumber: true } },
                payments: { orderBy: { paymentDate: 'desc' }, take: 1 }
            }
        });

        console.log(`Found ${activeLoans.length} active loans.`);

        activeLoans.forEach(loan => {
            let lastActivityDate;
            let isOverdue = false;
            let reason = "";

            if (loan.payments.length === 0) {
                lastActivityDate = new Date(loan.loanDate);
                reason = "No payments";
            } else {
                lastActivityDate = new Date(loan.payments[0].paymentDate);
                reason = "Last payment";
            }

            isOverdue = lastActivityDate < thresholdDate;

            const diffTime = Math.abs(thresholdDate - lastActivityDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            console.log(`Loan ID: ${loan.id} (Member: ${loan.member.name})`);
            console.log(`  Last Activity: ${lastActivityDate.toISOString()} (${reason})`);
            console.log(`  Is Overdue? ${isOverdue}`);
            console.log(`  Loan Date: ${new Date(loan.loanDate).toISOString()}`);
            if (!isOverdue) {
                console.log(`  Not overdue because ${lastActivityDate.toISOString()} >= ${thresholdDate.toISOString()}`);
            }
            console.log('---');
        });

        await prisma.$disconnect();

    } catch (e) {
        console.error("Script failed:", e);
    }
}

main();
