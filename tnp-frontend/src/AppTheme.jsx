import { ThemeProvider, createTheme } from "@mui/material/styles";
import PSLKittithada from "./assets/fonts/PSL Kittithada/PSLKittithada.woff2";
import PSLKittithadaBold from "./assets/fonts/PSL Kittithada/PSLKittithadaProBold.woff2";
import Kanit from "./assets/fonts/Kanit/Kanit-Regular.woff2";
import KanitLight from "./assets/fonts/Kanit/Kanit-Light.woff2";
import KanitSemiBold from "./assets/fonts/Kanit/Kanit-SemiBold.woff2";
import { red } from "@mui/material/colors";

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  palette: {
    primary: {
      main: "#1976d2", // Material Blue
      dark: "#115293",
      light: "#42a5f5",
    },
    secondary: {
      main: "#dc004e", // TNP Brand Red
      dark: "#9a0036",
      light: "#e63946",
    },
    success: {
      main: "#2e7d32", // Green
      dark: "#1b5e20",
      light: "#4caf50",
    },
    warning: {
      main: "#ed6c02", // Orange
      dark: "#e65100",
      light: "#ff9800",
    },
    error: {
      main: "#d32f2f", // Red
      dark: "#900F0F",
      light: "#E36264",
    },
    info: {
      main: "#0288d1", // Light Blue
      dark: "#01579b",
      light: "#03a9f4",
    },
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
      main: "#EBEBEB",
      dark: "#212429",
      light: "#d9d9d9",
      title: "rgba(102, 102, 102, 0.8)",
      outlinedInput: "rgba(235, 235, 235, 0.4)",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
    },
    // Status colors for documents
    status: {
      draft: "#2196f3", // Blue
      pending: "#ff9800", // Orange
      approved: "#4caf50", // Green
      rejected: "#f44336", // Red
      completed: "#4caf50", // Green
      overdue: "#d32f2f", // Dark Red
      cancelled: "#9e9e9e", // Grey
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'Kanit', sans-serif",
    h1: {
      fontFamily: "'KanitSemiBold', sans-serif",
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontFamily: "'KanitSemiBold', sans-serif",
      fontSize: 24,
      fontWeight: 600,
    },
    h3: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 20,
      fontWeight: 500,
    },
    h4: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 18,
      fontWeight: 500,
    },
    h5: {
      fontFamily: "'KanitLight', sans-serif",
      fontSize: 16,
    },
    h6: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 14,
      fontWeight: 500,
    },
    body1: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 16,
    },
    body2: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 14,
    },
    subtitle1: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 16,
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 14,
      fontWeight: 500,
    },
    caption: {
      fontFamily: "'Kanit', sans-serif",
      fontSize: 12,
    },
    button: {
      fontFamily: "'Kanit', sans-serif",
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'PSL Kittithada';
          src: url(${PSLKittithada}) format('woff2');
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'PSL KittithadaBold';
          src: url(${PSLKittithadaBold}) format('woff2');
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Kanit';
          src: url(${Kanit}) format('woff2');
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'KanitLight';
          src: url(${KanitLight}) format('woff2');
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'KanitSemiBold';
          src: url(${KanitSemiBold}) format('woff2');
          font-style: normal;
          font-display: swap;
        }
        
        /* Myanmar fonts */
        @font-face {
          font-family: 'Myanmar3';
          src: local('Myanmar3'), local('Myanmar Text'), local('Pyidaungsu'), local('Noto Sans Myanmar');
          font-display: swap;
        }
        
        /* Myanmar text styling */
        .myanmar-text {
          font-family: 'Myanmar3', 'Pyidaungsu', 'Myanmar Text', 'Noto Sans Myanmar', sans-serif !important;
          line-height: 1.6 !important;
          font-weight: 400 !important;
        }
      `,
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& fieldset": {
            borderColor: (theme.vars || theme).palette.grey[400],
          },
          "& .MuiOutlinedInput-root:not(.Mui-focused):hover fieldset": {
            borderColor: (theme.vars || theme).palette.grey[600],
          },
          "& .MuiOutlinedInput-root:.Mui-focused) fieldset": {
            borderWidth: "2px",
          },
          "& .MuiFormLabel-asterisk": {
            // เครื่องหมาย *
            color: (theme.vars || theme).palette.error.main,
          },
          "& .Mui-readOnly": {
            backgroundColor: (theme.vars || theme).palette.grey[100],
            borderRadius: theme.shape.borderRadius,
          },
          variants: [
            {
              props: { variant: "outlined", color: "primary" },
              style: {
                "& .MuiInputLabel-root.Mui-disabled": {
                  backgroundColor: "unset",
                  color: (theme.vars || theme).palette.text.secondary,
                },
                "& .Mui-disabled": {
                  backgroundColor: (theme.vars || theme).palette.grey[100],
                  borderRadius: theme.shape.borderRadius,
                  "& .MuiOutlinedInput-root:not(.Mui-focused):hover fieldset": {
                    borderColor: (theme.vars || theme).palette.error.main,
                  },
                  "& input": {
                    WebkitTextFillColor: (theme.vars || theme).palette.text
                      .secondary,
                    fontFamily: "'Kanit', sans-serif",
                  },
                },
              },
            },
          ],
        }),
      },
      defaultProps: {
        size: "small",
        fullWidth: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          fontFamily: "'Kanit', sans-serif",
          fontWeight: 500,
          borderRadius: 8,
          padding: "8px 16px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
          "&.MuiButton-sizeSmall": {
            padding: "4px 8px",
            fontSize: "0.875rem",
          },
          "&.MuiButton-sizeLarge": {
            padding: "12px 24px",
            fontSize: "1rem",
          },
        }),
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: ({ theme }) => ({
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
            "&:hover": {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
            },
          }),
        },
        {
          props: { variant: "contained", color: "secondary" },
          style: ({ theme }) => ({
            background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`,
          }),
        },
        {
          props: { variant: "outlined" },
          style: ({ theme }) => ({
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
              backgroundColor: `${theme.palette.primary.main}08`,
            },
          }),
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: `1px solid ${theme.palette.grey[200]}`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease-in-out",
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontFamily: "'Kanit', sans-serif",
          fontWeight: 500,
          borderRadius: 16,
        }),
      },
      variants: [
        {
          props: { variant: "status" },
          style: ({ theme }) => ({
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 24,
            "& .MuiChip-label": {
              padding: "0 8px",
            },
          }),
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: "none",
        }),
        elevation1: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
        elevation4: {
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          paddingRight: 5,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: { color: "error-light" },
              style: {
                "& button": {
                  width: 160,
                  height: 40,
                  boxShadow: "none",
                  borderRadius: theme.vars.shape.borderRadius,
                  border: `1px solid ${theme.vars.palette.error.light}`,
                  backgroundColor: theme.vars.palette.error.light,
                  color: "#fff",
                  fontFamily: "PSL KittithadaBold",
                  fontSize: 23,
                  letterSpacing: 0.8,
                  textTransform: "none",

                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: red[400],
                  },

                  "&.MuiToggleButtonGroup-grouped": {
                    borderRadius: theme.vars.shape.borderRadius,
                    border: `1px solid ${theme.vars.palette.error.light}`,
                    marginRight: 24,
                  },
                  
                  "&.Mui-selected": {
                    border: `1px solid ${theme.vars.palette.error.dark}`,
                    backgroundColor: theme.vars.palette.error.dark,
                  }
                },
              },
            },
          ],
        }),
      },
    },
    MuiFormGroup: {
      styleOverrides: {
        root: {
          "& .MuiFormGroup-row": {
            "& .MuiFormControlLabel-root": {
              marginRight: 22,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiDialogTitle-root": {
            color: theme.vars.palette.grey.title,
            fontSize: 26,
          },
          "& .MuiDialogContent-dividers": {
            borderBottom: "none",
          },
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
           "& .Mui-disabled": {
              backgroundColor: (theme.vars || theme).palette.grey[100],
              borderRadius: theme.shape.borderRadius,
            },
        }),
      },
    },
  },
});

export default function AppTheme({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
