// 📁utils/deliveryNoteFormatters.js

// Re-export shared currency formatter
export { formatTHB } from "../../Invoices/utils/format";

// Delivery note status → MUI Chip color
export const deliveryStatusConfig = {
  preparing: { color: "default", label: "เตรียมส่ง" },
  shipping: { color: "primary", label: "กำลังส่ง" },
  in_transit: { color: "warning", label: "ระหว่างขนส่ง" },
  delivered: { color: "success", label: "ส่งแล้ว" },
  completed: { color: "info", label: "เสร็จสิ้น" },
  approved: { color: "success", label: "อนุมัติ" },
  failed: { color: "error", label: "ส่งไม่สำเร็จ" },
};

export const getDeliveryStatusColor = (status) => {
  switch (status) {
    case "preparing":
      return "default";
    case "shipping":
    case "in_transit":
      return "info";
    case "delivered":
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return "default";
  }
};
