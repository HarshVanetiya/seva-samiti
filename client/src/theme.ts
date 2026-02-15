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
            main: '#6366f1', // Indigo 500
            light: '#818cf8',
            dark: '#4f46e5',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#f43f5e', // Rose 500
            light: '#fb7185',
            dark: '#e11d48',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef4444',
            light: '#fee2e2',
        },
        success: {
            main: '#10b981', // Emerald 500
            light: '#d1fae5',
        },
        warning: {
            main: '#f59e0b', // Amber 500
            light: '#fef3c7',
        },
        background: {
            default: '#f8fafc', // Slate 50
            paper: '#ffffff',
        },
        text: {
            primary: '#0f172a', // Slate 900
            secondary: '#64748b', // Slate 500
        },
        neutral: {
            main: '#64748b',
            contrastText: '#fff',
        },
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.025em' },
        h2: { fontWeight: 700, letterSpacing: '-0.025em' },
        h3: { fontWeight: 600, letterSpacing: '-0.025em' },
        h4: { fontWeight: 600, fontSize: '1.75rem', letterSpacing: '-0.025em' },
        h5: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        body1: { fontSize: '0.95rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem' },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', // Colored shadow
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    },
                },
                outlined: {
                    borderWidth: '1.5px',
                    '&:hover': {
                        borderWidth: '1.5px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 24,
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderRadius: 20,
                },
                elevation1: {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#f8fafc',
                        transition: 'all 0.2s',
                        '& fieldset': {
                            borderColor: '#e2e8f0',
                        },
                        '&:hover fieldset': {
                            borderColor: '#cbd5e1',
                        },
                        '&.Mui-focused': {
                            backgroundColor: '#ffffff',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        }
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                },
                body: {
                    borderBottom: '1px solid #f1f5f9',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        backgroundColor: '#f8fafc !important',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 500,
                },
                filled: {
                    backgroundColor: '#f1f5f9',
                }
            }
        }
    },
});
