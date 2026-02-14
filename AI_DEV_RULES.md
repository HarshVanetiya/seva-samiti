You are building a full stack financial management system.

Rules:
- Use clean architecture
- Use controllers/services pattern
- Never mix business logic in routes
- Use Prisma ORM
- Validate all inputs
- Use JWT auth
- Keep transactions atomic
- Use reusable React components
- Use Zustand for state
- Use React Hook Form
- Follow REST naming
- Always calculate cash from transactions, never store static cash
- maintain a todo list and divide task into phases and complete one phase at a time
- Use migration dev instead of db push for prisma
- **CRITICAL**: Organisation.amount and profit are cached for performance but MUST be updated using Prisma transactions to prevent inconsistencies

## How to Update Organisation.amount and profit:

ALWAYS use Prisma.$transaction() when updating cash/profit:

```javascript
await prisma.$transaction([
  // 1. Create transaction log
  prisma.transactionLog.create({ ... }),
  
  // 2. Update organisation atomically
  prisma.organisation.update({
    where: { id: 1 },
    data: { 
      amount: { increment: amountChange },
      profit: { increment: profitChange }
    }
  })
]);
```

Cash in Hand = 
  + All DONATION transactions
  + All MEMBERSHIP transactions  
  + All LOAN_PAYMENT transactions (interest + principal)
  - All LOAN_DISBURSEMENT transactions
  - All EXPENSE/WITHDRAWAL transactions
  - All RELEASED_MONEY transactions