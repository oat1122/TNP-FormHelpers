import { format, parseISO, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";

// Format date to Thai locale
export const formatDate = (dateStr) => {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, "dd MMM yyyy", { locale: th });
  } catch {
    return "ไม่ระบุ";
  }
};

// Format date to short format
export const formatShortDate = (dateStr) => {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, "dd/MM", { locale: th });
  } catch {
    return "--";
  }
};

// Format date to full format with day name
export const formatFullDate = (dateStr) => {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, "EEEE dd MMMM yyyy", { locale: th });
  } catch {
    return "ไม่ระบุ";
  }
};

// Get relative time text
export const getRelativeTime = (dateStr) => {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    const now = new Date();
    const days = differenceInDays(date, now);

    if (days === 0) return "วันนี้";
    if (days === 1) return "พรุ่งนี้";
    if (days === -1) return "เมื่อวาน";
    if (days > 0) return `อีก ${days} วัน`;
    return `${Math.abs(days)} วันที่แล้ว`;
  } catch {
    return "ไม่ระบุ";
  }
};

// Calculate duration between two dates
export const calculateDuration = (startDate, endDate) => {
  try {
    const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
    return differenceInDays(end, start) + 1;
  } catch {
    return 0;
  }
};

// Format duration to human readable text
export const formatDuration = (days) => {
  if (days > 7) {
    const weeks = Math.ceil(days / 7);
    return `${weeks} สัปดาห์ (${days} วัน)`;
  }
  return `${days} วัน`;
};

// Check if date is overdue
export const isOverdue = (dateStr) => {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    const now = new Date();
    return date < now;
  } catch {
    return false;
  }
};
