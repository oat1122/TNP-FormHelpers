import { StyleSheet } from "@react-pdf/renderer";

import { formatDate as commonFormatDate } from "./notebookCommon";

// Styles
export const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Kanit",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  table: {
    display: "table",
    width: "100%",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
  },
  tableCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  // Column widths
  colDate: { width: "7.5%" },
  colTime: { width: "5.5%" },
  colCustomer: { width: "13.5%" },
  colAdditional: { width: "17%" },
  colContact: { width: "8%" },
  colEmail: { width: "12.5%" },
  colPerson: { width: "11%" },
  colAction: { width: "8%" },
  colStatus: { width: "5.5%" },
  colRemarks: { width: "11.5%" },
  // Text styles
  headerText: {
    fontWeight: 600,
    fontSize: 8,
    lineHeight: 1.3,
  },
  cellText: {
    fontSize: 8,
    lineHeight: 1.35,
    maxWidth: "100%",
    flexShrink: 1,
  },
  cellTextCompact: {
    fontSize: 7,
    lineHeight: 1.35,
    maxWidth: "100%",
    flexShrink: 1,
  },
  cellTextEmpty: {
    color: "#a0a7b4",
  },
  statusSuccess: { color: "#2e7d32" },
  statusInfo: { color: "#1976d2" },
  statusWarning: { color: "#ed6c02" },
  statusError: { color: "#d32f2f" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
  historyRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  historyDateCell: {
    width: "15%",
    padding: 6,
    paddingLeft: 10,
  },
  historyDetailCell: {
    width: "85%",
    padding: 6,
  },
  historyText: {
    fontSize: 8,
    color: "#555",
  },
});

export const formatDate = (dateStr, withTime = false) => {
  if (!dateStr) return "-";
  return commonFormatDate(dateStr, withTime ? "dd/MM/yy HH:mm" : "dd/MM/yy");
};

export const getStatusStyle = (status) => {
  if (status === "ได้งาน") return styles.statusSuccess;
  if (status === "พิจารณา") return styles.statusInfo;
  if (status === "ยังไม่มีแผนทำ") return styles.statusWarning;
  if (status === "หลุด" || status === "ไม่ได้งาน") return styles.statusError;
  return {};
};

export const FIELD_LABELS = {
  nb_date: "วันที่",
  nb_time: "เวลา",
  nb_customer_name: "ชื่อลูกค้า",
  nb_is_online: "ออนไลน์",
  nb_additional_info: "ข้อมูลเพิ่มเติม",
  nb_contact_number: "เบอร์ติดต่อ",
  nb_email: "อีเมล",
  nb_contact_person: "ผู้ติดต่อ",
  nb_action: "การกระทำ",
  nb_status: "สถานะ",
  nb_remarks: "หมายเหตุ",
  nb_manage_by: "ผู้ดูแล",
  nb_converted_at: "วันที่ convert",
};

export const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "" || value === "-")
    return "(ไม่มีข้อมูล)";
  if (key.includes("date") || key.includes("at"))
    return formatDate(value, key.includes("time") || key.includes("at"));
  if (key === "nb_is_online") return value ? "Yes" : "No";
  return String(value);
};

export const getHistoryChanges = (history) => {
  // 1. Only show if action is 'updated'
  if (history.action !== "updated") return [];

  try {
    const oldVals =
      typeof history.old_values === "string"
        ? JSON.parse(history.old_values)
        : history.old_values || {};
    const newVals =
      typeof history.new_values === "string"
        ? JSON.parse(history.new_values)
        : history.new_values || {};
    const displayOldVals =
      typeof history.display_old_values === "string"
        ? JSON.parse(history.display_old_values)
        : history.display_old_values || {};
    const displayNewVals =
      typeof history.display_new_values === "string"
        ? JSON.parse(history.display_new_values)
        : history.display_new_values || {};

    // If it's not an update or no new values, just show action
    if (!newVals || Object.keys(newVals).length === 0) return [];

    const changes = [];
    Object.keys(newVals).forEach((key) => {
      // Skip ignored fields
      if (key === "updated_at" || key === "nb_time") return;

      const label = FIELD_LABELS[key] || key;
      const oldVal = formatValue(key, displayOldVals[key] ?? oldVals[key]);
      const newVal = formatValue(key, displayNewVals[key] ?? newVals[key]);

      // Only show if different
      if (oldVal !== newVal) {
        changes.push({ label, oldVal, newVal });
      }
    });

    return changes;
  } catch {
    return [];
  }
};
