import api from './api';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        operator: {
            id: number;
            username: string;
            createdAt: string;
        };
        token: string;
    };
}

export const authService = {
    login: async (credentials: LoginCredentials) => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('operator', JSON.stringify(response.data.data.operator));
        }
        return response.data;
    },

    register: async (data: RegisterData) => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('operator', JSON.stringify(response.data.data.operator));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('operator');
        window.location.href = '/login';
    },

    getCurrentOperator: () => {
        const operator = localStorage.getItem('operator');
        return operator ? JSON.parse(operator) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};
