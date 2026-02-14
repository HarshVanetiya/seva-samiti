We are designing a financial management web app for a community fund/loan organization.

Design style should be:
- Professional, trustworthy, clean
- Banking / fintech inspired
- Calm colors (primary: deep blue or teal, success: green, danger: red)
- Clear typography, high readability
- Cards, tables, and subtle shadows
- No playful or flashy UI

Layout Rules:
- Top AppBar with app name and user menu
- Left Sidebar navigation
- Content area with page title + action buttons
- Use cards for statistics
- Tables must be striped, sortable, and responsive
- All money values right-aligned

Components Style:
- Buttons: Rounded, medium size, primary filled
- Inputs: Outlined
- Modals: Centered, max-width medium, sectioned forms
- Status badges:
  - Active = green
  - Completed = gray
  - Overdue = red
  - Pending = orange

Now design each page as described below.


Design a secure financial login page.

Layout:
- Centered login card
- Organization logo at top
- Title: "Community Fund Management System"
- Subtitle: "Authorized Access Only"

Fields:
- Username
- Password

UI:
- Minimal distractions
- Lock icon visual
- Soft background gradient (light gray to white)
- "Login" primary button full width
- Show error alerts clearly


Design a financial dashboard.

Top Section (Stats Cards):
- Total Cash in Hand
- Active Loans Amount
- Total Members
- Monthly Interest Collected

Each card:
- Icon on left
- Big number
- Small label
- Subtle background tint

Middle Section:
- Line chart: Monthly Fund Growth

Bottom Section:
- Recent Transactions table
- Columns: Date | Type | Member | Amount | Status
- Credit = green
- Debit = red


Design a member management page.

Header:
- Title: "Members"
- Button: "Add Member"

Main:
- Search bar top right
- Table:

Columns:
Account No | Member Name | Joined Date | Active Loans | Total Contribution | Status | Action

Action:
- "View" button

Row color:
- Highlight red if member inactive > 6 months


Design loan management.

Top:
Tabs:
- Active Loans
- Completed Loans

Right side buttons:
- Disburse Loan
- Add Payment

Table Columns:
Loan ID | Member | Principal | Interest Rate | Total Interest Paid | Start Date | Status | Action

Status badges:
- Active (green)
- Closed (gray)
- Overdue (red)

Important:
Monetary columns right aligned.


Design a financial ledger page.

Top Buttons:
- Add Donation
- Add Expense

Filters:
- Date range
- Type dropdown

Table:
Date | Type | Member | Description | Credit | Debit

Rules:
- Donations & Interest = Credit (green)
- Loan Given & Expense = Debit (red)


Design a profile page.

Top Card:
- Member Name
- Join Date
- Total Contributed
- Active Loans

Sections:
1. Loans Table
2. Transaction History
3. Last Payment Date
4. Overdue Indicator


Design detailed loan view.

Top Card:
- Principal
- Interest Rate
- Start Date
- Total Interest Paid
- Remaining Principal

Below:
Payment History Timeline (chronological)


Design system configuration page.

Sections in cards:
- Membership Fee
- Default Interest Rate
- Organization Info
- Backup Data button


Design analytics dashboard.

Cards:
- Monthly Collection
- Total Profit
- Defaulters Count

Charts:
- Bar chart monthly
- Pie chart loan distribution


Design security logs page.

Table:
Date | Operator | Action | Affected Record | Details

Read-only
Muted color theme


All modals:
- Title at top
- Dividers between sections
- Primary action button bottom right
- Cancel secondary
- Financial summary section at bottom if needed
