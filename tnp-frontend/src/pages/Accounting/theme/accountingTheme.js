import { createTheme } from '@mui/material/styles';

// TNP Accounting Theme สำหรับ frontend ที่สวยงาม
export const accountingTheme = createTheme({
    palette: {
        primary: {
            main: '#900F0F',      // แดงเข้มที่สุด - Header, Navigation, ปุ่มสำคัญ
            dark: '#7A0D0D',      // แดงเข้มกว่า สำหรับ hover
            light: '#A31515',     // แดงอ่อนกว่า สำหรับ disabled
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#B20000',      // แดงกลาง - ปุ่มรอง, เส้นขอบ, ไอคอนสำคัญ
            dark: '#8B0000',      // สำหรับ hover
            light: '#CC1A1A',     // สำหรับ disabled
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#E36264',      // แดงอ่อน - สำหรับ error states
            dark: '#B20000',
            light: '#F5A5A7',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
        },
        success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
        },
        info: {
            main: '#2196F3',
            light: '#64B5F6',
            dark: '#1976D2',
        },
        background: {
            default: '#FFFFFF',    // พื้นหลังหลัก
            paper: '#FFFFFF',      // พื้นหลัง card, modal
            light: '#FAFAFA',      // พื้นหลังอ่อน
            accent: '#E36264',     // พื้นหลัง section เน้นเบาๆ (แดงอ่อนมาก)
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
            disabled: '#BDBDBD',
            hint: '#9E9E9E',
        },
        divider: '#E0E0E0',
        grey: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
    },

    shape: {
        borderRadius: 12, // ความโค้งมน สำหรับ cards และ buttons
    },

    typography: {
        fontFamily: '"Kanit", "Roboto", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            color: '#900F0F',
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            color: '#900F0F',
            lineHeight: 1.3,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
            color: '#900F0F',
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            color: '#212121',
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#212121',
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            color: '#212121',
            lineHeight: 1.5,
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 400,
            color: '#757575',
            lineHeight: 1.5,
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 400,
            color: '#757575',
            lineHeight: 1.57,
        },
        body1: {
            fontSize: '1rem',
            fontWeight: 400,
            color: '#212121',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            fontWeight: 400,
            color: '#212121',
            lineHeight: 1.43,
        },
        button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none', // ไม่ใช้ตัวพิมพ์ใหญ่อัตโนมัติ
        },
        caption: {
            fontSize: '0.75rem',
            fontWeight: 400,
            color: '#757575',
            lineHeight: 1.66,
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.08333em',
            color: '#757575',
        },
    },

    shadows: [
        'none',
        '0px 2px 1px -1px rgba(144, 15, 15, 0.2), 0px 1px 1px 0px rgba(144, 15, 15, 0.14), 0px 1px 3px 0px rgba(144, 15, 15, 0.12)',
        '0px 3px 1px -2px rgba(144, 15, 15, 0.2), 0px 2px 2px 0px rgba(144, 15, 15, 0.14), 0px 1px 5px 0px rgba(144, 15, 15, 0.12)',
        '0px 3px 3px -2px rgba(144, 15, 15, 0.2), 0px 3px 4px 0px rgba(144, 15, 15, 0.14), 0px 1px 8px 0px rgba(144, 15, 15, 0.12)',
        '0px 2px 4px -1px rgba(144, 15, 15, 0.2), 0px 4px 5px 0px rgba(144, 15, 15, 0.14), 0px 1px 10px 0px rgba(144, 15, 15, 0.12)',
        '0px 3px 5px -1px rgba(144, 15, 15, 0.2), 0px 5px 8px 0px rgba(144, 15, 15, 0.14), 0px 1px 14px 0px rgba(144, 15, 15, 0.12)',
        '0px 3px 5px -1px rgba(144, 15, 15, 0.2), 0px 6px 10px 0px rgba(144, 15, 15, 0.14), 0px 1px 18px 0px rgba(144, 15, 15, 0.12)',
        '0px 4px 5px -2px rgba(144, 15, 15, 0.2), 0px 7px 10px 1px rgba(144, 15, 15, 0.14), 0px 2px 16px 1px rgba(144, 15, 15, 0.12)',
        '0px 5px 5px -3px rgba(144, 15, 15, 0.2), 0px 8px 10px 1px rgba(144, 15, 15, 0.14), 0px 3px 14px 2px rgba(144, 15, 15, 0.12)',
        '0px 5px 6px -3px rgba(144, 15, 15, 0.2), 0px 9px 12px 1px rgba(144, 15, 15, 0.14), 0px 3px 16px 2px rgba(144, 15, 15, 0.12)',
        '0px 6px 6px -3px rgba(144, 15, 15, 0.2), 0px 10px 14px 1px rgba(144, 15, 15, 0.14), 0px 4px 18px 3px rgba(144, 15, 15, 0.12)',
        '0px 6px 7px -4px rgba(144, 15, 15, 0.2), 0px 11px 15px 1px rgba(144, 15, 15, 0.14), 0px 4px 20px 3px rgba(144, 15, 15, 0.12)',
        '0px 7px 8px -4px rgba(144, 15, 15, 0.2), 0px 12px 17px 2px rgba(144, 15, 15, 0.14), 0px 5px 22px 4px rgba(144, 15, 15, 0.12)',
        '0px 7px 8px -4px rgba(144, 15, 15, 0.2), 0px 13px 19px 2px rgba(144, 15, 15, 0.14), 0px 5px 24px 4px rgba(144, 15, 15, 0.12)',
        '0px 7px 9px -4px rgba(144, 15, 15, 0.2), 0px 14px 21px 2px rgba(144, 15, 15, 0.14), 0px 5px 26px 4px rgba(144, 15, 15, 0.12)',
        '0px 8px 9px -5px rgba(144, 15, 15, 0.2), 0px 15px 22px 2px rgba(144, 15, 15, 0.14), 0px 6px 28px 5px rgba(144, 15, 15, 0.12)',
        '0px 8px 10px -5px rgba(144, 15, 15, 0.2), 0px 16px 24px 2px rgba(144, 15, 15, 0.14), 0px 6px 30px 5px rgba(144, 15, 15, 0.12)',
        '0px 8px 11px -5px rgba(144, 15, 15, 0.2), 0px 17px 26px 2px rgba(144, 15, 15, 0.14), 0px 6px 32px 5px rgba(144, 15, 15, 0.12)',
        '0px 9px 11px -5px rgba(144, 15, 15, 0.2), 0px 18px 28px 2px rgba(144, 15, 15, 0.14), 0px 7px 34px 6px rgba(144, 15, 15, 0.12)',
        '0px 9px 12px -6px rgba(144, 15, 15, 0.2), 0px 19px 29px 2px rgba(144, 15, 15, 0.14), 0px 7px 36px 6px rgba(144, 15, 15, 0.12)',
        '0px 10px 13px -6px rgba(144, 15, 15, 0.2), 0px 20px 31px 3px rgba(144, 15, 15, 0.14), 0px 8px 38px 7px rgba(144, 15, 15, 0.12)',
        '0px 10px 13px -6px rgba(144, 15, 15, 0.2), 0px 21px 33px 3px rgba(144, 15, 15, 0.14), 0px 8px 40px 7px rgba(144, 15, 15, 0.12)',
        '0px 10px 14px -6px rgba(144, 15, 15, 0.2), 0px 22px 35px 3px rgba(144, 15, 15, 0.14), 0px 8px 42px 7px rgba(144, 15, 15, 0.12)',
        '0px 11px 14px -7px rgba(144, 15, 15, 0.2), 0px 23px 36px 3px rgba(144, 15, 15, 0.14), 0px 9px 44px 8px rgba(144, 15, 15, 0.12)',
        '0px 11px 15px -7px rgba(144, 15, 15, 0.2), 0px 24px 38px 3px rgba(144, 15, 15, 0.14), 0px 9px 46px 8px rgba(144, 15, 15, 0.12)',
    ],

    components: {
        // AppBar สำหรับ Header
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#900F0F',
                    color: '#FFFFFF',
                    boxShadow: '0px 2px 8px rgba(144, 15, 15, 0.2)',
                },
            },
        },

        // Button components
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 500,
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 2px 8px rgba(144, 15, 15, 0.2)',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#900F0F',
                    color: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: '#7A0D0D',
                    },
                    '&:disabled': {
                        backgroundColor: '#E0E0E0',
                        color: '#9E9E9E',
                    },
                },
                containedSecondary: {
                    backgroundColor: '#B20000',
                    color: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: '#8B0000',
                    },
                },
                outlined: {
                    borderColor: '#B20000',
                    color: '#B20000',
                    '&:hover': {
                        borderColor: '#900F0F',
                        backgroundColor: 'rgba(144, 15, 15, 0.04)',
                    },
                },
                text: {
                    color: '#B20000',
                    '&:hover': {
                        backgroundColor: 'rgba(144, 15, 15, 0.04)',
                    },
                },
            },
        },

        // Card components
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #F0F0F0',
                    '&:hover': {
                        boxShadow: '0px 4px 16px rgba(144, 15, 15, 0.12)',
                        transform: 'translateY(-1px)',
                        transition: 'all 0.2s ease-in-out',
                    },
                },
            },
        },

        // Paper components
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
                },
            },
        },

        // Chip components  
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 500,
                },
                colorPrimary: {
                    backgroundColor: '#900F0F',
                    color: '#FFFFFF',
                },
                colorSecondary: {
                    backgroundColor: '#B20000',
                    color: '#FFFFFF',
                },
            },
        },

        // TextField components
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        '&.Mui-focused fieldset': {
                            borderColor: '#900F0F',
                            borderWidth: 2,
                        },
                        '&:hover fieldset': {
                            borderColor: '#B20000',
                        },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#900F0F',
                    },
                },
            },
        },

        // Tab components
        MuiTabs: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #E0E0E0',
                },
                indicator: {
                    backgroundColor: '#900F0F',
                    height: 3,
                },
            },
        },

        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '1rem',
                    color: '#757575',
                    '&.Mui-selected': {
                        color: '#900F0F',
                        fontWeight: 600,
                    },
                    '&:hover': {
                        color: '#B20000',
                    },
                },
            },
        },

        // Dialog components
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    padding: 0,
                },
            },
        },

        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    backgroundColor: '#900F0F',
                    color: '#FFFFFF',
                    padding: '16px 24px',
                    fontWeight: 600,
                },
            },
        },

        // Data Grid
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    border: '1px solid #E0E0E0',
                    borderRadius: 12,
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#FAFAFA',
                        borderBottom: '1px solid #E0E0E0',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #F5F5F5',
                    },
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'rgba(144, 15, 15, 0.02)',
                    },
                },
            },
        },

        // Menu components
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
                },
            },
        },

        MuiMenuItem: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(144, 15, 15, 0.04)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(144, 15, 15, 0.08)',
                        '&:hover': {
                            backgroundColor: 'rgba(144, 15, 15, 0.12)',
                        },
                    },
                },
            },
        },

        // Alert components
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
                standardError: {
                    backgroundColor: 'rgba(227, 98, 100, 0.1)',
                    color: '#B20000',
                    '& .MuiAlert-icon': {
                        color: '#B20000',
                    },
                },
                standardWarning: {
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    color: '#F57C00',
                },
                standardSuccess: {
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#388E3C',
                },
                standardInfo: {
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    color: '#1976D2',
                },
            },
        },

        // Stepper components
        MuiStepIcon: {
            styleOverrides: {
                root: {
                    '&.Mui-active': {
                        color: '#900F0F',
                    },
                    '&.Mui-completed': {
                        color: '#900F0F',
                    },
                },
            },
        },

        MuiStepConnector: {
            styleOverrides: {
                line: {
                    borderColor: '#E0E0E0',
                    '&.Mui-active': {
                        borderColor: '#900F0F',
                    },
                    '&.Mui-completed': {
                        borderColor: '#900F0F',
                    },
                },
            },
        },
    },
});

export default accountingTheme;
