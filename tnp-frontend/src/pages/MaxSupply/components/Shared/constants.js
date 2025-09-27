// Production Type Configuration - Enhanced with gradients and better colors
export const productionTypeConfig = {
  screen: {
    color: "#1a73e8",
    bgColor: "#e8f0fe",
    icon: "📺",
    label: "Screen Printing",
    gradient: "linear-gradient(135deg, #1a73e8, #1557b0)",
    lightColor: "#e8f0fe",
  },
  dtf: {
    color: "#f9ab00",
    bgColor: "#fef7e0",
    icon: "📱",
    label: "DTF",
    gradient: "linear-gradient(135deg, #f9ab00, #e37400)",
    lightColor: "#fef7e0",
  },
  sublimation: {
    color: "#9334e6",
    bgColor: "#f3e8ff",
    icon: "⚽",
    label: "Sublimation",
    gradient: "linear-gradient(135deg, #9334e6, #7c2d99)",
    lightColor: "#f3e8ff",
  },
  embroidery: {
    color: "#137333",
    bgColor: "#e6f4ea",
    icon: "🧵",
    label: "Embroidery",
    gradient: "linear-gradient(135deg, #137333, #0f5132)",
    lightColor: "#e6f4ea",
  },
};

// Status Configuration
export const statusConfig = {
  pending: { color: "#f9ab00", label: "รอดำเนินการ", bgColor: "#fef7e0" },
  in_progress: { color: "#1a73e8", label: "กำลังดำเนินการ", bgColor: "#e8f0fe" },
  completed: { color: "#137333", label: "เสร็จสิ้น", bgColor: "#e6f4ea" },
  cancelled: { color: "#d93025", label: "ยกเลิก", bgColor: "#fce8e6" },
};

// Priority Configuration
export const priorityConfig = {
  low: { color: "#5f6368", label: "ต่ำ" },
  normal: { color: "#1a73e8", label: "ปกติ" },
  high: { color: "#f9ab00", label: "สูง" },
  urgent: { color: "#d93025", label: "เร่งด่วน" },
};

// Priority order for sorting
export const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };

// Production types for forms (matched to backend validation)
export const productionTypes = [
  { value: "screen", label: "📺 Screen Printing", color: "#7c3aed" },
  { value: "dtf", label: "📱 DTF (Direct Film Transfer)", color: "#0891b2" },
  { value: "sublimation", label: "⚽ Sublimation", color: "#16a34a" },
  // Note: embroidery is not supported in backend yet
];

// Shirt types (matched to backend enum)
export const shirtTypes = [
  { value: "polo", label: "เสื้อโปโล" },
  { value: "t-shirt", label: "เสื้อยืด" },
  { value: "hoodie", label: "เสื้อฮูดี้" },
  { value: "tank-top", label: "เสื้อกล้าม" },
  // Note: 'long-sleeve' is not supported in backend enum
];

// Size options
export const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// Priority levels
export const priorityLevels = [
  { value: "low", label: "ต่ำ", color: "#10b981" },
  { value: "normal", label: "ปกติ", color: "#6b7280" },
  { value: "high", label: "สูง", color: "#f59e0b" },
  { value: "urgent", label: "ด่วน", color: "#ef4444" },
];

// Calendar constants
export const CALENDAR_CONSTANTS = {
  DAYS_PER_WEEK: 7,
  MOBILE_ROW_HEIGHT: 80,
  DESKTOP_ROW_HEIGHT: 120,
  MOBILE_TIMELINE_OFFSET: 45,
  DESKTOP_TIMELINE_OFFSET: 60,
  MOBILE_TIMELINE_SPACING: 20,
  DESKTOP_TIMELINE_SPACING: 22,
  MOBILE_TIMELINE_HEIGHT: 18,
  DESKTOP_TIMELINE_HEIGHT: 22,
};

// Form validation constants
export const FORM_VALIDATION = {
  MAX_TITLE_LENGTH: 255,
  MAX_NOTES_LENGTH: 1000,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99999,
  REQUIRED_FIELDS: [
    "worksheet_id",
    "title",
    "production_type",
    "start_date",
    "expected_completion_date",
  ],
};
