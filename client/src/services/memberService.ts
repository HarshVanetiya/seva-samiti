import api from './api';

export interface Member {
    id: number;
    accountNumber: string;
    name: string;
    fathersName: string;
    mobile?: string;
    address?: string;
    isActive: boolean;
    joiningDate: string;
    createdAt: string;
    updatedAt: string;
    account?: {
        totalAmount: number;
        basicFee: number;
        developmentFee: number;
    };
    _count?: {
        loans: number;
    };
    loans?: any[]; // Ideally strict typed but any for now to avoid circular deps or complex types
    transactions?: any[];
}

export interface CreateMemberData {
    name: string;
    fathersName: string;
    mobile?: string;
    address?: string;
    membershipFee: number;
    basicFee?: number;
    developmentFee?: number;
    joiningDate?: string;
    accountNumber?: string;
}

export interface MembersResponse {
    success: boolean;
    data: {
        members: Member[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export const memberService = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    }) => {
        const response = await api.get<MembersResponse>('/members', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/members/${id}`);
        return response.data;
    },

    create: async (data: CreateMemberData) => {
        const response = await api.post('/members', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CreateMemberData>) => {
        const response = await api.put(`/members/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/members/${id}`);
        return response.data;
    },
};
