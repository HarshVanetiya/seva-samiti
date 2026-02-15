import api from './api';

export interface Loan {
    id: number;
    memberId: number;
    principalAmount: number;
    remainingBalance: number;
    interestRate: number;
    totalInterestPaid: number;
    loanDate: string;
    completedAt?: string;
    status: 'ACTIVE' | 'COMPLETED';
    scheme: 'NEW_SCHEME' | 'OLD_SCHEME';
    member?: {
        id: number;
        accountNumber: string;
        name: string;
        fathersName: string;
    };
    payments?: LoanPayment[];
    _count?: {
        payments: number;
    };
}

export interface LoanPayment {
    id: number;
    loanId: number;
    interestAmount: number;
    principalPaid: number;
    paymentDate: string;
}

export interface CreateLoanData {
    memberId: number;
    principalAmount: number;
    interestRate: number;
    loanDate?: string;
    scheme?: 'NEW_SCHEME' | 'OLD_SCHEME';
}

export interface AddPaymentData {
    interestPaid: number;
    principalPaid: number;
    paymentDate?: string;
}

export const loanService = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        status?: 'ACTIVE' | 'COMPLETED';
        memberId?: number;
        search?: string;
        pagination?: boolean;
    }) => {
        const response = await api.get('/loans', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/loans/${id}`);
        return response.data;
    },

    getOverdue: async (params?: { months?: number }) => {
        const response = await api.get('/loans/overdue', { params });
        return response.data;
    },

    create: async (data: CreateLoanData) => {
        const response = await api.post('/loans', data);
        return response.data;
    },

    addPayment: async (loanId: number, data: AddPaymentData) => {
        const response = await api.post(`/loans/${loanId}/payments`, data);
        return response.data;
    },
};
