import api from './api';

export interface DashboardData {
    success: boolean;
    data: {
        fund: {
            cashInHand: number;
            totalProfit: number;
        };
        loans: {
            totalActive: number;
            totalActiveAmount: number;
            overdueCount: number;
            overdueMembers: Array<{
                loanId: number;
                memberName: string;
                principalAmount: number;
                remainingBalance: number;
                lastPaymentDate: string | null;
            }>;
        };
        members: {
            total: number;
        };
        recentTransactions: Array<{
            id: number;
            type: string;
            amount: number;
            description: string;
            createdAt: string;
            member?: {
                id: number;
                name: string;
            };
        }>;
    };
}

export interface AddDonationData {
    amount: number;
    description?: string;
    donorName?: string;
    date?: string;
}

export interface AddExpenseData {
    amount: number;
    description: string;
    date?: string;
}

export const dashboardService = {
    getDashboard: async () => {
        const response = await api.get<DashboardData>('/dashboard');
        return response.data;
    },

    addDonation: async (data: AddDonationData) => {
        const response = await api.post('/transactions/donations', data);
        return response.data;
    },

    addExpense: async (data: AddExpenseData) => {
        const response = await api.post('/transactions/expenses', data);
        return response.data;
    },

    getTransactionHistory: async (params?: {
        page?: number;
        limit?: number;
        type?: string;
        memberId?: number;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get('/transactions/history', { params });
        return response.data;
    },

    revertTransaction: async (id: number) => {
        const response = await api.post(`/transactions/${id}/revert`);
        return response.data;
    },
};
