import { RadioButtonUnchecked, Schedule, CheckCircle } from "@mui/icons-material";

// Column configurations
export const COLUMN_CONFIGS = [
  {
    id: "pending",
    title: "In Progress",
    color: "#FEF3C7", // Yellow background
    icon: "RadioButtonUnchecked",
    iconComponent: RadioButtonUnchecked,
  },
  {
    id: "in_progress",
    title: "In Review",
    color: "#E0E7FF", // Purple background
    icon: "Schedule",
    iconComponent: Schedule,
  },
  {
    id: "completed",
    title: "Done",
    color: "#D1FAE5", // Green background
    icon: "CheckCircle",
    iconComponent: CheckCircle,
  },
];

// Production type configurations
export const PRODUCTION_TYPES = {
  screen: { color: "#7c3aed", icon: "📺", label: "Screen" },
  dtf: { color: "#0891b2", icon: "📱", label: "DTF" },
  sublimation: { color: "#16a34a", icon: "⚽", label: "Sublimation" },
  embroidery: { color: "#dc2626", icon: "🧵", label: "Embroidery" },
};

// Priority configurations
export const PRIORITY_COLORS = {
  low: "#10b981",
  normal: "#6b7280",
  high: "#f59e0b",
  urgent: "#ef4444",
};

// Utility functions
export const getColumnConfig = (columnId) => {
  return COLUMN_CONFIGS.find((col) => col.id === columnId);
};

export const getProductionTypeConfig = (productionType) => {
  return PRODUCTION_TYPES[productionType] || PRODUCTION_TYPES.screen;
};

export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal;
};

export const getJobsByStatus = (jobs, status) => {
  return jobs.filter((job) => job.status === status);
};

export const getJobCountByStatus = (jobs, status) => {
  return getJobsByStatus(jobs, status).length;
};

export const createColumnsWithCounts = (jobs) => {
  return COLUMN_CONFIGS.map((column) => ({
    ...column,
    count: getJobCountByStatus(jobs, column.id),
  }));
};
