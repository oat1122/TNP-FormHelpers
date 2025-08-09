import { createTheme } from '@mui/material/styles';
import tokens from './tokens';

export const quotationTheme = createTheme({
  palette: {
    primary: { main: tokens.primary, dark: tokens.primaryDark },
    background: { default: tokens.bg, paper: tokens.white },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 },
      },
      variants: [
        {
          props: { variant: 'primary' },
          style: {
            background: tokens.primary,
            color: tokens.white,
            '&:hover': { background: tokens.primaryDark },
          },
        },
        {
          props: { variant: 'secondary' },
          style: {
            border: `1px solid ${tokens.primary}`,
            color: tokens.primary,
            '&:hover': {
              background: '#fff5f5',
              borderColor: tokens.primaryDark,
              color: tokens.primaryDark,
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: { border: `1px solid ${tokens.border}` },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
});

export default quotationTheme;
