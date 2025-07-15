import {
  MdPerson,
  MdLanguage,
  MdBusiness,
} from "react-icons/md";

// Channel options for customer communication channels
export const channelOptions = [
  { value: "1", label: "Sales", icon: <MdPerson />, color: "#2196f3" },
  { value: "2", label: "Online", icon: <MdLanguage />, color: "#4caf50" },
  { value: "3", label: "Office", icon: <MdBusiness />, color: "#ff9800" },
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
};

// Color scheme for filter panel
export const filterColors = {
  primary: "#940c0c",
  primaryHover: "#b71c1c",
  primaryLight: "rgba(148, 12, 12, 0.08)",
  primaryBorder: "rgba(148, 12, 12, 0.2)",
  success: "#4caf50",
  warning: "#ff9800",
  info: "#2196f3",
}; 