import api from './api';

export const reportService = {
    getOrganisationReport: async () => {
        const response = await api.get('/reports/organisation', {
            responseType: 'blob', // Important for file download
        });
        return response.data;
    },

    getMemberReport: async () => {
        const response = await api.get('/reports/members', {
            responseType: 'blob',
        });
        return response.data;
    },

    getDatabaseBackup: async () => {
        const response = await api.get('/reports/backup', {
            responseType: 'blob',
        });
        return response.data;
    },
};
