import { createTheme } from '@mui/material/styles';

// Paleta de colores inspirada en Jira - profesional y limpia
export const theme = createTheme({
  palette: {
    primary: {
      main: '#0052CC', // Azul profesional
      light: '#4C9AFF',
      dark: '#0747A6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00875A', // Verde para acciones positivas
      light: '#36B37E',
      dark: '#006644',
      contrastText: '#fff',
    },
    error: {
      main: '#DE350B',
      light: '#FF5630',
      dark: '#BF2600',
    },
    warning: {
      main: '#FF8B00',
      light: '#FFAB00',
      dark: '#FF991F',
    },
    info: {
      main: '#0065FF',
      light: '#2684FF',
      dark: '#0052CC',
    },
    success: {
      main: '#00875A',
      light: '#36B37E',
      dark: '#006644',
    },
    background: {
      default: '#F4F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#172B4D',
      secondary: '#5E6C84',
      disabled: '#A5ADBA',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
          borderRadius: 8,
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});
