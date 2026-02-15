import { z } from 'zod';

// Member form validation
export const addMemberSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),
    fathersName: z.string()
        .min(2, "Father's name must be at least 2 characters")
        .max(100, "Father's name must be less than 100 characters"),
    mobile: z.string().optional(),
    membershipFee: z.number().min(0, 'Membership fee cannot be negative'),
    joiningDate: z.string().optional(),
    accountNumber: z.string().optional(),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;

// Loan disbursement validation
export const disburseLoanSchema = z.object({
    memberId: z.number().positive('Please select a member'),
    principalAmount: z.number().positive('Loan amount must be greater than 0'),
    interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
    scheme: z.enum(['NEW_SCHEME', 'OLD_SCHEME']),
    loanDate: z.string().optional(),
});

export type DisburseLoanFormData = z.infer<typeof disburseLoanSchema>;

// Loan payment validation
export const addPaymentSchema = z.object({
    interestPaid: z.number().min(0, 'Interest amount cannot be negative'),
    principalPaid: z.number().min(0, 'Principal amount cannot be negative'),
    paymentDate: z.string().optional(),
});

export type AddPaymentFormData = z.infer<typeof addPaymentSchema>;

// Donation validation
export const addDonationSchema = z.object({
    amount: z.number().positive('Donation amount must be greater than 0'),
    donorName: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional(),
});

export type AddDonationFormData = z.infer<typeof addDonationSchema>;

// Expense validation
export const addExpenseSchema = z.object({
    amount: z.number().positive('Expense amount must be greater than 0'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    date: z.string().optional(),
});

export type AddExpenseFormData = z.infer<typeof addExpenseSchema>;
