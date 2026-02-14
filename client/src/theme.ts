import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        neutral: Palette['primary'];
    }
    interface PaletteOptions {
        neutral?: PaletteOptions['primary'];
    }
}

export const theme = createTheme({
    palette: {
        primary: {
            main: '#0B3C5D', // Deep Trust Blue
            light: '#1F5F8B',
            dark: '#072A40',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#EF6C00', // Warning/Pending Orange
            contrastText: '#ffffff',
        },
        error: {
            main: '#C62828', // Danger Red
            light: '#FFEBEE',
        },
        success: {
            main: '#2E7D32', // Success Green
            light: '#E8F5E9',
        },
        background: {
            default: '#F5F7FA', // Neutral Background
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1C1C1C',
            secondary: '#616161',
        },
        neutral: {
            main: '#64748B',
            contrastText: '#fff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600, fontSize: '24px' }, // Page Title
        h5: { fontWeight: 600, fontSize: '22px' }, // Card Numbers
        h6: { fontWeight: 600, fontSize: '18px' }, // Section Title
        body1: { fontSize: '14px' }, // Table Text
        body2: { fontSize: '13px' }, // Labels
        button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#0B3C5D',
                    '&:hover': {
                        backgroundColor: '#072A40',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Soft shadow
                    padding: '16px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: '#F0F2F5',
                    fontWeight: 600,
                    color: '#1C1C1C',
                },
                body: {
                    padding: '12px 16px',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:nth-of-type(even)': {
                        backgroundColor: '#FAFAFA', // Zebra stripes (very subtle)
                    },
                    '&:hover': {
                        backgroundColor: '#F5F7FA !important', // Hover highlight
                    },
                },
            },
        },
    },
});
