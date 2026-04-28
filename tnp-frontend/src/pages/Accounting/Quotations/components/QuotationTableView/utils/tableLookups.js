// Status code → Thai display label.
export const statusLabelMap = {
  draft: "แบบร่าง",
  pending_review: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ถูกปฏิเสธ",
  sent: "ส่งแล้ว",
  completed: "เสร็จสิ้น",
};

// Status color name (from statusMap) → MUI Chip color prop.
export const chipColorMap = {
  default: undefined,
  warning: "warning",
  success: "success",
  error: "error",
  info: "info",
};
