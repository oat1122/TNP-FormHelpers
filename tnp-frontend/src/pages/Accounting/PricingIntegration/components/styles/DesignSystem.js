/**
 * 🎨 TNP Design System for PricingIntegration
 * 
 * ระบบการออกแบบที่เป็น unified สำหรับ Pricing Integration Module
 * เน้นความสวยงาม อ่านง่าย และ consistent ทั้งระบบ
 * 
 * @author แต้ม - Fullstack Developer
 * @version 2.0.0
 */

// 🎭 Typography System - ระบบการจัดการข้อความ
export const typography = {
    // 📝 Primary Text Styles
    heading: {
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 600,
        color: 'primary.main',
        lineHeight: 1.3,
    },
    
    subheading: {
        fontFamily: "'Kanit', sans-serif", 
        fontWeight: 500,
        color: 'text.primary',
        lineHeight: 1.4,
    },
    
    body: {
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 400,
        color: 'text.primary',
        lineHeight: 1.5,
    },
    
    caption: {
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 400,
        color: 'text.secondary', 
        lineHeight: 1.4,
    },
    
    // 🏷️ Specialized Text Styles
    prNumber: {
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'primary.main',
        letterSpacing: '0.5px',
    },
    
    statusChip: {
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 500,
        fontSize: '0.75rem',
    },
    
    button: {
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: '0.3px',
    }
};

// 🎨 Color Palette - ระบบสี TNP
export const colors = {
    // 🔴 Primary TNP Colors
    primary: {
        main: '#900F0F',
        dark: '#7A0D0D', 
        light: '#A31515',
        contrast: '#FFFFFF',
    },
    
    secondary: {
        main: '#B20000',
        dark: '#8B0000',
        light: '#CC1A1A',
        contrast: '#FFFFFF',
    },
    
    // 🎯 Status Colors
    status: {
        complete: '#4CAF50',
        pending: '#FF9800',
        inProgress: '#2196F3',
        quoted: '#9C27B0',
        error: '#E36264',
    },
    
    // 🌫️ Background Colors
    background: {
        main: '#FFFFFF',
        light: '#FAFAFA',
        accent: '#FDF2F2',
        card: '#FFFFFF',
    },
    
    // 📄 Text Colors
    text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#BDBDBD',
        hint: '#9E9E9E',
    }
};

// 📏 Spacing System - ระบบการจัดระยะห่าง
export const spacing = {
    // Base unit = 8px (MUI standard)
    xs: 0.5,    // 4px
    sm: 1,      // 8px  
    md: 1.5,    // 12px
    lg: 2,      // 16px
    xl: 2.5,    // 20px
    xxl: 3,     // 24px
    xxxl: 4,    // 32px
};

// 🎪 Animation & Transitions
export const animations = {
    // ⚡ Hover Effects
    cardHover: {
        transform: 'translateY(-6px)',
        boxShadow: '0 16px 32px rgba(144, 15, 15, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    buttonHover: {
        transform: 'translateY(-2px)', 
        boxShadow: '0 6px 12px rgba(144, 15, 15, 0.4)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    chipHover: {
        transform: 'scale(1.05)',
        transition: 'all 0.2s ease-in-out',
    },
    
    // 🌊 Smooth Transitions
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.2s ease-in-out',
    slow: 'all 0.5s ease-in-out',
};

// 🎯 Component Variants - รูปแบบ Component มาตรฐาน
export const variants = {
    // 🃏 Card Variants
    card: {
        default: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            position: 'relative',
        },
        
        elevated: {
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(144, 15, 15, 0.08)',
            border: 'none',
            bgcolor: 'background.paper',
            overflow: 'hidden',
        },
        
        highlighted: {
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.accent',
            overflow: 'hidden',
        }
    },
    
    // 🏷️ Chip Variants  
    chip: {
        status: {
            fontWeight: 500,
            fontSize: '0.75rem',
            fontFamily: "'Kanit', sans-serif",
            height: 24,
        },
        
        count: {
            fontWeight: 600,
            fontSize: '0.75rem', 
            fontFamily: "'Kanit', sans-serif",
            height: 26,
        }
    },
    
    // 🔘 Button Variants
    button: {
        primary: {
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            fontFamily: "'Kanit', sans-serif",
            px: 3,
            py: 1,
            background: 'linear-gradient(45deg, #900F0F 30%, #B20000 90%)',
            boxShadow: '0 3px 5px 2px rgba(144, 15, 15, 0.3)',
        },
        
        secondary: {
            borderRadius: 2,
            fontWeight: 500,
            textTransform: 'none',
            fontFamily: "'Kanit', sans-serif",
            px: 2,
            color: 'text.primary',
        }
    }
};

// 🎪 Utility Functions - ฟังก์ชันช่วยเหลือ
export const utils = {
    // 🎨 Generate gradient backgrounds
    getGradient: (color1, color2, angle = 45) => 
        `linear-gradient(${angle}deg, ${color1} 30%, ${color2} 90%)`,
    
    // 🌈 Get status color
    getStatusColor: (status) => {
        const statusMap = {
            'complete': 'success',
            'ได้ราคาแล้ว': 'success',
            'pending': 'warning',
            'รอทำราคา': 'warning', 
            'in_progress': 'info',
            'กำลังทำราคา': 'info',
            'submitted': 'primary',
            'ส่งคำขอสร้างใบเสนอราคาแล้ว': 'primary'
        };
        return statusMap[status?.toLowerCase()] || 'primary';
    },
    
    // 📐 Get responsive breakpoints
    getBreakpoint: (size) => {
        const breakpoints = {
            xs: '(max-width: 599px)',
            sm: '(min-width: 600px)',
            md: '(min-width: 900px)',
            lg: '(min-width: 1200px)',
            xl: '(min-width: 1536px)',
        };
        return breakpoints[size] || breakpoints.md;
    }
};

// 📱 Responsive Design Helpers
export const responsive = {
    // 📱 Mobile First
    mobile: {
        card: {
            margin: spacing.sm,
            padding: spacing.md,
        },
        typography: {
            fontSize: '0.875rem',
            lineHeight: 1.4,
        }
    },
    
    // 💻 Desktop
    desktop: {
        card: {
            margin: spacing.lg,
            padding: spacing.xl,
        },
        typography: {
            fontSize: '1rem',
            lineHeight: 1.5,
        }
    }
};

// 🎯 Export everything as default design system
export default {
    typography,
    colors,
    spacing,
    animations,
    variants,
    utils,
    responsive,
};
