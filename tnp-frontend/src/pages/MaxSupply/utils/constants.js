// Production Type Configuration - Enhanced with Material-UI icons and consistent colors
export const productionTypeConfig = {
  screen: {
    color: "#1565C0", // น้ำเงิน - Screen Printing
    bgColor: "#E3F2FD",
    iconComponent: "ScreenShare", // Material-UI icon
    icon: "�️", // เก็บเป็น fallback
    label: "Screen Printing",
    gradient: "linear-gradient(135deg, #1565C0, #0D47A1)",
    lightColor: "#E3F2FD",
  },
  dtf: {
    color: "#FF8F00", // เหลือง - DTF
    bgColor: "#FFF3E0",
    iconComponent: "Print", // Material-UI icon
    icon: "🧵", // เก็บเป็น fallback
    label: "DTF",
    gradient: "linear-gradient(135deg, #FF8F00, #E65100)",
    lightColor: "#FFF3E0",
  },
  sublimation: {
    color: "#7B1FA2", // ม่วง - Sublimation
    bgColor: "#F3E5F5",
    iconComponent: "LocalPrintshop", // Material-UI icon
    icon: "🖨️", // เก็บเป็น fallback
    label: "Sublimation",
    gradient: "linear-gradient(135deg, #7B1FA2, #4A148C)",
    lightColor: "#F3E5F5",
  },
  embroidery: {
    color: "#2E7D32", // เขียว - Embroidery
    bgColor: "#E8F5E8",
    iconComponent: "ContentCut", // Material-UI icon
    icon: "✂️", // เก็บเป็น fallback
    label: "Embroidery",
    gradient: "linear-gradient(135deg, #2E7D32, #1B5E20)",
    lightColor: "#E8F5E8",
  },
};

export const statusConfig = {
  pending: { color: "#f59e0b", label: "รอดำเนินการ", bgColor: "#fef3c7" }, // ใช้สีเหลืองแทนส้ม
  in_progress: {
    color: "#B20000",
    label: "กำลังดำเนินการ",
    bgColor: "#fef2f2",
  }, // ใช้สีหลักของระบบ
  completed: { color: "#059669", label: "เสร็จสิ้น", bgColor: "#d1fae5" }, // เก็บสีเขียวไว้
  cancelled: { color: "#dc2626", label: "ยกเลิก", bgColor: "#fee2e2" }, // เก็บสีแดงไว้
};

export const priorityConfig = {
  low: { color: "#6b7280", label: "ต่ำ" }, // เก็บสีเทาไว้
  normal: { color: "#B20000", label: "ปกติ" }, // ใช้สีหลักของระบบ
  high: { color: "#f59e0b", label: "สูง" }, // ใช้สีเหลือง/ส้ม
  urgent: { color: "#dc2626", label: "เร่งด่วน" }, // เก็บสีแดงเข้มไว้เพื่อเน้นความเร่งด่วน
};

// Calendar configuration constants
export const CALENDAR_CONFIG = {
  MAX_ROWS: 5, // เพิ่มจาก 4 เป็น 5 แถว
  MAX_EVENTS_PER_ROW: 2,
  DAYS_PER_WEEK: 7,
  MOBILE_CALENDAR_HEIGHT: 180, // เพิ่มจาก 160 เป็น 180 เพื่อรองรับ 5 แถว
  DESKTOP_CALENDAR_HEIGHT: 230, // เพิ่มจาก 200 เป็น 230 เพื่อรองรับ 5 แถว
  MOBILE_TIMELINE_OFFSET: 45,
  DESKTOP_TIMELINE_OFFSET: 60,
  MOBILE_TIMELINE_SPACING: 20,
  DESKTOP_TIMELINE_SPACING: 22,
  MOBILE_TIMELINE_HEIGHT: 18,
  DESKTOP_TIMELINE_HEIGHT: 22,
};

// Priority order for sorting
export const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

// Day names in Thai
export const DAY_NAMES = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

// Day names abbreviations in Thai for mobile
export const DAY_NAMES_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
