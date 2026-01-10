import { MdPerson, MdLanguage, MdBusiness } from "react-icons/md";
import { CUSTOMER_CHANNEL } from "./customerChannel";

// Channel options for customer communication channels
// Uses Number values from CUSTOMER_CHANNEL for type consistency
export const channelOptions = [
  { value: CUSTOMER_CHANNEL.SALES, label: "Sales", icon: MdPerson, color: "#1976d2" },
  { value: CUSTOMER_CHANNEL.ONLINE, label: "Online", icon: MdLanguage, color: "#388e3c" },
  { value: CUSTOMER_CHANNEL.OFFICE, label: "Office", icon: MdBusiness, color: "#f57c00" },
];

// Date range quick selection options
export const dateRangeOptions = [
  { key: "today", label: "วันนี้" },
  { key: "yesterday", label: "เมื่อวาน" },
  { key: "thisWeek", label: "สัปดาห์นี้" },
  { key: "lastWeek", label: "สัปดาห์ที่แล้ว" },
  { key: "thisMonth", label: "เดือนนี้" },
  { key: "lastMonth", label: "เดือนที่แล้ว" },
];

// Filter form field validation
export const filterValidation = {
  maxSalesSelection: 50, // Maximum number of sales that can be selected
  maxChannelSelection: 3, // Maximum number of channels that can be selected
  dateFormat: "DD/MM/YYYY",
  buddhistYearOffset: 543,
};

// Filter panel UI configurations
export const filterPanelConfig = {
  debounceDelay: 500,
  defaultPageSize: 30,
  maxMenuHeight: 300,
  animationDuration: 300,
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    light: "0 2px 8px rgba(0, 0, 0, 0.08)",
    medium: "0 4px 16px rgba(0, 0, 0, 0.12)",
    heavy: "0 8px 24px rgba(0, 0, 0, 0.16)",
    colored: "0 4px 16px rgba(148, 12, 12, 0.20)",
  },
};

// Enhanced color scheme for filter panel with theme integration
export const filterColors = {
  // Primary brand colors
  primary: "#940c0c",
  primaryHover: "#b71c1c",
  primaryLight: "rgba(148, 12, 12, 0.08)",
  primaryBorder: "rgba(148, 12, 12, 0.2)",
  primaryGradient: "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",

  // Semantic colors
  success: "#2e7d32",
  successLight: "rgba(46, 125, 50, 0.08)",
  warning: "#ed6c02",
  warningLight: "rgba(237, 108, 2, 0.08)",
  info: "#0288d1",
  infoLight: "rgba(2, 136, 209, 0.08)",
  error: "#d32f2f",
  errorLight: "rgba(211, 47, 47, 0.08)",

  // Neutral colors
  background: {
    default: "#ffffff",
    paper: "#ffffff",
    elevated: "#f8f9fa",
    section: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
  },

  // Text colors
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)",
    hint: "rgba(0, 0, 0, 0.38)",
  },

  // Border colors
  border: {
    light: "rgba(0, 0, 0, 0.08)",
    medium: "rgba(0, 0, 0, 0.12)",
    focus: "rgba(148, 12, 12, 0.5)",
    active: "rgba(148, 12, 12, 0.8)",
  },

  // Interactive states
  hover: {
    light: "rgba(0, 0, 0, 0.04)",
    medium: "rgba(148, 12, 12, 0.04)",
    strong: "rgba(148, 12, 12, 0.08)",
  },

  // Overlay colors
  overlay: {
    light: "rgba(0, 0, 0, 0.02)",
    medium: "rgba(0, 0, 0, 0.04)",
    pattern: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="rgba(148, 12, 12, 0.02)" fill-opacity="1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`,
  },

  // Status colors for chips
  status: {
    active: {
      background: "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",
      color: "#ffffff",
      shadow: "0 3px 8px rgba(148, 12, 12, 0.3)",
    },
    success: {
      background: "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
      color: "#ffffff",
      shadow: "0 3px 8px rgba(46, 125, 50, 0.3)",
    },
    warning: {
      background: "linear-gradient(135deg, #f57c00 0%, #ed6c02 100%)",
      color: "#ffffff",
      shadow: "0 3px 8px rgba(237, 108, 2, 0.3)",
    },
    info: {
      background: "linear-gradient(135deg, #1976d2 0%, #0288d1 100%)",
      color: "#ffffff",
      shadow: "0 3px 8px rgba(2, 136, 209, 0.3)",
    },
    default: {
      background: "rgba(0, 0, 0, 0.08)",
      color: "rgba(0, 0, 0, 0.6)",
      shadow: "none",
    },
  },
};
