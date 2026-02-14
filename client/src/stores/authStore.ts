import { create } from 'zustand';
import { authService } from '../services/authService';

interface Operator {
    id: number;
    username: string;
    createdAt: string;
}

interface AuthState {
    operator: Operator | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    operator: authService.getCurrentOperator(),
    isAuthenticated: authService.isAuthenticated(),

    login: async (username: string, password: string) => {
        const response = await authService.login({ username, password });
        set({
            operator: response.data.operator,
            isAuthenticated: true,
        });
    },

    logout: () => {
        authService.logout();
        set({
            operator: null,
            isAuthenticated: false,
        });
    },

    checkAuth: () => {
        const operator = authService.getCurrentOperator();
        const isAuthenticated = authService.isAuthenticated();
        set({ operator, isAuthenticated });
    },
}));
