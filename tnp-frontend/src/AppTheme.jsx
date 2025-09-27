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
    error: {
      main: "#B20000",
      dark: "#900F0F",
      light: "#E36264",
    },
    grey: {
      main: "#EBEBEB",
      dark: "#212429",
      light: "#d9d9d9",
      title: "rgba(102, 102, 102, 0.8)",
      outlinedInput: "rgba(235, 235, 235, 0.4)",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'Kanit', sans-serif",
    h5: {
      fontFamily: "'KanitLight', sans-serif",
      fontSize: 20,
    },

    body1: {
      fontFamily: "'KanitLight', sans-serif",
    },
    subtitle1: {
      fontSize: 16,
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
                    WebkitTextFillColor: (theme.vars || theme).palette.text.secondary,
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
          "& .MuiButton-icon": {
            marginRight: 2,
          },
          variants: [
            {
              props: { variant: "contained", color: "grey" },
              style: {
                backgroundColor: theme.vars.palette.grey[200],
                color: theme.vars.palette.grey[700],
                border: `1px solid ${theme.vars.palette.grey[400]}`,
                boxShadow: "none",
                borderRadius: 6,
                padding: 4,
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: theme.vars.palette.grey[300],
                },
                "&.Mui-disabled": {
                  backgroundColor: theme.vars.palette.grey[50],
                  color: theme.vars.palette.grey[400],
                  border: `1px solid ${theme.vars.palette.grey[300]}`,
                },
              },
            },
            {
              props: { variant: "contained", color: "error" },
              style: {
                backgroundColor: theme.vars.palette.error.main,
                border: `1px solid ${(theme.vars || theme).palette.error.main}`,
                boxShadow: "none",
                borderRadius: 6,
                padding: 4,
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: red[800],
                },

                "&.Mui-disabled": {
                  border: `1px solid ${theme.vars.palette.grey[300]}`,
                },
              },
            },
            {
              props: { variant: "contained", color: "error-light" },
              style: {
                backgroundColor: theme.vars.palette.error.light,
                border: `1px solid ${(theme.vars || theme).palette.error.light}`,
                color: "#fff",
                boxShadow: "none",
                borderRadius: theme.vars.shape.borderRadius,
                width: 140,
                height: 40,
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: red[500],
                },
              },
            },
            {
              props: { variant: "outlined", color: "error" },
              style: {
                boxShadow: "none",
                borderRadius: 6,
                padding: 4,
              },
            },
            {
              props: { variant: "icon-contained", color: "grey" },
              style: {
                backgroundColor: theme.vars.palette.grey[200],
                color: theme.vars.palette.grey[700],
                border: `1px solid ${theme.vars.palette.grey[200]}`,
                boxShadow: "none",
                borderRadius: theme.vars.shape.borderRadius,
                minWidth: 40,
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: theme.vars.palette.grey[300],
                },
                "&.Mui-disabled": {
                  backgroundColor: theme.vars.palette.grey[50],
                  color: theme.vars.palette.grey[400],
                  border: `1px solid ${theme.vars.palette.grey[300]}`,
                },
                "& svg": {
                  color: theme.vars.palette.grey.dark,
                },
              },
            },
          ],
        }),
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
                  },
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
