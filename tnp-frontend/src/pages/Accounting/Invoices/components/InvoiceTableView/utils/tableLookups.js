// Status code → Thai display label (Invoice).
// Invoice มี dual status (before/after deposit) — ใช้ key เดียวกัน 2 ฝั่ง
export const statusLabelMap = {
  draft: "แบบร่าง",
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ถูกปฏิเสธ",
  paid: "ชำระแล้ว",
};

export const chipColorMap = {
  draft: "default",
  pending: "warning",
  approved: "success",
  rejected: "error",
  paid: "success",
};

// "before" | "after" → ป้ายแสดงด้านไหนของ invoice ที่กำลัง active
export const depositSideLabel = {
  before: "ก่อนมัดจำ",
  after: "หลังมัดจำ",
};
