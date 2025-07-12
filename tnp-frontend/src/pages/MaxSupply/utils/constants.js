// Production Type Configuration - Enhanced with Material-UI icons and consistent colors
export const productionTypeConfig = {
  screen: { 
    color: '#B20000', // ใช้สีหลักของระบบ 
    bgColor: '#fef2f2',
    iconComponent: 'ScreenShare', // Material-UI icon
    icon: '📺', // เก็บเป็น fallback
    label: 'Screen Printing',
    gradient: 'linear-gradient(135deg, #B20000, #900F0F)',
    lightColor: '#fef2f2',
  },
  dtf: { 
    color: '#E36264', // ใช้สี secondary ของระบบ
    bgColor: '#fef2f2',
    iconComponent: 'PhoneAndroid', // Material-UI icon
    icon: '📱', // เก็บเป็น fallback
    label: 'DTF',
    gradient: 'linear-gradient(135deg, #E36264, #B20000)',
    lightColor: '#fef2f2',
  },
  sublimation: { 
    color: '#16a34a', // เก็บสีเขียวไว้เพื่อแยกประเภท
    bgColor: '#f0fdf4',
    iconComponent: 'LocalPrintshop', // เปลี่ยนเป็นไอคอนที่เหมาะสมกว่า
    icon: '🖨️', // เก็บเป็น fallback
    label: 'Sublimation',
    gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
    lightColor: '#f0fdf4',
  },
  embroidery: { 
    color: '#0891b2', // ใช้สีฟ้าเพื่อแยกประเภท
    bgColor: '#f0f9ff',
    iconComponent: 'ContentCut', // Material-UI icon
    icon: '🧵', // เก็บเป็น fallback
    label: 'Embroidery',
    gradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
    lightColor: '#f0f9ff',
  },
};

export const statusConfig = {
  pending: { color: '#f59e0b', label: 'รอดำเนินการ', bgColor: '#fef3c7' }, // ใช้สีเหลืองแทนส้ม
  in_progress: { color: '#B20000', label: 'กำลังดำเนินการ', bgColor: '#fef2f2' }, // ใช้สีหลักของระบบ
  completed: { color: '#059669', label: 'เสร็จสิ้น', bgColor: '#d1fae5' }, // เก็บสีเขียวไว้
  cancelled: { color: '#dc2626', label: 'ยกเลิก', bgColor: '#fee2e2' }, // เก็บสีแดงไว้
};

export const priorityConfig = {
  low: { color: '#6b7280', label: 'ต่ำ' }, // เก็บสีเทาไว้
  normal: { color: '#B20000', label: 'ปกติ' }, // ใช้สีหลักของระบบ
  high: { color: '#f59e0b', label: 'สูง' }, // ใช้สีเหลือง/ส้ม
  urgent: { color: '#dc2626', label: 'เร่งด่วน' }, // เก็บสีแดงเข้มไว้เพื่อเน้นความเร่งด่วน
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