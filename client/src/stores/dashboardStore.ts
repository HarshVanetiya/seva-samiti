import { create } from 'zustand';
import type { DashboardData } from '../services/dashboardService';
import { dashboardService } from '../services/dashboardService';

interface DashboardState {
    data: DashboardData['data'] | null;
    loading: boolean;
    error: string | null;
    fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    data: null,
    loading: false,
    error: null,

    fetchDashboard: async () => {
        set({ loading: true, error: null });
        try {
            const response = await dashboardService.getDashboard();
            set({ data: response.data, loading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch dashboard data',
                loading: false,
            });
        }
    },
}));
