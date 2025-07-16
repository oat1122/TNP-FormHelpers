import React from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { filterColors, filterPanelConfig } from "../constants/filterConstants";
import { animations, transitions, interactiveStates } from "../utils/animations";

// Filter Section Paper Container - Enhanced with modern design and animations
export const FilterSectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3.5),
  borderRadius: filterPanelConfig.borderRadius.xlarge,
  height: "100%",
  backgroundColor: filterColors.background.paper,
  transition: transitions.smooth,
  boxShadow: filterPanelConfig.shadows.light,
  position: "relative",
  overflow: "hidden",
  border: `1px solid ${filterColors.border.light}`,
  
  // Add entrance animation
  ...animations.fadeIn,
  
  "&:hover": {
    boxShadow: filterPanelConfig.shadows.colored,
    transform: "translateY(-4px) scale(1.01)",
    border: `1px solid ${filterColors.border.focus}`,
    
    // Animate the filter icon
    "& .filter-icon": {
      transform: "scale(1.1) rotate(5deg)",
    },
  },
  
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    height: "4px",
    width: "100%",
    background: filterColors.primaryGradient,
    borderRadius: `${filterPanelConfig.borderRadius.xlarge}px ${filterPanelConfig.borderRadius.xlarge}px 0 0`,
    transition: transitions.smooth,
  },
  
  "&::after": {
    content: '""',
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: filterColors.primaryGradient,
    borderRadius: filterPanelConfig.borderRadius.xlarge + 2,
    zIndex: -1,
    opacity: 0,
    transition: transitions.smooth,
  },
  
  "&:hover::after": {
    opacity: 0.1,
  },
  
  // Add subtle bounce when content changes
  "&.content-updated": {
    ...animations.bounce,
  },
}));

// Filter Header Container - Improved spacing and alignment
export const FilterHeaderBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2.5),
  padding: theme.spacing(0.5),
}));

// Filter Icon Container - Modern glassmorphism effect with animations
export const FilterIconBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: filterColors.primaryGradient,
  borderRadius: "50%",
  padding: theme.spacing(1.5),
  boxShadow: filterColors.status.active.shadow,
  position: "relative",
  transition: transitions.smooth,
  
  // Add the filter-icon class for parent hover effects
  className: "filter-icon",
  
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    padding: "2px",
    background: filterColors.primaryGradient,
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "xor",
    WebkitMaskComposite: "xor",
    transition: transitions.smooth,
  },
  
  "& svg": {
    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
    transition: transitions.transform,
  },
  
  "&:hover": {
    transform: "scale(1.1)",
    boxShadow: "0 6px 20px rgba(148, 12, 12, 0.4)",
    
    "& svg": {
      transform: "rotate(10deg)",
    },
  },
  
  // Active state with pulse
  "&.active": {
    ...animations.pulse,
  },
}));

// Filter Title Typography - Enhanced typography
export const FilterTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: filterColors.text.primary,
  fontFamily: "'Kanit', sans-serif",
  fontSize: "1.1rem",
  letterSpacing: "0.5px",
  lineHeight: 1.2,
  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
}));

// Filter Description Typography - Improved readability
export const FilterDescription = styled(Typography)(({ theme }) => ({
  color: filterColors.text.secondary,
  fontSize: "0.875rem",
  lineHeight: 1.4,
  marginTop: theme.spacing(0.5),
  fontWeight: 400,
}));

// Filter Content Container - Modern glass card effect
export const FilterContentBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: filterPanelConfig.borderRadius.large,
  backgroundColor: filterColors.background.elevated,
  border: `1px solid ${filterColors.border.light}`,
  backdropFilter: "blur(10px)",
  background: filterColors.background.section,
  boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
  position: "relative",
  
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: filterPanelConfig.borderRadius.large,
    backgroundImage: filterColors.overlay.pattern,
    opacity: 0.3,
    pointerEvents: "none",
  },
}));

// Quick Button - Enhanced with better states and animations
export const QuickButton = styled(Button)(({ theme }) => ({
  borderRadius: filterPanelConfig.borderRadius.medium,
  fontSize: "0.875rem",
  color: filterColors.primary,
  textTransform: "none",
  fontWeight: 600,
  padding: theme.spacing(1, 2),
  minHeight: 36,
  border: `1.5px solid ${filterColors.border.focus}`,
  backgroundColor: filterColors.background.paper,
  boxShadow: filterPanelConfig.shadows.light,
  transition: transitions.fast,
  position: "relative",
  overflow: "hidden",
  
  // Add subtle entrance animation
  ...animations.scaleUp,
  
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
    transition: "left 0.5s ease",
  },
  
  "&:hover": {
    backgroundColor: filterColors.hover.strong,
    borderColor: filterColors.primary,
    transform: "translateY(-2px) scale(1.02)",
    boxShadow: filterPanelConfig.shadows.medium,
    
    "&::before": {
      left: "100%",
    },
  },
  
  "&:active": {
    transform: "translateY(-1px) scale(0.98)",
    transition: transitions.fast,
  },
  
  "&.Mui-disabled": {
    color: filterColors.text.disabled,
    borderColor: filterColors.border.light,
    transform: "none",
  },
  
  // Selected state
  "&.selected": {
    backgroundColor: filterColors.primary,
    color: "#ffffff",
    borderColor: filterColors.primary,
    ...animations.chipSelect,
  },
}));

// Primary Action Button - Modern gradient design with enhanced animations
export const PrimaryActionButton = styled(Button)(({ theme }) => ({
  borderRadius: filterPanelConfig.borderRadius.medium,
  fontSize: "1rem",
  fontWeight: 700,
  padding: theme.spacing(1.5, 3),
  minHeight: 48,
  textTransform: "none",
  background: filterColors.primaryGradient,
  color: "#ffffff",
  border: "none",
  boxShadow: filterColors.status.active.shadow,
  transition: transitions.smooth,
  position: "relative",
  overflow: "hidden",
  
  // Add entrance animation
  ...animations.scaleUp,
  
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
    borderRadius: filterPanelConfig.borderRadius.medium,
    opacity: 0,
    transition: transitions.smooth,
  },
  
  "&::after": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "0",
    height: "0",
    background: "rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    transition: "width 0.6s ease, height 0.6s ease",
  },
  
  "&:hover": {
    transform: "translateY(-3px) scale(1.02)",
    boxShadow: "0 8px 25px rgba(148, 12, 12, 0.5)",
    
    "&::before": {
      opacity: 1,
    },
    
    "&::after": {
      width: "300px",
      height: "300px",
    },
  },
  
  "&:active": {
    transform: "translateY(-1px) scale(0.98)",
    transition: transitions.fast,
  },
  
  "&:disabled": {
    background: filterColors.text.disabled,
    color: "#ffffff",
    opacity: 0.7,
    transform: "none",
    
    "&:hover": {
      transform: "none",
      boxShadow: "none",
    },
  },
  
  // Loading state
  "&.loading": {
    pointerEvents: "none",
    
    "& .MuiCircularProgress-root": {
      ...animations.spin,
    },
  },
  
  // Success state
  "&.success": {
    background: filterColors.status.success.background,
    ...animations.bounce,
  },
}));

// Secondary Action Button - Clean outline design
export const SecondaryActionButton = styled(Button)(({ theme }) => ({
  borderRadius: filterPanelConfig.borderRadius.medium,
  fontSize: "1rem",
  fontWeight: 600,
  padding: theme.spacing(1.5, 3),
  minHeight: 48,
  textTransform: "none",
  backgroundColor: filterColors.background.paper,
  color: filterColors.text.secondary,
  border: `2px solid ${filterColors.border.medium}`,
  boxShadow: filterPanelConfig.shadows.light,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  
  "&:hover": {
    backgroundColor: filterColors.hover.light,
    borderColor: filterColors.border.focus,
    color: filterColors.primary,
    transform: "translateY(-1px)",
    boxShadow: filterPanelConfig.shadows.medium,
  },
  
  "&:active": {
    transform: "translateY(0)",
  },
}));

// Styled Form Control - Enhanced input styling
export const StyledFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiInputLabel-root": {
    color: filterColors.text.secondary,
    fontSize: "0.95rem",
    fontWeight: 500,
    "&.Mui-focused": {
      color: filterColors.primary,
    },
  },
  
  "& .MuiOutlinedInput-root": {
    borderRadius: filterPanelConfig.borderRadius.medium,
    minHeight: 48,
    backgroundColor: filterColors.background.paper,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: filterColors.border.focus,
    },
    
    "&.Mui-focused": {
      boxShadow: `0 0 0 3px ${filterColors.primaryLight}`,
      
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: filterColors.primary,
        borderWidth: "2px",
      },
    },
    
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: filterColors.border.light,
    },
  },
  
  "& .MuiSelect-select": {
    fontWeight: 500,
  },
}));

// Status Chip - Modern design with better states
export const StatusChip = styled(Chip)(({ theme, variant = "default" }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "active":
        return {
          background: filterColors.status.active.background,
          color: filterColors.status.active.color,
          boxShadow: filterColors.status.active.shadow,
          animation: "pulse 2s infinite ease-in-out",
        };
      case "success":
        return {
          background: filterColors.status.success.background,
          color: filterColors.status.success.color,
          boxShadow: filterColors.status.success.shadow,
        };
      case "warning":
        return {
          background: filterColors.status.warning.background,
          color: filterColors.status.warning.color,
          boxShadow: filterColors.status.warning.shadow,
        };
      case "info":
        return {
          background: filterColors.status.info.background,
          color: filterColors.status.info.color,
          boxShadow: filterColors.status.info.shadow,
        };
      default:
        return {
          background: filterColors.status.default.background,
          color: filterColors.status.default.color,
          boxShadow: filterColors.status.default.shadow,
        };
    }
  };

     return {
     fontWeight: 600,
     borderRadius: filterPanelConfig.borderRadius.large,
     height: "28px",
     fontSize: "0.875rem",
     transition: transitions.fast,
     position: "relative",
     overflow: "hidden",
     
     // Add entrance animation
     ...animations.scaleUp,
     
     "& .MuiChip-label": {
       paddingLeft: theme.spacing(1.5),
       paddingRight: theme.spacing(1.5),
       fontWeight: "inherit",
       position: "relative",
       zIndex: 1,
     },
     
     "&::before": {
       content: '""',
       position: "absolute",
       top: 0,
       left: "-100%",
       width: "100%",
       height: "100%",
       background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
       transition: "left 0.5s ease",
     },
     
     "&:hover": {
       transform: "scale(1.05)",
       filter: "brightness(1.1)",
       
       "&::before": {
         left: "100%",
       },
     },
     
     // Pulse animation for active variant
     ...(variant === "active" && animations.pulse),
     
     ...getVariantStyles(),
   };
});

// Custom Accordion - Modern card design
export const StyledAccordion = styled(Accordion, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})(({ theme, expanded }) => ({
  backgroundColor: filterColors.background.paper,
  boxShadow: expanded ? filterPanelConfig.shadows.heavy : filterPanelConfig.shadows.medium,
  borderRadius: `${filterPanelConfig.borderRadius.xlarge}px !important`,
  overflow: "hidden",
  border: expanded 
    ? `2px solid ${filterColors.primary}` 
    : `1px solid ${filterColors.border.light}`,
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  
  "&:before": { display: "none" },
  
  "&:hover": {
    boxShadow: filterPanelConfig.shadows.colored,
    transform: "translateY(-2px)",
  },
  
  ...(expanded && {
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      height: "4px",
      width: "100%",
      background: filterColors.primaryGradient,
      zIndex: 1,
    },
  }),
}));

// Custom Accordion Summary - Enhanced header design
export const StyledAccordionSummary = styled(AccordionSummary, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})(({ theme, expanded }) => ({
  backgroundColor: expanded 
    ? filterColors.background.elevated 
    : filterColors.background.paper,
  borderBottom: expanded ? `1px solid ${filterColors.border.light}` : "none",
  padding: theme.spacing(2.5, 3),
  minHeight: 72,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  
  "&:hover": {
    backgroundColor: expanded 
      ? filterColors.hover.strong 
      : filterColors.hover.light,
  },
  
  "& .MuiAccordionSummary-content": {
    margin: 0,
    alignItems: "center",
  },
  
  "& .MuiAccordionSummary-expandIconWrapper": {
    marginRight: 0,
  },
}));

// Custom Accordion Details - Beautiful content area
export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(4),
  background: filterColors.background.section,
  borderBottomLeftRadius: filterPanelConfig.borderRadius.xlarge,
  borderBottomRightRadius: filterPanelConfig.borderRadius.xlarge,
  position: "relative",
  
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: filterColors.overlay.pattern,
    opacity: 0.4,
    pointerEvents: "none",
    borderBottomLeftRadius: filterPanelConfig.borderRadius.xlarge,
    borderBottomRightRadius: filterPanelConfig.borderRadius.xlarge,
  },
  
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
}));

// Expand Icon Box - Improved interactive design
export const ExpandIconBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})(({ theme, expanded }) => ({
  backgroundColor: expanded ? filterColors.primary : filterColors.background.elevated,
  borderRadius: "50%",
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  color: expanded ? "#ffffff" : filterColors.text.primary,
  boxShadow: expanded 
    ? filterColors.status.active.shadow 
    : filterPanelConfig.shadows.light,
  border: `2px solid ${expanded ? filterColors.primary : filterColors.border.light}`,
  
  "&:hover": {
    transform: "scale(1.1) rotate(180deg)",
    backgroundColor: filterColors.primary,
    color: "#ffffff",
    boxShadow: filterColors.status.active.shadow,
  },
  
  "& svg": {
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
  },
})); 