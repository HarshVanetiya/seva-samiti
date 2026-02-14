# Community Fund Management System

## Goal
A system to manage a society fund where members donate, take loans, pay interest monthly, and the organization tracks fund growth.

---

## Core Concepts

### Fund
All money is stored in one fund. Loans and expenses reduce it, interest increases it.

---

## Features

### 1. Donations
Add money to fund with description.

### 2. Membership
- Create member
- Membership fee added to fund

### 3. Loans
- Only members
- Principal paid once
- Monthly interest payments
- Loan can run long term
- Track all installments
- Highlight if no interest paid in 6 months

### 4. Expenses
- Withdraw from fund
- Add reason

### 5. Dashboard
- Cash in hand
- Total loans active
- Overdue members

---

## Business Rules

- Interest = (principal × interest_rate × months)
- Loan closes only after principal paid
- Interest payments add to fund
- Highlight inactive payers
