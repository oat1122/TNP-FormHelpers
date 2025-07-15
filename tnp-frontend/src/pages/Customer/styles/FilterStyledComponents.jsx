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
import { filterColors } from "../constants/filterConstants";

// Filter Section Paper Container
export const FilterSectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  height: "100%",
  backgroundColor: "white",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
  "&:hover": {
    boxShadow: `0 8px 20px ${filterColors.primaryBorder}`,
    transform: "translateY(-3px)",
  },
  position: "relative",
  overflow: "hidden",
  border: `1px solid ${filterColors.primaryBorder}`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    height: "5px",
    width: "100%",
    background: `linear-gradient(90deg, ${filterColors.primaryHover} 0%, ${filterColors.primary} 100%)`,
  },
}));

// Filter Header Container
export const FilterHeaderBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
}));

// Filter Icon Container
export const FilterIconBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, ${filterColors.primaryHover} 0%, ${filterColors.primary} 100%)`,
  borderRadius: "50%",
  padding: theme.spacing(1.2),
  boxShadow: `0 3px 8px rgba(148, 12, 12, 0.3)`,
}));

// Filter Title Typography
export const FilterTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: filterColors.primary,
  fontFamily: "'Kanit', sans-serif",
  fontSize: "1.05rem",
}));

// Filter Description Typography
export const FilterDescription = styled(Typography)(({ theme }) => ({
  variant: "caption",
  color: theme.palette.text.secondary,
}));

// Filter Content Container
export const FilterContentBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: filterColors.primaryLight,
  border: `1px solid ${filterColors.primaryBorder}`,
  backdropFilter: "blur(8px)",
  boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
}));

// Quick Button
export const QuickButton = styled(Button)(({ theme }) => ({
  borderRadius: "12px",
  fontSize: "0.85rem",
  borderColor: "rgba(148, 12, 12, 0.5)",
  color: filterColors.primary,
  textTransform: "none",
  fontWeight: 600,
  padding: theme.spacing(0.8, 1.5),
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  border: "1.5px solid rgba(148, 12, 12, 0.4)",
  "&:hover": {
    backgroundColor: filterColors.primaryLight,
    borderColor: filterColors.primary,
    transform: "translateY(-1px)",
    boxShadow: `0 4px 8px ${filterColors.primaryBorder}`,
  },
}));

// Primary Action Button
export const PrimaryActionButton = styled(Button)(({ theme }) => ({
  minWidth: 160,
  borderRadius: theme.spacing(3),
  fontWeight: 600,
  boxShadow: `0 4px 10px rgba(148, 12, 12, 0.3)`,
  padding: theme.spacing(1.2, 2),
  transition: "all 0.3s ease",
  textTransform: "none",
  backgroundColor: filterColors.primary,
  "&:hover": {
    boxShadow: `0 6px 14px rgba(148, 12, 12, 0.4)`,
    backgroundColor: filterColors.primaryHover,
    transform: "translateY(-2px)",
  },
  "&:disabled": {
    backgroundColor: "rgba(148, 12, 12, 0.7)",
    color: "white",
  },
}));

// Secondary Action Button
export const SecondaryActionButton = styled(Button)(({ theme }) => ({
  minWidth: 160,
  borderRadius: theme.spacing(3),
  textTransform: "none",
  fontWeight: 600,
  borderWidth: "1.5px",
  padding: theme.spacing(1.2, 2),
  transition: "all 0.3s ease",
  borderColor: "rgba(148, 12, 12, 0.3)",
  color: filterColors.primary,
  "&:hover": {
    backgroundColor: filterColors.primaryLight,
    borderColor: "rgba(148, 12, 12, 0.6)",
    borderWidth: "1.5px",
    transform: "translateY(-2px)",
    boxShadow: `0 4px 8px ${filterColors.primaryBorder}`,
  },
}));

// Custom Form Control
export const StyledFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    fontSize: "0.95rem",
    "&.Mui-focused": {
      color: filterColors.primary,
    },
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1.5),
    height: 48,
    "&.Mui-focused": {
      boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(148, 12, 12, 0.5)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: filterColors.primary,
      borderWidth: "1.5px",
    },
  },
}));

// Status Chip
export const StatusChip = styled(Chip)(({ theme, variant = "default" }) => ({
  fontWeight: 600,
  borderRadius: "16px",
  height: "26px",
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
  ...(variant === "active" && {
    backgroundColor: filterColors.primary,
    color: "white",
    boxShadow: "0 3px 5px rgba(148, 12, 12, 0.25)",
    animation: "pulse 1.5s infinite ease-in-out",
    "@keyframes pulse": {
      "0%": { boxShadow: "0 3px 5px rgba(148, 12, 12, 0.25)" },
      "50%": { boxShadow: "0 3px 8px rgba(148, 12, 12, 0.4)" },
      "100%": { boxShadow: "0 3px 5px rgba(148, 12, 12, 0.25)" },
    },
  }),
  ...(variant === "success" && {
    background: `linear-gradient(135deg, ${filterColors.primaryHover} 0%, ${filterColors.primary} 100%)`,
    color: "white",
    boxShadow: "0 2px 5px rgba(148, 12, 12, 0.3)",
  }),
  ...(variant === "default" && {
    background: "rgba(0, 0, 0, 0.08)",
    color: theme.palette.text.secondary,
  }),
}));

// Custom Accordion
export const StyledAccordion = styled(Accordion)(({ theme, expanded }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  borderRadius: theme.spacing(4),
  overflow: "hidden",
  "&:before": { display: "none" },
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    boxShadow: "0 10px 28px rgba(148, 12, 12, 0.15)",
  },
  border: expanded
    ? `2px solid ${filterColors.primary}`
    : "1px solid rgba(0, 0, 0, 0.08)",
  position: "relative",
  ...(expanded && {
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      height: "4px",
      width: "100%",
      background: `linear-gradient(90deg, ${filterColors.primaryHover} 0%, ${filterColors.primary} 100%)`,
    },
  }),
}));

// Custom Accordion Summary
export const StyledAccordionSummary = styled(AccordionSummary)(({ theme, expanded }) => ({
  backgroundColor: expanded ? filterColors.primaryLight : theme.palette.background.paper,
  borderBottom: expanded ? `1px solid ${filterColors.primaryBorder}` : "none",
  padding: theme.spacing(1.8),
  "&:hover": {
    backgroundColor: expanded ? "rgba(148, 12, 12, 0.08)" : "rgba(0, 0, 0, 0.03)",
  },
}));

// Custom Accordion Details
export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(3.5),
  background: "linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)",
  borderBottomLeftRadius: theme.spacing(4),
  borderBottomRightRadius: theme.spacing(4),
  backgroundImage: `url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="rgba(148, 12, 12, 0.03)" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E')`,
}));

// Expand Icon Box
export const ExpandIconBox = styled(Box)(({ theme, expanded }) => ({
  backgroundColor: expanded ? filterColors.primary : theme.palette.action.hover,
  borderRadius: "50%",
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
  color: expanded ? "white" : theme.palette.text.primary,
  boxShadow: expanded ? "0 4px 8px rgba(148, 12, 12, 0.3)" : "none",
  "&:hover": {
    transform: "scale(1.05)",
  },
})); 