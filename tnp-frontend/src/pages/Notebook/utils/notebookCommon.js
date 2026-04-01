import { format } from "date-fns";
import { th } from "date-fns/locale";

export const formatDate = (date, formatStr = "dd/MM/yyyy") => {
  if (!date) return "";
  try {
    return format(new Date(date), formatStr, { locale: th });
  } catch {
    return "";
  }
};

export const getStatusColor = (status) => {
  if (status === "ได้งาน") return "success";
  if (status === "พิจารณา") return "info";
  if (status === "ยังไม่มีแผนทำ") return "warning";
  if (status === "หลุด" || status === "ไม่ได้งาน") return "error";
  return "default";
};

export const getStatusStyle = () => {
  // Return styles compatible with react-pdf or generic style objects if needed
  // For now, this mimics the logic in pdfUtils but returns simple color strings for MUI
  // Use getStatusColor for MUI components
  return {};
};
