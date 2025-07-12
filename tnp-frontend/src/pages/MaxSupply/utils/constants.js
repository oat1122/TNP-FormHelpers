// Production Type Configuration - Enhanced with gradients and better colors
export const productionTypeConfig = {
  screen: { 
    color: '#1a73e8', 
    bgColor: '#e8f0fe',
    iconComponent: 'ScreenShare', // Material-UI icon
    icon: '📺', // เก็บเป็น fallback
    label: 'Screen Printing',
    gradient: 'linear-gradient(135deg, #1a73e8, #1557b0)',
    lightColor: '#e8f0fe',
  },
  dtf: { 
    color: '#f9ab00', 
    bgColor: '#fef7e0',
    iconComponent: 'PhoneAndroid', // Material-UI icon
    icon: '📱', // เก็บเป็น fallback
    label: 'DTF',
    gradient: 'linear-gradient(135deg, #f9ab00, #e37400)',
    lightColor: '#fef7e0',
  },
  sublimation: { 
    color: '#9334e6', 
    bgColor: '#f3e8ff',
    iconComponent: 'Sports', // Material-UI icon
    icon: '⚽', // เก็บเป็น fallback
    label: 'Sublimation',
    gradient: 'linear-gradient(135deg, #9334e6, #7c2d99)',
    lightColor: '#f3e8ff',
  },
  embroidery: { 
    color: '#137333', 
    bgColor: '#e6f4ea',
    iconComponent: 'ContentCut', // Material-UI icon
    icon: '🧵', // เก็บเป็น fallback
    label: 'Embroidery',
    gradient: 'linear-gradient(135deg, #137333, #0f5132)',
    lightColor: '#e6f4ea',
  },
};

export const statusConfig = {
  pending: { color: '#f9ab00', label: 'รอดำเนินการ', bgColor: '#fef7e0' },
  in_progress: { color: '#1a73e8', label: 'กำลังดำเนินการ', bgColor: '#e8f0fe' },
  completed: { color: '#137333', label: 'เสร็จสิ้น', bgColor: '#e6f4ea' },
  cancelled: { color: '#d93025', label: 'ยกเลิก', bgColor: '#fce8e6' },
};

export const priorityConfig = {
  low: { color: '#5f6368', label: 'ต่ำ' },
  normal: { color: '#1a73e8', label: 'ปกติ' },
  high: { color: '#f9ab00', label: 'สูง' },
  urgent: { color: '#d93025', label: 'เร่งด่วน' },
};

// Calendar configuration constants
export const CALENDAR_CONFIG = {
  MAX_ROWS: 4, // เพิ่มจาก 3 เป็น 4 แถว
  MAX_EVENTS_PER_ROW: 2,
  DAYS_PER_WEEK: 7,
  MOBILE_CALENDAR_HEIGHT: 160, // เพิ่มจาก 80 เป็น 160
  DESKTOP_CALENDAR_HEIGHT: 200, // เพิ่มจาก 120 เป็น 200
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
export const DAY_NAMES = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']; 